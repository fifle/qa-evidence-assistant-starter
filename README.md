# QA Evidence Assistant — Workshop Starter

Browser-based QA utility for Nordic Testing Days 2026: **Vibe-Coding for Testers**.

Turn tester notes, HAR files, and console logs into a structured bug report draft — **100% client-side**.

## Quick start (local)

```bash
npm install
npm run dev
```

Open the forwarded port **5173** in Coder / VS Code Web.

## Quick start (Coder workspace)

1. Open your cloud workspace (VS Code Web).
2. Run `npm install` if needed.
3. Run `npm run dev`.
4. Open the forwarded port **5173**.
5. Upload `samples/har/checkout-409-conflict.sanitized.har`.
6. Click **Generate report**.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on `0.0.0.0:5173` |
| `npm run build` | Production build |
| `npm run test` | Vitest unit tests |

## Project structure

- `src/features/evidence-assistant/` — HAR parsing, signals, redaction, report builder
- `src/components/` — UI building blocks
- `samples/` — sanitized HAR and console log fixtures
- `prompts/` — AI pair-programming exercises for the workshop

See **START_HERE.md** for the workshop walkthrough.

## Constraints

- Frontend only — no backend, no database, no external API calls
- HAR files processed locally; never uploaded by this app
- Use sanitized sample data only during the workshop
