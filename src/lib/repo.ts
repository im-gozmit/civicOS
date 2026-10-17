import { transaction } from "@/lib/db";
import type { Tx } from "@/lib/db";
import { decryptField, encryptField } from "@/lib/crypto";
import type { Complaint, ComplaintStatus, Conversation, Notification } from "@/lib/types";

// All reads and writes of complaints, notifications and conversations go through here, so the
// rest of the app never writes SQL, and personal data is encrypted in exactly one place.

interface ComplaintRow {
  data: Complaint;
}

/** Older rows may hold the JSON as a quoted string; read them as the object they were meant to be. */
function asObject<T>(value: T | string): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}

function fromRow(row: ComplaintRow): Complaint {
  const c = structuredClone(asObject(row.data));
  c.senderPhone = decryptField(c.senderPhone);
  return c;
}

function toData(c: Complaint): string {
  return JSON.stringify({ ...c, senderPhone: encryptField(c.senderPhone) });
}

/** Operations available inside one database transaction. */
export class Repo {
  constructor(private tx: Tx) {}

  // ---- complaints ----
  async getComplaint(id: string, lock = false): Promise<Complaint | undefined> {
    const rows = await this.tx.query<ComplaintRow>(`select data from complaints where id = $1${lock ? " for update" : ""}`, [id]);
    return rows[0] ? fromRow(rows[0]) : undefined;
  }

  async getComplaintByTicket(ticketId: string, lock = false): Promise<Complaint | undefined> {
    const rows = await this.tx.query<ComplaintRow>(`select data from complaints where lower(ticket_id) = lower($1)${lock ? " for update" : ""}`, [ticketId]);
    return rows[0] ? fromRow(rows[0]) : undefined;
  }

  async getComplaintByToken(token: string): Promise<Complaint | undefined> {
    const rows = await this.tx.query<ComplaintRow>("select data from complaints where tracking_token = $1", [token]);
    return rows[0] ? fromRow(rows[0]) : undefined;
  }

  async listComplaints(): Promise<Complaint[]> {
    const rows = await this.tx.query<ComplaintRow>("select data from complaints order by created_at desc");
    return rows.map(fromRow);
  }

  async listForSender(senderKey: string, limit = 5): Promise<Complaint[]> {
    const rows = await this.tx.query<ComplaintRow>("select data from complaints where sender_key = $1 order by created_at desc limit $2", [senderKey, limit]);
    return rows.map(fromRow);
  }

  /** Open complaints of one category inside a small box around a point: candidates for duplicate matching. */
  async listNearbyOpen(category: string, lat: number, lng: number, degrees: number, sinceIso: string): Promise<Complaint[]> {
    const rows = await this.tx.query<ComplaintRow>(
      `select data from complaints
        where category = $1
          and status not in ('CLOSED', 'REJECTED', 'DUPLICATE')
          and created_at >= $2
          and latitude between $3 and $4
          and longitude between $5 and $6`,
      [category, sinceIso, lat - degrees, lat + degrees, lng - degrees, lng + degrees],
    );
    return rows.map(fromRow);
  }

  /** Complaints that already contain this exact photo (by its hash), anywhere. */
  async findByMediaHash(hash: string): Promise<Complaint[]> {
    const rows = await this.tx.query<ComplaintRow>("select data from complaints where data->'mediaHashes' ? $1", [hash]);
    return rows.map(fromRow);
  }

  /** Reports that staff linked to the given main report as duplicates. */
  async linkedTo(primaryId: string): Promise<Array<{ id: string; ticketId: string }>> {
    const rows = await this.tx.query<{ id: string; ticket_id: string }>(
      "select id, ticket_id from complaints where data->'duplicateOf'->>'id' = $1 order by ticket_no",
      [primaryId],
    );
    return rows.map((r) => ({ id: r.id, ticketId: r.ticket_id }));
  }

  /** Current status of several complaints at once (used to label duplicate candidates). */
  async statusesOf(ids: string[]): Promise<Record<string, ComplaintStatus>> {
    if (ids.length === 0) return {};
    // One simple parameter per id: the hosted driver handles those the same way as the local one.
    const marks = ids.map((_, i) => "$" + (i + 1) + "::uuid").join(", ");
    const rows = await this.tx.query<{ id: string; status: ComplaintStatus }>(`select id, status from complaints where id in (${marks})`, ids);
    return Object.fromEntries(rows.map((r) => [r.id, r.status]));
  }

  /** True if a photo or voice file belongs to some complaint (so the admin file route never serves strangers' files). */
  async fileIsKnown(file: string): Promise<boolean> {
    const rows = await this.tx.query(
      `select 1 from complaints
        where data->'mediaFiles' ? $1 or data->'audioFiles' ? $1 or data @> $2::text::jsonb
        limit 1`,
      [file, JSON.stringify({ repairChecks: [{ file }] })],
    );
    return rows.length > 0;
  }

  /** Totals for the public home page: counts only, never any detail about a report. */
  async publicCounts(): Promise<{ received: number; working: number; fixed: number }> {
    const rows = await this.tx.query<{ received: string | number; working: string | number; fixed: string | number }>(
      `select
         count(*) filter (where status not in ('REJECTED', 'DUPLICATE')) as received,
         count(*) filter (where status in ('ASSIGNED', 'IN_PROGRESS', 'RESOLVED_PENDING_VERIFICATION', 'REOPENED')) as working,
         count(*) filter (where status = 'CLOSED') as fixed
       from complaints`,
    );
    return { received: Number(rows[0].received), working: Number(rows[0].working), fixed: Number(rows[0].fixed) };
  }

  async nextTicketNo(): Promise<number> {
    const rows = await this.tx.query<{ n: string | number }>("select nextval('ticket_seq') as n");
    return Number(rows[0].n);
  }

  async insertComplaint(c: Complaint, ticketNo: number): Promise<void> {
    await this.tx.query(
      `insert into complaints (id, ticket_no, ticket_id, tracking_token, sender_key, status, category, latitude, longitude, created_at, data)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::text::jsonb)`,
      [c.id, ticketNo, c.ticketId, c.trackingToken, c.senderKey, c.status, c.category, c.latitude, c.longitude, c.createdAt, toData(c)],
    );
  }

  async saveComplaint(c: Complaint): Promise<void> {
    await this.tx.query("update complaints set sender_key = $2, status = $3, category = $4, data = $5::text::jsonb where id = $1", [
      c.id,
      c.senderKey,
      c.status as ComplaintStatus,
      c.category,
      toData(c),
    ]);
  }

  // ---- notifications ----
  async insertNotification(n: Notification): Promise<void> {
    await this.tx.query("insert into notifications (id, complaint_id, state, created_at, data) values ($1, $2, $3, $4, $5::text::jsonb)", [
      n.id,
      n.complaintId,
      n.state,
      n.createdAt,
      JSON.stringify(n),
    ]);
  }

  async getNotification(id: string, lock = false): Promise<Notification | undefined> {
    const rows = await this.tx.query<{ data: Notification }>(`select data from notifications where id = $1${lock ? " for update" : ""}`, [id]);
    return rows[0] ? asObject(rows[0].data) : undefined;
  }

  async saveNotification(n: Notification): Promise<void> {
    await this.tx.query("update notifications set state = $2, data = $3::text::jsonb where id = $1", [n.id, n.state, JSON.stringify(n)]);
  }

  async notificationsFor(complaintId: string, limit = 5): Promise<Notification[]> {
    const rows = await this.tx.query<{ data: Notification }>("select data from notifications where complaint_id = $1 order by created_at desc limit $2", [complaintId, limit]);
    return rows.map((r) => asObject(r.data));
  }

  async pendingNotificationIds(): Promise<string[]> {
    const rows = await this.tx.query<{ id: string }>("select id from notifications where state = 'PENDING' order by created_at");
    return rows.map((r) => r.id);
  }

  async countNotifications(): Promise<number> {
    const rows = await this.tx.query<{ n: string | number }>("select count(*) as n from notifications");
    return Number(rows[0].n);
  }

  // ---- conversations ----
  async getConversation(senderKey: string, lock = false): Promise<Conversation | undefined> {
    const rows = await this.tx.query<{ data: Conversation }>(`select data from conversations where sender_key = $1${lock ? " for update" : ""}`, [senderKey]);
    if (!rows[0]) return undefined;
    const conv = structuredClone(asObject(rows[0].data));
    conv.phone = decryptField(conv.phone);
    return conv;
  }

  async saveConversation(conv: Conversation): Promise<void> {
    const data = JSON.stringify({ ...conv, phone: encryptField(conv.phone), updatedAt: new Date().toISOString() });
    await this.tx.query(
      `insert into conversations (sender_key, updated_at, data) values ($1, now(), $2::text::jsonb)
       on conflict (sender_key) do update set updated_at = now(), data = excluded.data`,
      [conv.senderKey, data],
    );
  }
}

/** Run several operations as one all-or-nothing transaction. */
export function withRepo<T>(fn: (repo: Repo) => Promise<T>): Promise<T> {
  return transaction((tx) => fn(new Repo(tx)));
}
