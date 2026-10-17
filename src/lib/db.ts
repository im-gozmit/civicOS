import path from "path";
import { SCHEMA_SQL } from "@/lib/schemaSql";

// One tiny database interface with two engines behind it:
//  - DATABASE_URL set   -> real Postgres (Supabase), through the connection pooler
//  - DATABASE_URL unset -> PGlite, a real Postgres running inside this process, saved under
//                          .data/pgdata. Local development needs no account and no Docker.
// The same SQL runs on both, so what we test is what runs in production.

export type Row = Record<string, unknown>;

export interface Tx {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>;
}

interface Backend extends Tx {
  kind: "postgres" | "pglite";
  close(): Promise<void>;
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
}

declare global {
  var __sudhaar_db__: Promise<Backend> | undefined;
}

async function openPostgres(url: string): Promise<Backend> {
  const { default: postgres } = await import("postgres");
  const local = /@(localhost|127\.0\.0\.1)/.test(url);
  const sql = postgres(url, {
    max: 3,
    prepare: false, // required by Supabase's transaction pooler
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: local ? false : "require",
    onnotice: () => {}, // "already exists, skipping" notices are expected when re-running the migration
  });
  // Without parameters the simple query protocol is used, which also allows several statements
  // at once (needed to apply the schema).
  const run = (c: { unsafe: (t: string, p?: never[]) => Promise<unknown> }, text: string, params: unknown[] = []) =>
    (params.length > 0 ? c.unsafe(text, params as never[]) : c.unsafe(text)) as Promise<Row[]>;
  return {
    kind: "postgres",
    close: () => sql.end({ timeout: 5 }),
    query: <T = Row>(text: string, params?: unknown[]) => run(sql, text, params) as Promise<T[]>,
    transaction: (fn) => sql.begin((tx) => fn({ query: <T = Row>(text: string, params?: unknown[]) => run(tx, text, params) as Promise<T[]> })) as never,
  };
}

async function openPglite(): Promise<Backend> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = path.join(process.env.DATA_DIR || path.join(process.cwd(), ".data"), "pgdata");
  const db = new PGlite(dir);
  await db.exec(SCHEMA_SQL); // local database: always bring the schema up to date
  return {
    kind: "pglite",
    close: () => db.close(),
    query: async <T = Row>(text: string, params?: unknown[]) => (await db.query(text, params)).rows as T[],
    transaction: (fn) => db.transaction((tx) => fn({ query: async <T = Row>(text: string, params?: unknown[]) => (await tx.query(text, params)).rows as T[] })),
  };
}

export function getDb(): Promise<Backend> {
  if (!globalThis.__sudhaar_db__) {
    const url = process.env.DATABASE_URL;
    globalThis.__sudhaar_db__ = url ? openPostgres(url) : openPglite();
  }
  return globalThis.__sudhaar_db__;
}

export async function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return (await getDb()).transaction(fn);
}

export async function query<T = Row>(text: string, params?: unknown[]): Promise<T[]> {
  return (await getDb()).query<T>(text, params);
}

/** Closes connections so a command-line script can exit cleanly. */
export async function closeDb(): Promise<void> {
  const pending = globalThis.__sudhaar_db__;
  if (!pending) return;
  globalThis.__sudhaar_db__ = undefined;
  await (await pending).close();
}

/** Applies the schema. Used by `npm run db:migrate` for the hosted database. */
export async function migrate(): Promise<"postgres" | "pglite"> {
  const db = await getDb();
  if (db.kind === "postgres") await db.query(SCHEMA_SQL);
  return db.kind;
}
