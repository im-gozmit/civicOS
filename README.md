# CivicOS

**Report. Track. Resolve.** An AI-assisted civic issue reporting platform, starting with Prayagraj, Uttar Pradesh.

A citizen sends a photo of a civic problem (pothole, garbage, blocked drain, broken street light) on **WhatsApp** or on the **website**, with a location, an optional caption and an optional voice note. AI reads the photo and text, rejects photos that are not civic issues, and **suggests which team should handle it**. A staff member **verifies that suggestion**, and only then is the citizen told. When work is done, staff upload an after-repair photo, AI gives an advisory opinion, and staff decide whether to close it.

> **Status: working prototype (hackathon build).** Data lives in Postgres (a built-in local database for development, Supabase when hosted), there is one admin account, and WhatsApp runs on Meta's free test number. Department queues are **simulated demo queues**, not a government integration.

The full plan is in [PROJECT_SPEC.md](PROJECT_SPEC.md).

## What works today

| Feature | State |
| --- | --- |
| WhatsApp: photo → location request → complaint number + tracking link | Working |
| Website: mobile report form (English/Hindi, camera, map pin, voice note) | Working |
| AI triage: civic or not, category, severity, summary, **suggested team** (Gemini, OpenAI fallback, keyword fallback) | Working with Gemini; OpenAI untested |
| Voice notes transcribed (Hindi/Hinglish/English) and fed into the analysis | Working (tested with English audio) |
| **Staff verify the suggested team** before the citizen hears about assignment | Working |
| Admin queue, detail page, validated status changes, internal notes | Working |
| WhatsApp update to the citizen on every status change (failures never undo a change) | Working |
| Before/after repair photo check (advisory) and closing rules | Working |
| Tracking link `/t/<token>` and minimal public lookup `/track` | Working |
| "Get updates on WhatsApp" for website reports (`TRACK <ticket> <token>`) | Working |
| **Duplicate detection**: new reports are compared with open ones nearby (same type, close, recent, identical photo); staff link or dismiss, nothing is merged automatically | Working |
| **Public issue map** `/map` with approximate positions and no private details | Working |
| Automated tests (48) | Passing |
| **Real database** (Postgres) and private file storage (Supabase), phone numbers encrypted at rest, rate limits and duplicate-message protection kept in the database | Working, tested locally and as a production build |
| Daily AI brief, templates for updates after 24 h, per-person admin accounts | Not built yet |

## How a report flows

1. Photo (+ optional caption, voice note, location) arrives from WhatsApp or the website.
2. One shared pipeline transcribes any voice note, asks the AI to judge the photo, and registers the complaint, or politely rejects a non-civic photo.
3. The complaint waits in **PENDING_VERIFICATION** with an AI-suggested team and the AI's reason.
4. Staff **confirm or correct** the team. Only now does it become *Assigned* and the citizen get a WhatsApp message.
5. Staff move it through *In progress* → *Resolved* (needs an after-repair photo) → *Closed*. Every move follows a central transition table.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Zod · Leaflet · Vitest · Postgres (Supabase; PGlite locally) · Meta WhatsApp Cloud API · Google Gemini (primary) · OpenAI (fallback).

> This Next.js version has breaking changes. Read the guides in `node_modules/next/dist/docs/` before changing framework code (see [AGENTS.md](AGENTS.md)).

## Getting started

Requirements: Node.js 20+ (developed on 24), a Google AI Studio key, and for WhatsApp a Meta developer account.

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev
```

The app runs at http://localhost:3000. Pages: `/` home, `/report`, `/track`, `/map`, `/admin`.

### Environment variables

Copy `.env.example` to `.env.local`. **Never commit `.env.local`.** It is git-ignored.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_BASE_URL` | Public address used in tracking links (your tunnel URL while testing) |
| `WHATSAPP_VERIFY_TOKEN` | Any random string; you enter the same value in Meta's webhook form |
| `WHATSAPP_APP_SECRET` | Meta App Dashboard → App settings → Basic → App secret |
| `WHATSAPP_ACCESS_TOKEN` | A **system-user token** (temporary test tokens expire within hours) |
| `WHATSAPP_PHONE_NUMBER_ID` | From the WhatsApp API Setup page |
| `WHATSAPP_BOT_NUMBER` | The bot's number, digits only; used for the website's `wa.me` links |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` | AI providers (OpenAI optional) |
| `AI_PROVIDER_ORDER`, `GEMINI_MODELS`, `OPENAI_MODELS` | Optional: provider and model order, tried in sequence |
| `SESSION_SECRET` | At least 32 random characters; signs the admin session |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The single admin account. There is no sign-up. Use a long password. |
| `DATABASE_URL` | Hosted Postgres (Supabase "Transaction pooler" string). Leave empty locally and a built-in database is used |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Private file storage for photos and voice notes. Leave empty locally and files go in `.data/media` |
| `PHONE_ENCRYPTION_KEY` | 64 hex characters; encrypts phone numbers in the database. **Back it up.** Required in production |
| `DATA_DIR` | Optional: where local data lives instead of `./.data` |

The app starts without any WhatsApp or AI credentials. Without AI it falls back to keyword triage and flags every report for human review.

## Deploying (Supabase + Vercel)

You need free accounts on **GitHub**, **Supabase** and **Vercel**.

1. **Supabase:** create a project (region Mumbai). Copy the *Transaction pooler* connection string (`DATABASE_URL`), the *Project URL* (`SUPABASE_URL`) and the *service_role* key (`SUPABASE_SERVICE_ROLE_KEY`) into `.env.local`.
2. Create the tables and the private photo bucket:
   ```bash
   npm run db:migrate
   ```
3. Optional: copy your old local test complaints into the hosted database (stop `npm run dev` first):
   ```bash
   npm run db:import
   ```
4. Push the code to GitHub, then in **Vercel** choose *Add New > Project*, import the repository, open *Environment Variables* and paste the contents of your `.env.local`. Change `PUBLIC_BASE_URL` to the project's `https://<name>.vercel.app` address (no trailing slash), and do not paste local-only values.
5. Deploy. Then in Meta, set the webhook callback URL to `https://<name>.vercel.app/api/v1/webhooks/whatsapp` with the same verify token. The address no longer changes, so this is a one-time step.
6. `vercel.json` raises the time limit for the webhook and report routes (AI work can take about a minute). Check that your Vercel plan allows it.

## Connecting WhatsApp (test number)

1. In the [Meta App Dashboard](https://developers.facebook.com/apps) create an app with the **Connect with customers through WhatsApp** use case.
2. On the API Setup page note the **Phone number ID** and **WhatsApp Business Account ID**, and add your own phone as a recipient (test numbers can only message listed recipients).
3. Create a **system user** in Business Settings, assign it the app and WhatsApp account with full control, and generate a token with `whatsapp_business_messaging` and `whatsapp_business_management`.
4. Expose your local server with a tunnel, for example:
   ```bash
   cloudflared tunnel --protocol http2 --url http://localhost:3000
   ```
   Quick tunnels get a new address every time you restart them; update the webhook URL and `PUBLIC_BASE_URL` when that happens.
5. In the dashboard's webhook settings use callback URL `https://<tunnel>/api/v1/webhooks/whatsapp` and your verify token, then subscribe to the `messages` field.
6. Subscribe the app to your WhatsApp Business Account (`POST /<WABA_ID>/subscribed_apps`), otherwise real messages will not be delivered to the webhook.

WhatsApp only allows free-form replies within 24 hours of the citizen's last message. Status updates after that need an approved template message, which is not built yet; such updates show as FAILED in the admin page.

## Useful commands

```bash
npm run dev                 # start the app
npm test                    # run the automated tests (they use a temporary data folder)
npm run lint                # ESLint
npx tsc --noEmit            # type-check
node scripts/try-triage.ts <photo.jpg> "caption"        # AI triage on one photo
node scripts/try-transcribe.ts <audio-file>             # speech-to-text on one file
node scripts/try-verify.ts <before.jpg> <after.jpg>     # before/after repair check
```

## Project layout

```text
src/
  app/                            pages: / , /report , /track , /t/[token] , /admin
  app/api/v1/                     reports, track, webhooks/whatsapp, admin/*
  components/public, /admin       report form, map picker, ticket lookup, admin forms
  lib/reportPipeline.ts           the one pipeline both channels use
  lib/complaints.ts               tickets, team verification, status changes, repair evidence
  lib/transitions.ts, teams.ts    allowed status moves; the fixed team list
  lib/duplicates.ts, publicMap.ts duplicate matching; what the public map may show
  lib/ai/                         triage, transcribe, verifyRepair (Gemini/OpenAI + validation)
  lib/whatsapp/                   signature check, Cloud API client, media, conversation state machine
  lib/notifications.ts            outbox with retries; failures never undo a status change
  lib/db.ts, repo.ts, schemaSql.ts  database access (Postgres / PGlite), queries, the one schema
  lib/storage.ts, crypto.ts        file storage (Supabase / local), phone-number encryption
  lib/events.ts, rateLimit.ts      logging, WhatsApp duplicate-delivery protection, rate limits
  lib/adminAuth.ts, uploads.ts
tests/                            Vitest tests
scripts/                          try-* helpers
PROJECT_SPEC.md                   full product and engineering spec
```

## Privacy and safety notes

- Reporter phone numbers are encrypted (AES-256-GCM) before they reach the database. Keep `PHONE_ENCRYPTION_KEY` safe: without it stored numbers cannot be read.
- Logs never contain phone numbers, message text or photos. Raw WhatsApp payloads are printed only if you set `WEBHOOK_DEBUG=1` locally.
- Database tables have row level security switched on with no policies, so Supabase's public keys cannot read them. Only the server connects. Photos are in a private bucket.
- `.data/` (local database and files) is git-ignored; do not share it.
- Tracking links use an unguessable token. The public ticket lookup reveals only category, status and last-updated time.
- The public map shows approximate positions (rounded and offset by roughly 100 m), the type of problem, a status label and the day of the report. No photos, text, ticket or tracking numbers, or contact details. Duplicate and rejected reports are hidden.
- Photos and voice notes are private: only a signed-in admin can open them.
- AI output is a suggestion. Staff verify the team and decide on closure; internal notes are never shown to citizens.
- Departments shown to citizens are labelled demo queues. CivicOS does not claim a government department has received a complaint.

## Roadmap

1. Per-person admin accounts (Supabase Auth) and PostGIS for location queries.
2. WhatsApp template messages for updates after 24 hours.
3. Citizen "is it fixed?" confirmation over WhatsApp.
4. Daily AI brief for staff, richer analytics.

See [PROJECT_SPEC.md](PROJECT_SPEC.md) for details.
