import { ALL_STATUSES } from "@/lib/transitions";

// The one database schema. It runs automatically against the local development database and is
// applied to Supabase with `npm run db:migrate`. Every statement is safe to run twice.
//
// Design: the columns we search, sort or protect are real columns; the rest of each record lives
// in one JSONB `data` column. That keeps the application logic simple while still giving real
// indexes, constraints, transactions and row locks.

const statuses = ALL_STATUSES.map((s) => `'${s}'`).join(", ");

export const SCHEMA_SQL = `
create sequence if not exists ticket_seq start 1;

create table if not exists complaints (
  id              uuid primary key,
  ticket_no       integer not null unique,
  ticket_id       text not null unique,
  tracking_token  text not null unique,
  sender_key      text not null,
  status          text not null check (status in (${statuses})),
  category        text not null,
  latitude        double precision not null check (latitude between -90 and 90),
  longitude       double precision not null check (longitude between -180 and 180),
  created_at      timestamptz not null,
  data            jsonb not null
);
create index if not exists complaints_sender_idx  on complaints (sender_key);
create index if not exists complaints_status_idx  on complaints (status);
create index if not exists complaints_created_idx on complaints (created_at desc);
create index if not exists complaints_geo_idx     on complaints (latitude, longitude);

create table if not exists notifications (
  id            uuid primary key,
  complaint_id  uuid not null references complaints (id) on delete cascade,
  state         text not null check (state in ('PENDING', 'SENT', 'FAILED')),
  created_at    timestamptz not null,
  data          jsonb not null
);
create index if not exists notifications_complaint_idx on notifications (complaint_id);
create index if not exists notifications_pending_idx   on notifications (state) where state = 'PENDING';

create table if not exists conversations (
  sender_key  text primary key,
  updated_at  timestamptz not null,
  data        jsonb not null
);

-- One row per WhatsApp message id we have already handled: Meta redelivers, we must act once.
create table if not exists wa_events (
  message_id   text primary key,
  received_at  timestamptz not null default now()
);

-- Shared rate limiting (works across server instances, unlike an in-memory counter).
create table if not exists rate_hits (
  key  text not null,
  at   timestamptz not null default now()
);
create index if not exists rate_hits_key_idx on rate_hits (key, at);

-- Nothing here is meant to be read from a browser. Row level security is switched on with NO
-- policies, so Supabase's public API keys can reach none of these tables. The app connects
-- from the server with the database role, which is allowed through.
alter table complaints     enable row level security;
alter table notifications  enable row level security;
alter table conversations  enable row level security;
alter table wa_events      enable row level security;
alter table rate_hits      enable row level security;
`;
