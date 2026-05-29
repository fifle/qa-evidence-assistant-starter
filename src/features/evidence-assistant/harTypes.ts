/** Minimal HAR JSON shapes — tolerant parsing only needs a subset. */

export interface HarHeader {
  name?: string;
  value?: string;
}

export interface HarRequest {
  method?: string;
  url?: string;
  headers?: HarHeader[];
}

export interface HarResponse {
  status?: number;
  statusText?: string;
  headers?: HarHeader[];
  content?: { text?: string; mimeType?: string };
}

export interface HarEntry {
  startedDateTime?: string;
  time?: number;
  request?: HarRequest;
  response?: HarResponse;
}

export interface HarLog {
  entries?: HarEntry[];
}

export interface HarFile {
  log?: HarLog;
}
