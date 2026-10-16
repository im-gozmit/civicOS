# CivicOS

**Report. Track. Resolve.** An AI-assisted civic issue reporting platform, starting with Prayagraj, Uttar Pradesh.

A citizen sends a photo of a civic problem (pothole, garbage, blocked drain, broken street light) on **WhatsApp**, shares a location pin, and gets back a **complaint number and a tracking link**. An AI model reads the photo and caption, suggests a category and severity, and rejects photos that are not civic issues.

> **Status: early prototype (hackathon build).** The WhatsApp reporting flow works end to end. The admin dashboard, status-change notifications, website report form, database and tests are not built yet. Department queues are **simulated demo queues**, not a government integration.

The full plan is in [PROJECT_SPEC.md](PROJECT_SPEC.md).

## What works today

| Feature | State |
| --- | --- |
| WhatsApp webhook (Meta Cloud API): signature check, duplicate-delivery protection, reply after acknowledging | Working |
| Photo → location request → complaint registered → reply with complaint number and tracking link | Working |
| AI triage of photo + caption (Gemini, OpenAI fallback, keyword fallback) | Working with Gemini; OpenAI untested |
| Non-civic or unusable photos are rejected with an explanation | Working |
| WhatsApp commands: `status CIV-000123`, `my complaints`, help | Working |
| Tracking page at `/t/<token>` (unguessable token) | Working (basic) |
| Voice notes | Saved, **not transcribed yet** |
| Website report form, admin dashboard, status notifications, database | Not started |

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · Zod · Meta WhatsApp Cloud API · Google Gemini (primary) · OpenAI (fallback). Data is kept in a local JSON file under `.data/` for now and will move to Supabase/Postgres.

> This Next.js version has breaking changes. Read the guides in `node_modules/next/dist/docs/` before changing framework code (see [AGENTS.md](AGENTS.md)).

## Getting started

Requirements: Node.js 20+ (developed on 24), a Meta developer account, and a Google AI Studio key.

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev
```

The app runs at http://localhost:3000.

### Environment variables

Copy `.env.example` to `.env.local`. **Never commit `.env.local`.** It is git-ignored.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_BASE_URL` | Public address used in tracking links (your tunnel URL while testing) |
| `WHATSAPP_VERIFY_TOKEN` | Any random string; you enter the same value in Meta's webhook form |
| `WHATSAPP_APP_SECRET` | Meta App Dashboard → App settings → Basic → App secret |
| `WHATSAPP_ACCESS_TOKEN` | A **system-user token** (temporary test tokens expire within hours) |
| `WHATSAPP_PHONE_NUMBER_ID` | From the WhatsApp API Setup page |
| `GEMINI_API_KEY` | Google AI Studio |
| `OPENAI_API_KEY` | Optional fallback |
| `AI_PROVIDER_ORDER`, `GEMINI_MODELS`, `OPENAI_MODELS` | Optional: provider/model order, tried in sequence |

If no AI key is set or every provider fails, the app falls back to keyword triage and flags the report for human review. The app still starts without any WhatsApp or AI credentials.

## Connecting WhatsApp (test number)

1. In the [Meta App Dashboard](https://developers.facebook.com/apps) create an app with the **Connect with customers through WhatsApp** use case.
2. On the API Setup page note the **Phone number ID** and **WhatsApp Business Account ID**, and add your own phone as a recipient (test numbers can only message listed recipients).
3. Create a **system user** in Business Settings, assign it the app and WhatsApp account with full control, and generate a token with `whatsapp_business_messaging` and `whatsapp_business_management`.
4. Expose your local server with a tunnel, for example:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
   Quick tunnels get a new address every time you restart them; update the webhook URL and `PUBLIC_BASE_URL` when that happens.
5. In the dashboard's webhook settings use callback URL `https://<tunnel>/api/v1/webhooks/whatsapp` and your verify token, then subscribe to the `messages` field.
6. Subscribe the app to your WhatsApp Business Account (`POST /<WABA_ID>/subscribed_apps`), otherwise real messages will not be delivered to the webhook.

Send a photo to the test number, then share a location, to register a complaint.

## Useful commands

```bash
npm run dev                 # start the app
npm run lint                # ESLint
npx tsc --noEmit            # type-check
node scripts/try-triage.ts <photo.jpg> "caption"   # run AI triage on one photo
```

## Project layout

```text
src/
  app/api/v1/webhooks/whatsapp/   Meta webhook (GET verify, POST events)
  app/t/[token]/                  Citizen tracking page
  lib/whatsapp/                   signature check, Cloud API client, media download, conversation state machine
  lib/ai/triage.ts                Gemini/OpenAI photo + caption triage with validation
  lib/complaints.ts               ticket creation, lookup, keyword fallback
  lib/localStore.ts               temporary JSON-file storage (.data/)
scripts/try-triage.ts             try the AI triage on a local photo
PROJECT_SPEC.md                   full product and engineering spec
```

## Privacy and safety notes

- Reporter phone numbers are stored **in plain text in a local file** during this prototype. This must be replaced by encrypted storage before any real use.
- Raw webhook events (which contain phone numbers) are logged to `.data/wa-events.jsonl`. `.data/` is git-ignored; do not share it.
- Tracking links use an unguessable token; ticket IDs alone are not treated as authorization.
- AI output is a suggestion. Every AI-triaged report can be flagged for human review, and the bot says so.
- Departments shown to citizens are labelled demo queues. CivicOS does not claim a government department has received a complaint.

## Roadmap

1. Admin page and WhatsApp updates when a complaint changes status.
2. Website report form using the same pipeline.
3. Voice-note transcription (Hindi and English).
4. Supabase/Postgres storage with PostGIS, authentication for admins, duplicate linking.
5. Advisory before/after repair verification.

See [PROJECT_SPEC.md](PROJECT_SPEC.md) for details.
