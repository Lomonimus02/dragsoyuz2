import assert from "node:assert/strict";
import test from "node:test";
import { COOKIE_MAX_AGE, createAdminSession, verifyAdminSession } from "./admin-session";

test("admin sessions require an intact signature and a valid lifetime", async () => {
  const originalSecret = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = "test-only-secret-01234567890123456789";
  try {
    const now = 1_700_000_000_000;
    const token = await createAdminSession(now);
    assert.equal(await verifyAdminSession(token, now + 1000), true);
    assert.equal(await verifyAdminSession(token, now + COOKIE_MAX_AGE * 1000), false);
    assert.equal(await verifyAdminSession(token, now - 1), false);
    assert.equal(await verifyAdminSession(Buffer.from(JSON.stringify({ authenticated: true })).toString("base64"), now), false);
    assert.equal(await verifyAdminSession(`${token.split(".")[0]}.AAAA`, now), false);
    assert.equal(await verifyAdminSession(`a${token}`, now), false);
    assert.equal(await verifyAdminSession(undefined, now), false);
    process.env.ADMIN_SESSION_SECRET = "different-secret";
    assert.equal(await verifyAdminSession(token, now), false);
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = originalSecret;
  }
});
