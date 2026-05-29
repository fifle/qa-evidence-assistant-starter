const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
]);

const SENSITIVE_QUERY_PARAMS = new Set(["token", "session", "auth", "key", "secret", "apikey"]);

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const JWT_RE = /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const TOKEN_WORD_RE = /(access_token|refresh_token|session_id|api_key)\s*[:=]\s*[^\s,&"']+/gi;

export interface RedactionResult {
  text: string;
  hadSensitiveData: boolean;
}

export function redactText(input: string): RedactionResult {
  let hadSensitiveData = false;
  let text = input;

  const patterns: RegExp[] = [EMAIL_RE, JWT_RE, BEARER_RE, TOKEN_WORD_RE];
  for (const re of patterns) {
    if (re.test(text)) hadSensitiveData = true;
    text = text.replace(re, "[REDACTED]");
  }

  return { text, hadSensitiveData };
}

export function redactHeaders(headers: Record<string, string>): {
  headers: Record<string, string>;
  hadSensitiveData: boolean;
} {
  let hadSensitiveData = false;
  const out: Record<string, string> = {};

  for (const [name, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADER_NAMES.has(name.toLowerCase())) {
      out[name] = "[REDACTED]";
      hadSensitiveData = true;
      continue;
    }
    const redacted = redactText(value);
    if (redacted.hadSensitiveData) hadSensitiveData = true;
    out[name] = redacted.text;
  }

  return { headers: out, hadSensitiveData };
}

export function redactUrl(url: string): RedactionResult {
  try {
    const parsed = new URL(url);
    let hadSensitiveData = false;
    for (const key of [...parsed.searchParams.keys()]) {
      if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
        parsed.searchParams.set(key, "[REDACTED]");
        hadSensitiveData = true;
      }
    }
    const redacted = redactText(parsed.toString());
    return { text: redacted.text, hadSensitiveData: hadSensitiveData || redacted.hadSensitiveData };
  } catch {
    return redactText(url);
  }
}
