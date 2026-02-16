import { describe, test, expect, mock } from "bun:test";
import dns from "node:dns/promises";
import {
  verifyDomainDns,
  verifyDomainFile,
  verifyDomainMeta,
} from "../src/verification/domain.js";

// ─── verifyDomainDns ────────────────────────────────────

describe("verifyDomainDns", () => {
  test("successfully verifies with matching TXT record", async () => {
    const mockDnsResolve = mock(() =>
      Promise.resolve([["pool-claim-verify=0xABCD1234:abc123"]]),
    );
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
    expect(result.method).toBe("domain_dns");
    expect(result.projectId).toBe("example.com");
    expect(result.proof).toMatchObject({
      record: "pool-claim-verify=0xABCD1234:abc123",
      host: "_poolclaim.example.com",
    });
    expect(result.error).toBeUndefined();
  });

  test("matches records case-insensitively", async () => {
    const mockDnsResolve = mock(() =>
      Promise.resolve([["pool-claim-verify=0xabcd1234:ABC123"]]),
    );
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
  });

  test("handles TXT record with whitespace", async () => {
    const mockDnsResolve = mock(() =>
      Promise.resolve([["  pool-claim-verify=0xABCD1234:abc123  "]]),
    );
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
  });

  test("handles multiple TXT records with correct one present", async () => {
    const mockDnsResolve = mock(() =>
      Promise.resolve([
        ["some-other-record=value"],
        ["pool-claim-verify=0xABCD1234:abc123"],
        ["another-record=test"],
      ]),
    );
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
  });

  test("handles TXT record chunks (multi-part records)", async () => {
    const mockDnsResolve = mock(() =>
      Promise.resolve([
        ["pool-claim-verify=", "0xABCD1234:", "abc123"],
      ]),
    );
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
  });

  test("returns error when record not found", async () => {
    const mockDnsResolve = mock(() =>
      Promise.resolve([
        ["some-other-record=value"],
        ["another-record=test"],
      ]),
    );
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.method).toBe("domain_dns");
    expect(result.error).toContain("DNS TXT record not found");
    expect(result.error).toContain("_poolclaim.example.com");
    expect(result.proof).toMatchObject({
      recordsFound: ["some-other-record=value", "another-record=test"],
    });
  });

  test("returns error when verification code does not match", async () => {
    const mockDnsResolve = mock(() =>
      Promise.resolve([["pool-claim-verify=0xABCD1234:wrong123"]]),
    );
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("DNS TXT record not found");
  });

  test("returns error when wallet address does not match", async () => {
    const mockDnsResolve = mock(() =>
      Promise.resolve([["pool-claim-verify=0xWRONG:abc123"]]),
    );
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("DNS TXT record not found");
  });

  test("handles ENOTFOUND DNS error", async () => {
    const error = new Error("queryTxt ENOTFOUND _poolclaim.example.com");
    const mockDnsResolve = mock(() => Promise.reject(error));
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.method).toBe("domain_dns");
    expect(result.error).toContain("No DNS TXT records found");
    expect(result.error).toContain("_poolclaim.example.com");
  });

  test("handles ENODATA DNS error", async () => {
    const error = new Error("queryTxt ENODATA _poolclaim.example.com");
    const mockDnsResolve = mock(() => Promise.reject(error));
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("No DNS TXT records found");
  });

  test("handles other DNS errors", async () => {
    const error = new Error("DNS timeout");
    const mockDnsResolve = mock(() => Promise.reject(error));
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("DNS timeout");
  });

  test("handles non-Error exceptions", async () => {
    const mockDnsResolve = mock(() => Promise.reject("String error"));
    dns.resolveTxt = mockDnsResolve;

    const result = await verifyDomainDns(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unknown error");
  });

  test("constructs correct lookup host", async () => {
    const mockDnsResolve = mock(() =>
      Promise.resolve([["pool-claim-verify=0xABCD1234:abc123"]]),
    );
    dns.resolveTxt = mockDnsResolve;

    await verifyDomainDns("test.example.com", "abc123", "0xABCD1234");

    expect(mockDnsResolve).toHaveBeenCalledWith("_poolclaim.test.example.com");
  });
});

// ─── verifyDomainFile ───────────────────────────────────

describe("verifyDomainFile", () => {
  test("successfully verifies with matching code and wallet", async () => {
    const fileContent = "verification-token=abc123\nwallet-address=0xABCD1234";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(fileContent, { status: 200 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
    expect(result.method).toBe("domain_file");
    expect(result.projectId).toBe("example.com");
    expect(result.proof).toMatchObject({
      url: "https://example.com/.well-known/pool-claim.txt",
      content: fileContent,
    });
    expect(result.error).toBeUndefined();
  });

  test("matches wallet addresses case-insensitively", async () => {
    const fileContent = "verification-token=abc123\nwallet-address=0xabcd1234";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(fileContent, { status: 200 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
  });

  test("handles file with extra whitespace", async () => {
    const fileContent = "  verification-token=abc123  \n  wallet-address=0xABCD1234  \n";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(fileContent, { status: 200 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
  });

  test("handles file with empty lines", async () => {
    const fileContent = "\nverification-token=abc123\n\nwallet-address=0xABCD1234\n\n";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(fileContent, { status: 200 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
  });

  test("handles file with additional content", async () => {
    const fileContent = "# Pool Claim Verification\nverification-token=abc123\nwallet-address=0xABCD1234\n# End";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(fileContent, { status: 200 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
  });

  test("returns error when file not found (404)", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("Not Found", { status: 404 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.method).toBe("domain_file");
    expect(result.error).toContain("Could not fetch");
    expect(result.error).toContain("HTTP 404");
    expect(result.error).toContain("/.well-known/pool-claim.txt");
  });

  test("returns error on server error (500)", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("Server Error", { status: 500 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("HTTP 500");
  });

  test("returns error when verification token does not match", async () => {
    const fileContent = "verification-token=wrong123\nwallet-address=0xABCD1234";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(fileContent, { status: 200 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Verification token does not match");
  });

  test("returns error when wallet address does not match", async () => {
    const fileContent = "verification-token=abc123\nwallet-address=0xWRONG";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(fileContent, { status: 200 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Wallet address does not match");
  });

  test("returns error when token line is missing", async () => {
    const fileContent = "wallet-address=0xABCD1234";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(fileContent, { status: 200 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Verification token does not match");
  });

  test("returns error when wallet line is missing", async () => {
    const fileContent = "verification-token=abc123";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(fileContent, { status: 200 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Wallet address does not match");
  });

  test("handles empty file", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("", { status: 200 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
  });

  test("handles malformed key=value pairs", async () => {
    const fileContent = "verification-token\nwallet-address";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(fileContent, { status: 200 }),
      ),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
  });

  test("constructs correct URL", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response("Not Found", { status: 404 }),
      ),
    );
    globalThis.fetch = fetchMock;

    await verifyDomainFile("test.example.com", "abc123", "0xABCD1234");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://test.example.com/.well-known/pool-claim.txt",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  test("handles fetch errors", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error("Network error")),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });

  test("handles non-Error exceptions", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject("String error"),
    );

    const result = await verifyDomainFile(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unknown error");
  });
});

// ─── verifyDomainMeta ───────────────────────────────────

describe("verifyDomainMeta", () => {
  test("successfully verifies with matching meta tag", async () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="pool-claim-verification" content="0xABCD1234:abc123" />
          <title>Test Site</title>
        </head>
        <body>Content</body>
      </html>
    `;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(html, { status: 200 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
    expect(result.method).toBe("domain_meta");
    expect(result.projectId).toBe("example.com");
    expect(result.proof).toMatchObject({
      url: "https://example.com",
      metaContent: "0xABCD1234:abc123",
    });
    expect(result.error).toBeUndefined();
  });

  test("matches content case-insensitively", async () => {
    const html = `
      <html>
        <head>
          <meta name="pool-claim-verification" content="0xabcd1234:ABC123" />
        </head>
      </html>
    `;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(html, { status: 200 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
  });

  test("handles meta tag with whitespace in content", async () => {
    const html = `
      <html>
        <head>
          <meta name="pool-claim-verification" content="  0xABCD1234:abc123  " />
        </head>
      </html>
    `;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(html, { status: 200 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
  });

  test("finds meta tag among other meta tags", async () => {
    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width" />
          <meta name="pool-claim-verification" content="0xABCD1234:abc123" />
          <meta name="description" content="Test site" />
        </head>
      </html>
    `;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(html, { status: 200 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(true);
  });

  test("returns error when page not found (404)", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("Not Found", { status: 404 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.method).toBe("domain_meta");
    expect(result.error).toContain("Could not fetch");
    expect(result.error).toContain("HTTP 404");
  });

  test("returns error on server error (500)", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("Server Error", { status: 500 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("HTTP 500");
  });

  test("returns error when meta tag not found", async () => {
    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Test Site</title>
        </head>
      </html>
    `;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(html, { status: 200 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Meta tag not found");
    expect(result.error).toContain('<meta name="pool-claim-verification"');
  });

  test("returns error when content does not match", async () => {
    const html = `
      <html>
        <head>
          <meta name="pool-claim-verification" content="0xWRONG:wrong123" />
        </head>
      </html>
    `;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(html, { status: 200 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Meta tag content mismatch");
    expect(result.error).toContain('Expected: "0xABCD1234:abc123"');
    expect(result.error).toContain('got: "0xWRONG:wrong123"');
  });

  test("returns error when wallet address does not match", async () => {
    const html = `
      <html>
        <head>
          <meta name="pool-claim-verification" content="0xWRONG:abc123" />
        </head>
      </html>
    `;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(html, { status: 200 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Meta tag content mismatch");
  });

  test("returns error when code does not match", async () => {
    const html = `
      <html>
        <head>
          <meta name="pool-claim-verification" content="0xABCD1234:wrong123" />
        </head>
      </html>
    `;
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(html, { status: 200 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Meta tag content mismatch");
  });

  test("handles empty HTML", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response("", { status: 200 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Meta tag not found");
  });

  test("handles malformed HTML", async () => {
    const html = "<html><head><meta name=pool-claim-verification></head>";
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(html, { status: 200 }),
      ),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Meta tag not found");
  });

  test("constructs correct URL", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response("Not Found", { status: 404 }),
      ),
    );
    globalThis.fetch = fetchMock;

    await verifyDomainMeta("test.example.com", "abc123", "0xABCD1234");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://test.example.com",
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  test("handles fetch errors", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error("Network error")),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });

  test("handles non-Error exceptions", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject("String error"),
    );

    const result = await verifyDomainMeta(
      "example.com",
      "abc123",
      "0xABCD1234",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Unknown error");
  });
});
