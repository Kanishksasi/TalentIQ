# TalentIQ

TalentIQ is a mobile-first career-fair application for any recruiting team. Candidates use QR or event code **12345**, enter their contact details, scan or upload a resume, and check in. Interviewers use a searchable queue and pipeline, capture notes and consented interview recordings with saved transcripts and quick notes, review cited Groq interview questions, and export an Excel workbook. No iOS app or Xcode setup is required.

The redesigned application lives in `web/`. See [web/VERCEL-SETUP.md](web/VERCEL-SETUP.md) for Neon database setup and Vercel deployment. The original hosted Sites application is a previous version; local changes do not update it automatically.

For a capstone walkthrough, use the [presentation runbook](docs/DEMO_RUNBOOK.md).

## Run checks

```sh
cd web
npm ci
npm run build
npm test
npm run check
```

Run `npm run dev:demo` inside `web` for a local preview with explicitly synthetic data. Production uses Neon Postgres and server-only Groq credentials; no database or secrets are bundled in the ZIP. Follow the deployment guide’s live phone/Groq verification before collecting real candidate records.
