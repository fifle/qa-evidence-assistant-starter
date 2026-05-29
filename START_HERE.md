# START HERE — NTD 2026 Workshop

**Session:** Vibe-Coding for Testers — Building Custom Testing Tools Without Pinging Your Engineering Team

**Goal:** Extend this starter app into a **QA Evidence Assistant** that helps testers draft bug reports from HAR files, console logs, and notes.

## What you have

- A working React + TypeScript + Vite app
- HAR parser, redaction helpers, signal detection skeleton, markdown report builder
- Sanitized sample files in `samples/`
- Prompt pack in `prompts/` for guided AI exercises

## Run the app

```bash
npm install
npm run dev
```

In Coder: open the **React App** tab or forwarded port **5173**.

## Try this first

1. Upload `samples/har/checkout-409-conflict.sanitized.har`
2. Paste text from `samples/logs/checkout-console-error.txt` into Console logs
3. Add a short note: *"Clicked checkout after selecting 2pm slot; UI showed generic error."*
4. Click **Generate report**

## Workshop prompts

Work through `prompts/` in order:

1. `01-understand-project.md` — explore only, no edits
2. `02-plan-booking-conflict.md` — plan the booking conflict rule
3. `03-implement-booking-conflict.md` — implement one bounded change
4. `04-review-multiple-roles.md` — review as tester, dev, security, maintainer
5. `05-harden-tool.md` — redaction, validation, tests
6. `06-write-docs.md` — document the feature

## If your AI tool does not work

- Use the terminal: `npm run test` to verify logic
- Read `src/features/evidence-assistant/signalRules.ts` — booking conflict may already be partially implemented
- Pair with a neighbor or ask the facilitator

## Solution branch

A reference solution may be shared after the session. Do not create a solution branch locally unless the facilitator asks — focus on learning by building.

## Rules of the road

- **Facts vs assumptions** — the report must not claim root cause with certainty
- **Redact sensitive data** — never paste real tokens or customer emails
- **Keep it readable** — prefer simple functions over clever abstractions

Good luck — happy vibe-coding!
