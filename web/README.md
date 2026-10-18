# TalentIQ web application

TalentIQ is a mobile-first career-fair application for any recruiting team. Candidates join by QR or event code **12345**, enter their contact details, photograph or upload a resume, review their details, and check in. Interviewers get a searchable queue, pipeline, removable/restorable check-ins, private resume access, conversation notes, cited Groq interview briefs, and Excel export. Candidates can dictate introductions; interviewers can record up to 20 minutes, save transcripts, and generate evidence-linked quick notes and highlights.

For the deployable package, use [VERCEL-SETUP.md](VERCEL-SETUP.md). The Vercel adapter uses **Neon Postgres** for accounts, candidate records, and private resume files. The original Cloudflare Worker code is retained, but Vercel does not automatically provide its former D1/R2 bindings.

## Routes

- `/#intake` - candidate check-in
- `/#dashboard` - interviewer queue, pipeline, notes, stages, reviewed briefs and questions, and Excel export
- `/api/*` - shared server API

## Verification

Run `npm ci`, `npm run build`, `npm test`, and `npm run check`. Meaningful integration tests use embedded real Postgres and simulated Groq responses. `npm run package:vercel` writes the standalone deployment package to `../vercel-drop-web`.

Run `npm run dev` for a persistent local Postgres preview at `http://localhost:4175`. `npm run dev:demo` additionally seeds **synthetic** preview records and the local-only interviewer account `interviewer@example.test` / `Local-preview-12345`. The local database lives in ignored `.local-db/`. Demo records and that database are never included in the deployment ZIP. No AI responses are faked in the running preview.

Vercel needs `DATABASE_URL`, `GROQ_API_KEY`, `RECRUITER_EMAILS`, and `RECRUITER_SETUP_TOKEN`. The build initializes the database. The first interviewer uses the allowlisted email and private setup token to create a password. Additional interviewers can be provisioned with `scripts/provision-interviewer.mjs`. Candidates check in without accounts; private APIs enforce interviewer authentication and the interviewer allowlist. Self-service interviewer password reset and SSO are not implemented.

AI requires the relevant consent and a server-side Groq key. Readable PDF text is extracted locally; scanned PDFs (up to three pages) and photos use the configurable Groq vision model. Audio uses Whisper. Raw audio stays in the current browser session; reviewed transcripts can be saved in notes. See the setup guide for a required real-phone and live-Groq smoke test before event use.
