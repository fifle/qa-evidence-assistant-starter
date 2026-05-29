# AGENTS.md — QA Evidence Assistant

## Project rules

- **Frontend only** — no backend, database, or server-side code
- **No external APIs** — do not call OpenAI, Gemini, Anthropic, or any remote AI from this app
- **Local parsing only** — HAR and logs stay in the browser
- **Fake/sanitized data only** — use files under `samples/` for demos
- **Redact sensitive data** before displaying request/response details
- **Separate facts from assumptions** in generated reports
- **Do not overclaim root cause** — use cautious wording
- **Keep code readable** — simple TypeScript functions over abstractions
- **Keep UI accessible** — labels, semantic HTML, keyboard-friendly controls
- **Add tests** for pure logic in `*.test.ts` files

## Key files

| File | Purpose |
|------|---------|
| `harParser.ts` | Parse HAR JSON tolerantly |
| `signalRules.ts` | Detect network/console signals |
| `redaction.ts` | Redact tokens, emails, headers |
| `reportBuilder.ts` | Build markdown report |
| `EvidenceAssistant.tsx` | Main UI |

## Commands

```bash
npm run dev      # port 5173, host 0.0.0.0
npm run test     # vitest
npm run build    # typecheck + build
```
