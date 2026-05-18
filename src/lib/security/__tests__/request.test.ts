import { describe, expect, it } from "vitest";
import { CsrfError, assertSameOriginRequest, hashSecurityValue } from "../request";

describe("request security helpers", () => {
  it("allows same-origin mutation requests", () => {
    expect(() => {
      assertSameOriginRequest({
        ip: "127.0.0.1",
        host: "app.test",
        origin: "https://app.test",
      });
    }).not.toThrow();
  });

  it("blocks cross-origin mutation requests", () => {
    expect(() => {
      assertSameOriginRequest({
        ip: "127.0.0.1",
        host: "app.test",
        origin: "https://evil.test",
      });
    }).toThrow(CsrfError);
  });

  it("hashes sensitive identifiers instead of storing them raw", () => {
    const hashed = hashSecurityValue("founder@example.com");

    expect(hashed).toMatch(/^[a-f0-9]{64}$/);
    expect(hashed).not.toContain("founder@example.com");
  });
});
