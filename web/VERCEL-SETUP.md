# TalentIQ · career-fair application

This package includes the redesigned application and a real server API. It is not a static-only website. Deploy the whole extracted folder, including `api`, `server`, `scripts`, `package.json`, and `vercel.json`.

## 1. Connect the database

In Vercel, open **talentiq-career-fair-vercel → Storage → Create Database → Neon Postgres** (or add Neon from the Marketplace). Connect it to this project and the **Production** environment. Use a separate database branch if you also deploy previews.

The application reads `DATABASE_URL`, with `POSTGRES_URL` as a fallback. If your integration uses another name, add its connection string as `DATABASE_URL` in the project’s environment variables. Keep it server-side.

Resume originals are stored privately in Postgres alongside account and candidate data, capped at 3 MB each. No Firebase project or public file bucket is required. This is suitable for the current career-fair scope; larger ongoing document volumes should move to private object storage.

## 2. Add server environment variables

Open **Settings → Environment Variables** for **talentiq-career-fair-vercel**. Add these to **Production** before deploying:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string; usually supplied by the integration |
| `GROQ_API_KEY` | Your existing Groq key |
| `RECRUITER_EMAILS` | The email you will use for interviewer sign-in; comma-separated allowlist |
| `RECRUITER_SETUP_TOKEN` | A private random value with at least 32 characters, used for initial interviewer setup |

Optional model overrides:

| Variable | Default |
| --- | --- |
| `GROQ_MODEL` | `openai/gpt-oss-20b` |
| `GROQ_VISION_MODEL` | `qwen/qwen3.8-27b` |
| `GROQ_AUDIO_MODEL` | `whisper-large-v3-turbo` |

Do not prefix these variables with `VITE_` or `NEXT_PUBLIC_`, add them to frontend files, or put real values in the ZIP. After any environment change, create a new deployment. Groq’s supported models can change; check its [vision documentation](https://console.groq.com/docs/vision) and [model list](https://console.groq.com/docs/models). The documented vision model is currently a preview model, so keep the override available and recheck provider support before your event.

The event code is fixed to **12345** in the server and UI. An old `ALLOWED_EVENT_CODES` variable does not override it.

## 3. Deploy the complete package

To update your current app, extract `TalentIQ-Career-Fair-Vercel.zip`, open the existing **talentiq-career-fair-vercel** project in the Vercel dashboard, and drop the **whole extracted folder** onto that project. For a project created through Drop without Git, this creates a new production deployment in the same project and uses its saved variables.

Alternatively, upload the ZIP to [Vercel Drop](https://vercel.com/drop). **Drop’s landing page creates a new project**, so a new project will need its own database connection and environment variables. Vercel Drop supports both static files and source projects; this package includes the server API and deployment configuration. See [Vercel’s Drop documentation](https://vercel.com/docs/drop).

Project settings:

- Framework: **Other**
- Root directory: the extracted folder containing `package.json`
- Install command: `npm install`
- Build command: `node scripts/prepare.mjs` (configured in `vercel.json`)
- Output directory: `public`
- Node.js: **24.x**

The build initializes the Postgres schema with `CREATE TABLE IF NOT EXISTS` and additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements inside a transaction. It never seeds demonstration candidates or overwrites existing records. If no database variable exists, the UI still deploys but honestly reports that check-in is unavailable. Connect the database and redeploy.

CLI alternative, from the extracted folder:

```sh
npm install
npx vercel link
npx vercel --prod
```

Choose your existing `talentiq-career-fair-vercel` project. Do not upload only `public`.

## 4. Activate interviewer access

Open the production site → **Interviewer → First interviewer? Set up access**. Enter the allowlisted email, your private setup token, and a new password of at least 12 characters. After this first setup, sign in with email and password. Initial setup does not trust a ChatGPT identity header on Vercel.

Remove `RECRUITER_SETUP_TOKEN` from Vercel and redeploy after setup. The current UI initializes one interviewer account. To provision additional allowlisted interviewers, add `DATABASE_URL`, `RECRUITER_EMAILS`, `INTERVIEWER_EMAIL`, and `INTERVIEWER_PASSWORD` to a private `.env.local` file in the extracted folder, then run `npm install` and `npm run interviewer:add`. Delete the extra provisioning password from that private file afterward. The script creates a new allowlisted account without resetting existing accounts. Do not reuse or share the first interviewer’s password.

## 5. Run the actual event checks

Visit `/api/health` on the production domain. Confirm:

```json
{
  "ok": true,
  "database": { "provider": "Neon Postgres", "connected": true },
  "uploads": { "provider": "Private Postgres documents", "configured": true },
  "aiConfigured": true,
  "interviewerConfigured": true,
  "eventCode": "12345"
}
```

`aiConfigured` confirms that a key is present, not that Groq accepted it. Use a clearly labeled test candidate to verify the complete flow:

1. Use a real phone over HTTPS. Enter **12345**, add name and contact details, and continue. There is no candidate login or password.
2. Photograph a synthetic resume with the in-app camera or upload a scanned PDF. Enable AI consent and choose **Extract resume with Groq**. Verify the text and education fields.
3. Record a short introduction with voice consent. Check the transcript, then submit.
4. Sign in as an interviewer. Verify the candidate appears, download the private resume, generate a brief, inspect the cited questions, and save notes.
5. Open the candidate → **Notes → Record interview**. Confirm permission from everyone present, record a conversation, and choose **Stop interview & create notes**. Verify the saved transcript, quick notes, highlights, and source excerpts. Add the draft to your conversation notes, review it, and save. Reopen the candidate to verify interview history persists.
6. Refresh or sign out/in as an interviewer to confirm records persist. Open a candidate → **Remove check-in**, confirm, and verify it disappears from the active queue and Excel export. Select **Removed check-ins** in the queue controls, open that record, and choose **Restore check-in**. Verify its resume and notes remain available.
7. Open **Event check-in** on the **production domain** and download the booth QR code. Scan that QR with another phone. It must open the production URL with `?event=12345`, not localhost or an obsolete preview URL.

Camera/microphone features require HTTPS (localhost is allowed for development), device permission, and browser support. QR scanning uses a bundled decoder, including on browsers without `BarcodeDetector`. File upload, native phone camera capture, manual event entry, and typed notes remain available as alternatives.

## Implemented safeguards and operating limits

- Only interviewers use authentication: secure HttpOnly cookies, hashed session tokens, password hashing, expiry, and server-side authorization. Candidate check-in requires no account, password, or auth service.
- Candidates cannot retrieve the queue, private recruiter notes, or other candidates’ records. Interviewer originals are served only after authentication.
- Same-origin checks protect writes. Candidate check-in, extraction, and transcription have database-backed request limits. Resume extraction and candidate voice introductions require event code 12345 and explicit consent; interviewer password failures also lock the account temporarily.
- Resume extraction, interview preparation, and recording require the relevant consent. AI drafts do not rank candidates or make hiring decisions.
- Candidate voice introductions stop after 60 seconds. Interview recordings support up to 20 minutes, with complete audio files sent about every 45 seconds, each under 3 MB. Keep the tab open and the phone awake while recording and saving.
- Interview transcripts are saved as ordered segments in private Postgres, with interviewer identity, duration, timestamps, and generated recap history. Raw audio is sent to Groq for processing but is not stored by TalentIQ; the latest segment can be played in the current browser session. A reload or closed tab loses unsaved audio, while already saved transcript segments remain.
- After Stop, the app saves pending segments and generates quick notes, highlights, and follow-up questions from the transcript. Each item cites an exact transcript excerpt. Speaker identities are not automatically verified. Review AI drafts before using them; adding a draft to manual notes never overwrites existing notes.
- Failed uploads can be retried without duplicating segments. If notes generation fails, the transcript remains available and the recording owner can retry Generate quick notes from Saved interviews. Transcript downloads and session history require interviewer authentication. A 45-second rotation briefly restarts the recorder; this is segmented capture, not guaranteed word-by-word live transcription.
- Removing a check-in also removes it from active workflows; its private interview history is retained with the record. Restoring it makes new recording available again.
- Readable PDFs are extracted locally; image resumes and scanned PDFs use Groq vision. Scanned PDFs support up to three pages. Candidate-entered details stay editable.
- Removed check-ins remain in a private Removed view, retain resumes/notes, and can be restored by interviewers. Removal is reversible and does not permanently purge the person’s data. Removal/restoration is audited; removed records are excluded from active queues and exports.
- Old candidate account tables, if present in an existing database, are left untouched and unused. Candidate login/register/session endpoints are disabled. No candidate accounts are created by this version.
- Interviewer accounts currently use email/password without self-service password reset or enterprise SSO. Candidate email addresses are contact details and are not identity-verified.
- The project still needs your live database and credentials. Local tests are not a substitute for the real phone/Groq smoke test above. Define access, retention, backup, and deletion practices with the event organizer before collecting real candidate data.

## What was verified

The former live package detected a Groq key but crashed on recruiter-session lookup. Its “D1”/“R2” health labels were hardcoded and its Vercel adapter supplied neither binding. This package replaces that missing persistence layer with Postgres and reports actual database readiness.

Automated tests use embedded **real Postgres** for accounts, records, private resume retrieval, notes, status changes, sessions, and consent checks. Provider responses are simulated in those tests; no Groq key is bundled. Browser checks cover check-in without a candidate account, interviewer removal/restore, saved interview transcripts and evidence-linked highlights, resume upload, interviewer login, notes, phone layouts, and console errors. Recorder lifecycle tests use a simulated microphone/MediaRecorder, and provider responses are simulated; physical phone microphones and live Groq processing still need the production smoke test. The live Groq integration and physical camera/microphone need the deployment checks above.

Design references: [Ashby’s recruiting workflows](https://www.ashbyhq.com/growth) inspired the queue/brief separation and evidence citations. The employer-neutral career-fair photographs are bundled locally. Inter is bundled under its included SIL Open Font License.
