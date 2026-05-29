import type { DetectedSignal, EvidenceInput, ParsedHar, ReportResult } from "./evidenceTypes";
import { redactHeaders, redactText, redactUrl } from "./redaction";

function formatSignalFacts(signals: DetectedSignal[]): string[] {
  return signals.map((s) => {
    let line = `- ${s.summary}`;
    if (s.entry) {
      const url = redactUrl(s.entry.url).text;
      line += ` (URL: ${url})`;
    }
    if (s.qaNote) line += `\n  - QA note: ${s.qaNote}`;
    if (s.developerChecklist) line += `\n  - Developer check: ${s.developerChecklist}`;
    if (s.automationIdea) line += `\n  - Automation idea: ${s.automationIdea}`;
    return line;
  });
}

function buildTitle(signals: DetectedSignal[], notes: string): string {
  const booking = signals.find((s) => s.kind === "booking_conflict");
  if (booking) return "Possible booking slot conflict during checkout";
  const server = signals.find((s) => s.kind === "server_error");
  if (server) return "Possible server error observed during testing";
  const auth = signals.find((s) => s.kind === "auth_failure");
  if (auth) return "Possible authentication failure during session";
  if (notes.trim()) {
    const firstLine = notes.trim().split("\n")[0].slice(0, 80);
    return firstLine || "Bug report draft from tester notes";
  }
  return "Bug report draft — needs more evidence";
}

function summarizeConsole(logs: string): string {
  if (!logs.trim()) return "_No console logs provided._";
  const redacted = redactText(logs);
  const lines = redacted.text.split("\n").filter(Boolean);
  const errors = lines.filter((l) => /error|exception|fail/i.test(l));
  const warnings = lines.filter((l) => /warn/i.test(l));
  const parts: string[] = [];
  if (errors.length) parts.push(`Observed ${errors.length} error-like line(s) (exact root cause not confirmed).`);
  if (warnings.length) parts.push(`Observed ${warnings.length} warning-like line(s).`);
  if (!parts.length) parts.push("Console output present; no obvious error keywords detected.");
  return parts.join(" ");
}

export function collectMissingEvidence(input: EvidenceInput, har: ParsedHar | null, signals: DetectedSignal[]): string[] {
  const missing: string[] = [];
  if (!input.environment.browser.trim()) missing.push("no browser provided");
  if (!input.environment.device.trim()) missing.push("no device provided");
  if (!har || har.entries.length === 0) missing.push("no HAR uploaded or HAR has no entries");
  if (!input.consoleLogs.trim()) missing.push("no console logs provided");
  if (!input.testerNotes.trim()) missing.push("no tester notes provided");
  if (!/step|repro|click|navigate|when/i.test(input.testerNotes)) {
    missing.push("no reproduction steps in notes");
  }
  if (har && !signals.some((s) => s.kind === "failed_request" || s.kind === "server_error" || s.kind === "booking_conflict")) {
    missing.push("no failed network requests found");
  }
  return missing;
}

export function buildReport(
  input: EvidenceInput,
  har: ParsedHar | null,
  signals: DetectedSignal[],
  redactionWarnings: string[]
): ReportResult {
  const missingEvidence = collectMissingEvidence(input, har, signals);
  const warnings = [...(har?.warnings ?? []), ...redactionWarnings];
  const title = buildTitle(signals, input.testerNotes);

  const env = input.environment;
  const signalFacts = formatSignalFacts(signals);

  const repro =
    input.testerNotes.trim().length > 0
      ? input.testerNotes.trim()
      : "_Not enough information — add tester notes with steps to reproduce._";

  const likelyArea =
    signals.length > 0
      ? "Possible affected area: network/API layer related to observed requests. Likely risk: user-visible failure or degraded flow. Needs confirmation from developers."
      : "_Needs confirmation — insufficient technical signals._";

  const devChecklist = signals.flatMap((s) => (s.developerChecklist ? [`- ${s.developerChecklist}`] : []));
  if (devChecklist.length === 0) {
    devChecklist.push("- Reproduce with the same environment and capture HAR + console logs.");
  }

  const automationIdeas = signals.flatMap((s) => (s.automationIdea ? [`- ${s.automationIdea}`] : []));
  while (automationIdeas.length < 2) {
    automationIdeas.push("- UI automation: cover the reported user path with assertions on visible error states.");
    automationIdeas.push("- API test: assert status codes and response bodies for the affected endpoints.");
    automationIdeas.push("- Monitoring: alert on elevated 4xx/5xx rates for the affected route.");
    break;
  }

  const markdown = `# Bug report draft

## Title

${title}

## Environment

- Environment: ${env.environmentName || "_not provided_"}
- Browser: ${env.browser || "_not provided_"}
- Device: ${env.device || "_not provided_"}
- Page URL: ${env.pageUrl ? redactUrl(env.pageUrl).text : "_not provided_"}

## Tester notes

${input.testerNotes.trim() || "_None provided._"}

## Observed technical signals

${signalFacts.length ? signalFacts.join("\n") : "_No network signals detected._"}

## Console signals

${summarizeConsole(input.consoleLogs)}

## Likely affected area

${likelyArea}

## Missing evidence

${missingEvidence.map((m) => `- ${m}`).join("\n") || "- None identified"}

## Suggested reproduction steps

${repro}

## Developer checklist

${devChecklist.join("\n")}

## Automation follow-up ideas

### UI automation
${automationIdeas.filter((_, i) => i % 3 === 0).join("\n") || "- Add a UI test for the reported flow."}

### API test
${automationIdeas.filter((_, i) => i % 3 === 1).join("\n") || "- Add contract tests for failing endpoints."}

### Monitoring / logging
${automationIdeas.filter((_, i) => i % 3 === 2).join("\n") || "- Track error rate and latency for affected routes."}
`;

  return { markdown, warnings, missingEvidence };
}

export function redactHarEntries(har: ParsedHar): { har: ParsedHar; warnings: string[] } {
  const warnings: string[] = [];
  let anySensitive = false;

  const entries = har.entries.map((entry) => {
    const urlResult = redactUrl(entry.url);
    const reqHeaders = redactHeaders(entry.requestHeaders);
    const resHeaders = redactHeaders(entry.responseHeaders);
    const body = redactText(entry.responseText);
    if (urlResult.hadSensitiveData || reqHeaders.hadSensitiveData || resHeaders.hadSensitiveData || body.hadSensitiveData) {
      anySensitive = true;
    }
    return {
      ...entry,
      url: urlResult.text,
      requestHeaders: reqHeaders.headers,
      responseHeaders: resHeaders.headers,
      responseText: body.text,
    };
  });

  if (anySensitive) {
    warnings.push("Sensitive-looking values were detected and redacted before display.");
  }

  return { har: { ...har, entries }, warnings };
}
