import { describe, expect, it } from "vitest";
import { detectBookingConflict, detectFailedRequest, detectAllSignals } from "./signalRules";
import type { ParsedHarEntry } from "./evidenceTypes";

const bookingConflictEntry: ParsedHarEntry = {
  method: "POST",
  url: "https://demo.test/api/bookings",
  path: "/api/bookings",
  status: 409,
  statusText: "Conflict",
  requestHeaders: {},
  responseHeaders: {},
  responseText: '{"message":"Selected slot is no longer available"}',
  totalTimeMs: 320,
  startedDateTime: "2026-06-04T10:00:00.000Z",
};

describe("signalRules", () => {
  it("detects booking conflict on 409 with booking path", () => {
    const signal = detectBookingConflict(bookingConflictEntry);
    expect(signal).not.toBeNull();
    expect(signal?.kind).toBe("booking_conflict");
    expect(signal?.developerChecklist).toBeTruthy();
  });

  it("detects failed requests", () => {
    const signal = detectFailedRequest({ ...bookingConflictEntry, status: 500, path: "/api/x" });
    expect(signal?.kind).toBe("server_error");
  });

  it("detects duplicates in detectAllSignals", () => {
    const duplicate: ParsedHarEntry = {
      ...bookingConflictEntry,
      status: 200,
      responseText: "ok",
    };
    const signals = detectAllSignals([duplicate, duplicate]);
    expect(signals.some((s) => s.kind === "duplicate_request")).toBe(true);
  });
});
