import { describe, expect, it } from "vitest";
import { parseHarJson } from "./harParser";
import { buildReport } from "./reportBuilder";
import { detectAllSignals } from "./signalRules";
import { redactHarEntries } from "./reportBuilder";
import type { EvidenceInput } from "./evidenceTypes";

describe("harParser", () => {
  it("handles invalid JSON gracefully", () => {
    const result = parseHarJson("{ not json");
    expect(result.entries).toHaveLength(0);
    expect(result.warnings[0]).toMatch(/Invalid HAR JSON/);
  });

  it("parses a minimal HAR entry", () => {
    const har = JSON.stringify({
      log: {
        entries: [
          {
            startedDateTime: "2026-01-01T00:00:00Z",
            time: 100,
            request: { method: "GET", url: "https://demo.test/api/health", headers: [] },
            response: { status: 200, statusText: "OK", headers: [], content: { text: "ok" } },
          },
        ],
      },
    });
    const parsed = parseHarJson(har);
    expect(parsed.entries).toHaveLength(1);
    expect(parsed.entries[0].path).toBe("/api/health");
  });
});

describe("reportBuilder", () => {
  it("produces expected markdown sections", () => {
    const input: EvidenceInput = {
      testerNotes: "When I click checkout, I see an error.",
      consoleLogs: "[Error] checkout failed",
      environment: { environmentName: "staging", browser: "Chrome", device: "desktop", pageUrl: "https://demo.test/checkout" },
    };
    const harRaw = JSON.stringify({
      log: {
        entries: [
          {
            request: { method: "POST", url: "https://demo.test/api/bookings", headers: [] },
            response: { status: 409, statusText: "Conflict", headers: [], content: { text: "slot taken" } },
            time: 400,
          },
        ],
      },
    });
    const parsed = parseHarJson(harRaw);
    const { har } = redactHarEntries(parsed);
    const signals = detectAllSignals(har.entries);
    const report = buildReport(input, har, signals, []);

    expect(report.markdown).toContain("# Bug report draft");
    expect(report.markdown).toContain("## Title");
    expect(report.markdown).toContain("## Missing evidence");
    expect(report.markdown).toContain("## Developer checklist");
  });
});
