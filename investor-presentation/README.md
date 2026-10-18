# Talent IQ — Investor presentation

An independent investor presentation for the TalentIQ project, using its own navy and teal identity and an employer-neutral career-fair photograph.

## Open the website

Unzip the archive and open `website/index.html` in a modern browser. All website assets and Three.js are included locally; no installation or internet connection is required. For the best compatibility, serve the website folder over HTTP:

```sh
python3 -m http.server 4173 --directory website
```

Then visit http://localhost:4173.

## Present

Scroll to move through the three illustrated journey chapters. Chapter links jump to Capture, Review, and Validate. The procedural 3D models are visual metaphors for the recruiting workflow, not an affiliation with any employer. Their graphics show only TalentIQ messaging. Pause motion is available, and system reduced-motion preferences are respected. If WebGL is unavailable, the site displays the career-fair photograph and retains the complete presentation text.

## Content basis

Content is grounded in the workspace README and docs/PRODUCT_DIRECTION.md, docs/AI_EVALUATION.md, docs/STUDY_PROTOCOL.md, and docs/ACCESSIBILITY.md. The native app is an earlier prototype; the responsive browser app is the primary product. The comparative study and live-model evaluation are pending. The site does not claim measured efficiency gains, AI accuracy, hiring outcomes, or financial returns. This ZIP contains the presentation, not the candidate/recruiter application or a live backend.

## Edit and rebuild

The `source` folder includes editable HTML, CSS, JavaScript, assets, build script, and lockfile. From that folder:

```sh
npm ci
npm run build
npm run preview
```

Website content lives in `source/dist/index.html`, styling in `source/dist/styles.css`, and 3D animation in `source/src/presentation.js`. The build regenerates `source/dist/presentation.js`. Copy the updated `source/dist` contents into `website` when distributing.

## Asset and library sources

- Career-fair photograph: created for TalentIQ.
- Three.js 0.180.0: https://threejs.org/ (MIT license, included in THIRD_PARTY_LICENSES.txt).
- Three.js installation guidance: https://threejs.org/manual/pages/installation.html

TalentIQ is presented as an independent platform and does not assert endorsement by any employer.
