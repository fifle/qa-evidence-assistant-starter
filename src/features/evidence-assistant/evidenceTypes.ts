export interface EnvironmentInfo {
  environmentName: string;
  browser: string;
  device: string;
  pageUrl: string;
}

export interface EvidenceInput {
  testerNotes: string;
  consoleLogs: string;
  environment: EnvironmentInfo;
  harFileName?: string;
}

export interface ParsedHarEntry {
  method: string;
  url: string;
  path: string;
  status: number | null;
  statusText: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  responseText: string;
  totalTimeMs: number | null;
  startedDateTime: string | null;
}

export interface ParsedHar {
  entries: ParsedHarEntry[];
  warnings: string[];
}

export type SignalKind =
  | "failed_request"
  | "server_error"
  | "auth_failure"
  | "validation_failure"
  | "conflict"
  | "slow_request"
  | "duplicate_request"
  | "empty_failed_response"
  | "cors_suspicion"
  | "booking_conflict";

export interface DetectedSignal {
  kind: SignalKind;
  summary: string;
  entry?: ParsedHarEntry;
  developerChecklist?: string;
  automationIdea?: string;
  qaNote?: string;
}

export interface ReportResult {
  markdown: string;
  warnings: string[];
  missingEvidence: string[];
}
