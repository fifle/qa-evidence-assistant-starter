import { describe, expect, it } from "vitest";
import { redactText, redactHeaders, redactUrl } from "./redaction";

describe("redaction", () => {
  it("redacts emails and bearer tokens", () => {
    const result = redactText("Contact user@example.com with Bearer abc.def.ghi");
    expect(result.hadSensitiveData).toBe(true);
    expect(result.text).not.toContain("user@example.com");
    expect(result.text).toContain("[REDACTED]");
  });

  it("redacts sensitive headers", () => {
    const result = redactHeaders({
      Authorization: "Bearer secret-token",
      "Content-Type": "application/json",
    });
    expect(result.hadSensitiveData).toBe(true);
    expect(result.headers.Authorization).toBe("[REDACTED]");
  });

  it("redacts sensitive query params", () => {
    const result = redactUrl("https://app.test/api?token=abc123&page=1");
    expect(result.hadSensitiveData).toBe(true);
    expect(result.text).toContain("[REDACTED]");
  });
});
