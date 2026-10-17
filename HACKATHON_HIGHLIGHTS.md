# Sudhaar: what makes it stand out

> **Report. Track. Resolve.** A civic-issue platform for Prayagraj. A citizen sends a photo on WhatsApp, gets a
> complaint number in under 60 seconds, and follows it until it is fixed. Built during the Azad Buildathon.

This file is a cheat sheet for judges and demos. Everything listed here is **already built and working**; the last
section is honest about what is a demo and what comes next. (Judges respect that, and it protects you from awkward questions.)

---

## 1. The 10 things judges will not have seen before

### 1. WhatsApp-first, under 60 seconds, with no app and no sign-up
- Citizen sends **one photo**, shares a **location pin**, and gets a **complaint number + a private tracking link** back on WhatsApp.
- Runs on the **real Meta WhatsApp Cloud API** (a real number, real messages), not a simulator.
- Works with **voice notes** and **Hindi or English captions**. A photo plus a voice note is enough.
- *Why it matters:* India already lives on WhatsApp. Zero install, zero training, works on a basic smartphone.

### 2. A coordinated agent workforce, not one big prompt
Each agent owns one civic job, explains what it saw, and can be upgraded on its own:

| Agent | What it does |
|---|---|
| **Vision** | Understands the problem from the photo; **rejects photos that are not civic issues** |
| **Speech** | Transcribes voice notes (Hindi/English) and translates them for staff |
| **Severity** | Low / medium / high / critical, with the reason in plain words |
| **Routing** | Suggests the responsible team |
| **Duplicate** | Spots repeat reports of the same problem |
| **Summary** | One clear line plus hazards noticed, so staff read a line, not a story |
| **Safety** | Treats captions and text inside photos as **data, never as instructions** (prompt-injection aware) |
| **Verification** | Gives an opinion on whether the after-repair photo shows a real fix |

The report page shows them **working live** in a terminal-style view, then a "what each agent did" card with real results.

### 3. Human in the loop by design (the opposite of "AI decides")
- AI only **suggests**. A staff member **verifies the team before the citizen is told anything**.
- Closing a complaint needs a person; the AI opinion on the repair photo is **advisory**.
- A strict **status state machine** blocks illegal jumps (for example you cannot close a complaint nobody worked on).
- The staff dashboard shows how often staff **accept the AI's team suggestion**, a live measure of AI accuracy.

### 4. Works even when AI is down
- Gemini first, **OpenAI as automatic fallback**, then a **keyword-based fallback** if both fail.
- Outputs are **schema-validated** (Zod); malformed AI answers never reach the database.
- A report is never lost because an AI provider had a bad day.

### 5. "Where is this?" answered from the coordinates, honestly
- For every report: **district, tehsil, municipal body, locality and the nearest police station (thana)**, looked up from the map pin.
- Runs **in parallel with the AI**, so it adds no waiting.
- If the public map does not have a detail, the page says so plainly: *"The government keeps this map with itself, so it is not on the public map."* No made-up data.

### 6. Duplicates are linked, never silently merged
- Same problem nearby, same category, or the **exact same photo** (SHA-256 fingerprint) is flagged for staff.
- **Every citizen keeps their own complaint number and updates**; staff link reports so the work is done once.

### 7. Real evidence, before and after
- Staff upload an **after-repair photo**; the AI compares it with the original and gives an advisory verdict.
- Fake or reused photos are caught by the same fingerprint check.
- The citizen sees a **timeline** from "Citizen reported" to "Verified".

### 8. Privacy and security treated as features, not an afterthought
- **Phone numbers encrypted at rest** (AES-256-GCM, tamper-evident).
- Tracking links use an **unguessable 128-bit token**; ticket numbers alone never unlock anything.
- The **public map shows approximate spots only**: no photos, no names; duplicates and rejected reports are hidden.
- Photos in a **private storage bucket**, served only to signed-in staff.
- **Row-level security on**, WhatsApp **webhook signatures verified**, **rate limiting** shared across servers.
- Citizens can report **without giving a number**. Giving one is optional and the form says so.

### 9. Engineered like it will be used by thousands
- **Transactional outbox** for WhatsApp updates: a failed message never undoes a status change, and is retried.
- **Idempotent webhooks**: Meta redelivers messages; each is handled exactly once.
- **Row locks** so two staff members can never clash on the same complaint.
- Handles WhatsApp's **24-hour messaging window** explicitly and records why a message could not be sent.
- **66 automated tests**, including one that runs the **production database driver**.

### 10. Rooted in Prayagraj, not a generic template
- Hero with the **Chandra Shekhar Azad statue** at Azad Park and the **Sangam sunset**; Hindi (प्रयागराज) throughout.
- Built during the **Azad Buildathon**, credited with **Azad Reads** and **Azad Labs** on the home page.
- A one-tap switch between the **Prayagraj look** and a **Classic** plain look.

---

## 2. Citizen experience highlights

- **Live heatmap on the home page** of where Prayagraj is reporting problems (switch to pins to see status colours).
- **Website form** that works on a phone: camera or gallery, voice note, tap-the-map location, **English / हिन्दी toggle**; photos are shrunk in the browser so uploads are fast.
- **Optional WhatsApp updates** from the website, with a clear disclaimer and a one-tap "switch on updates".
- **Tracking page** with an issue timeline, progress steps and a status update on WhatsApp at every change.
- **"Demo" banner** on every page so nobody mistakes it for an official service.

## 3. Staff experience highlights

- A **prioritised queue**: flagged-for-review and high-severity items rise to the top; filter by status.
- One screen per complaint: photo, voice transcript, AI reasoning, jurisdiction, duplicate warnings, timeline, notification log and internal notes.
- **Verify-the-team** step, duplicate review and after-photo comparison are one click each.
- If a photo cannot be shown, the page says *why* (signed out, missing, server error) and offers a retry.

---

## 4. A 3-minute demo script

1. **(20s) The problem.** "Reporting a pothole means knowing which department, which office, which form. Sudhaar needs one photo."
2. **(40s) WhatsApp live.** Send a photo of a civic problem, share the pin, and show the **complaint number + tracking link arriving on the phone**.
3. **(30s) The agents.** Open the website form, submit a report, and let judges watch the **agent terminal** work, then show the "what each agent did" card.
4. **(30s) Where is it?** Point at **district / tehsil / ward / nearest thana**, and at the honest "not available" message where the public map has gaps.
5. **(40s) Staff side.** Sign in, **verify the suggested team** (only then does the citizen get told), show duplicate review.
6. **(20s) Close the loop.** Upload an after-photo, show the AI's advisory verdict and the citizen's WhatsApp update.
7. **(10s) The home page heatmap** and the Prayagraj identity. End on the "Report. Track. Resolve." line.

## 5. Likely judge questions, with straight answers

- **"Is the AI deciding things?"** No. It suggests; a person verifies the team and closes the complaint. That is a deliberate design choice.
- **"What if the AI is wrong or down?"** There is a second AI, then a keyword fallback; staff correct the team; outputs are validated.
- **"What about fake or malicious reports?"** Non-civic photos are rejected, identical photos are fingerprinted, text inside photos is treated as data, and there is rate limiting.
- **"Is citizen data safe?"** Phone numbers are encrypted, tracking uses secret tokens, the public map is approximate, photos are private.
- **"Is this an official government system?"** No, and it says so everywhere. Teams are **demo queues**; nothing is dispatched without a person.
- **"Can it scale?"** Postgres + serverless, shared rate limits, an outbox with retries and idempotent webhooks. Honest limit: the free map lookup allows about one request a second; production would self-host it.

---

## 6. Honest limits and the roadmap (say this before they ask)

**What is a demo today**
- Teams are **simulated demo queues**, not a live integration with Nagar Nigam or any department.
- WhatsApp runs on **Meta's free test number**. Free-form updates only work within 24 hours of the citizen's last message; **approved template messages** would remove that limit.
- Ward numbers and thana boundaries are **not on the public map**. The app shows the locality and the nearest police station and labels them as approximate.

**What comes next**
1. Official **ward and thana boundary data** from the Nagar Nigam and police, for exact jurisdiction.
2. Meta-approved **WhatsApp template messages** for updates after 24 hours.
3. A real **department integration** and officer-level routing, with SLA timers and escalation.
4. **Hindi replies** from the bot, plus voice replies for low-literacy users.
5. Public **resolution statistics** per ward, to build accountability.

---

*Stack, for the "how is it built" question:* Next.js 16, Postgres (Supabase; embedded Postgres for zero-setup local development),
Supabase private storage, Meta WhatsApp Cloud API, Gemini with OpenAI fallback, Tailwind, Vitest. Hosted on Vercel.
