import assert from "node:assert/strict";

import {
  ApiError,
  AuthError,
  SIGIL_SCOPES,
  SigilError,
  ValidationError,
  mcpTokenMetadataSchema,
  sigilScopeSchema,
} from "@heysigil/sigil-core";

function main() {
  assert.ok(Array.isArray(SIGIL_SCOPES), "SIGIL_SCOPES should be an array");
  assert.ok(SIGIL_SCOPES.includes("launch:read"), "Expected launch:read scope");
  assert.equal(sigilScopeSchema.parse("verify:write"), "verify:write");

  const token = mcpTokenMetadataSchema.parse({
    id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    name: "Smoke Token",
    tokenPrefix: "sgl_test",
    scopes: ["launch:read"],
    expiresAt: null,
    lastUsedAt: null,
    revokedAt: null,
    createdAt: "2026-02-19T00:00:00.000Z",
  });
  assert.equal(token.name, "Smoke Token");

  const apiErr = new ApiError("bad request", 400, { reason: "bad" });
  assert.ok(apiErr instanceof ApiError);
  assert.ok(apiErr instanceof SigilError);
  assert.equal(apiErr.status, 400);

  const authErr = new AuthError();
  assert.equal(authErr.name, "AuthError");

  const validationErr = new ValidationError("invalid");
  assert.equal(validationErr.message, "invalid");

  console.log("PASS core smoke");
}

main();
