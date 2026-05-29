import type { DetectedSignal, ParsedHarEntry } from "./evidenceTypes";

const BOOKING_PATH_KEYWORDS = [
  "booking",
  "bookings",
  "reservation",
  "reservations",
  "checkout",
  "availability",
  "room",
  "slot",
];

const BOOKING_RESPONSE_KEYWORDS = [
  "conflict",
  "unavailable",
  "already booked",
  "slot taken",
  "no longer available",
];

function pathMatchesBooking(url: string, path: string): boolean {
  const hay = `${url} ${path}`.toLowerCase();
  return BOOKING_PATH_KEYWORDS.some((k) => hay.includes(k));
}

function responseSuggestsBookingConflict(text: string): boolean {
  const lower = text.toLowerCase();
  return BOOKING_RESPONSE_KEYWORDS.some((k) => lower.includes(k));
}

export function detectBookingConflict(entry: ParsedHarEntry): DetectedSignal | null {
  if (entry.status !== 409) return null;
  if (!pathMatchesBooking(entry.url, entry.path) && !responseSuggestsBookingConflict(entry.responseText)) {
    return null;
  }

  return {
    kind: "booking_conflict",
    summary: `${entry.method} ${entry.path} returned 409 and response text suggests the selected slot may no longer be available.`,
    entry,
    qaNote:
      "Backend may be returning the conflict correctly, but the frontend should display a clear recoverable error state.",
    developerChecklist:
      "Verify conflict response payload, user-facing error copy, and whether the UI allows selecting another slot without losing context.",
    automationIdea:
      "API test: POST booking with a stale slot id expects 409 and structured error body; UI test: assert recoverable error state after conflict.",
  };
}

export function detectFailedRequest(entry: ParsedHarEntry): DetectedSignal | null {
  if (entry.status === null || entry.status < 400) return null;

  let kind: DetectedSignal["kind"] = "failed_request";
  if (entry.status >= 500) kind = "server_error";
  else if (entry.status === 401 || entry.status === 403) kind = "auth_failure";
  else if (entry.status === 400 || entry.status === 422) kind = "validation_failure";
  else if (entry.status === 409) kind = "conflict";

  return {
    kind,
    summary: `${entry.method} ${entry.path} returned HTTP ${entry.status} ${entry.statusText}`.trim(),
    entry,
  };
}

export function detectSlowRequest(entry: ParsedHarEntry, thresholdMs = 2000): DetectedSignal | null {
  if (entry.totalTimeMs === null || entry.totalTimeMs <= thresholdMs) return null;
  return {
    kind: "slow_request",
    summary: `${entry.method} ${entry.path} took ${Math.round(entry.totalTimeMs)} ms (>${thresholdMs} ms).`,
    entry,
  };
}

export function detectDuplicateRequests(entries: ParsedHarEntry[]): DetectedSignal[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const key = `${e.method}:${e.path}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const signals: DetectedSignal[] = [];
  for (const [key, count] of counts) {
    if (count > 1) {
      const [method, path] = key.split(":");
      signals.push({
        kind: "duplicate_request",
        summary: `${method} ${path} appears ${count} times in the HAR.`,
      });
    }
  }
  return signals;
}

export function detectEmptyFailedResponse(entry: ParsedHarEntry): DetectedSignal | null {
  if (entry.status === null || entry.status < 400) return null;
  if (entry.responseText.trim().length > 0) return null;
  return {
    kind: "empty_failed_response",
    summary: `${entry.method} ${entry.path} failed with ${entry.status} but response body is empty.`,
    entry,
  };
}

export function detectCorsSuspicion(entry: ParsedHarEntry): DetectedSignal | null {
  if (entry.status !== 0 && entry.status !== null) return null;
  const blocked = entry.responseText.toLowerCase().includes("cors") || entry.statusText.toLowerCase().includes("cors");
  if (!blocked && entry.status !== 0) return null;
  return {
    kind: "cors_suspicion",
    summary: `${entry.method} ${entry.path} may indicate a CORS or network-level failure (status ${entry.status ?? "unknown"}).`,
    entry,
  };
}

export function detectAllSignals(entries: ParsedHarEntry[]): DetectedSignal[] {
  const signals: DetectedSignal[] = [];
  const seenBooking = new Set<string>();

  for (const entry of entries) {
    const booking = detectBookingConflict(entry);
    if (booking) {
      const id = `${booking.entry?.method}:${booking.entry?.path}`;
      if (!seenBooking.has(id)) {
        signals.push(booking);
        seenBooking.add(id);
      }
      continue;
    }

    const failed = detectFailedRequest(entry);
    if (failed) signals.push(failed);

    const slow = detectSlowRequest(entry);
    if (slow) signals.push(slow);

    const empty = detectEmptyFailedResponse(entry);
    if (empty) signals.push(empty);

    const cors = detectCorsSuspicion(entry);
    if (cors) signals.push(cors);
  }

  signals.push(...detectDuplicateRequests(entries));
  return signals;
}
