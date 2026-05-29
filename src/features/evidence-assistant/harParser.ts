import type { HarFile, HarHeader } from "./harTypes";
import type { ParsedHar, ParsedHarEntry } from "./evidenceTypes";

function headersToRecord(headers: HarHeader[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!Array.isArray(headers)) return out;
  for (const h of headers) {
    if (h?.name) out[h.name] = h.value ?? "";
  }
  return out;
}

function extractPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function parseHarJson(raw: string): ParsedHar {
  const warnings: string[] = [];
  let data: HarFile;

  try {
    data = JSON.parse(raw) as HarFile;
  } catch {
    return { entries: [], warnings: ["Invalid HAR JSON — could not parse file."] };
  }

  const rawEntries = data?.log?.entries;
  if (!Array.isArray(rawEntries)) {
    return { entries: [], warnings: ["HAR file has no log.entries array."] };
  }

  const entries: ParsedHarEntry[] = rawEntries.map((entry, index) => {
    const req = entry.request;
    const res = entry.response;
    const url = req?.url ?? "";
    const status = typeof res?.status === "number" ? res.status : null;

    if (!url) warnings.push(`Entry ${index + 1}: missing request URL.`);

    return {
      method: (req?.method ?? "GET").toUpperCase(),
      url,
      path: extractPath(url),
      status,
      statusText: res?.statusText ?? "",
      requestHeaders: headersToRecord(req?.headers),
      responseHeaders: headersToRecord(res?.headers),
      responseText: res?.content?.text ?? "",
      totalTimeMs: typeof entry.time === "number" ? entry.time : null,
      startedDateTime: entry.startedDateTime ?? null,
    };
  });

  if (entries.length === 0) {
    warnings.push("HAR parsed successfully but contains zero entries.");
  }

  return { entries, warnings };
}
