export const ADMIN_COOKIE_NAME = "radioklad_admin_session";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

function signingSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET ||
    (process.env.NODE_ENV !== "production" ? process.env.ADMIN_PASSWORD : undefined);
}

function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decode(value: string): Uint8Array {
  return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));
}

async function signingKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createAdminSession(now = Date.now()): Promise<string> {
  const secret = signingSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is required");
  const payload = encode(encoder.encode(JSON.stringify({ exp: now + COOKIE_MAX_AGE * 1000, iat: now })));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(secret), encoder.encode(payload));
  return `${payload}.${encode(new Uint8Array(signature))}`;
}

export async function verifyAdminSession(token: string | undefined, now = Date.now()): Promise<boolean> {
  const secret = signingSecret();
  if (!secret || !token || token.length > 1024) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [payload, signature] = parts;
    if (!(await crypto.subtle.verify("HMAC", await signingKey(secret), decode(signature) as Uint8Array<ArrayBuffer>, encoder.encode(payload)))) return false;
    const session = JSON.parse(new TextDecoder().decode(decode(payload)));
    return Number.isSafeInteger(session.exp) && Number.isSafeInteger(session.iat) &&
      session.iat <= now && session.exp > now && session.exp - session.iat === COOKIE_MAX_AGE * 1000;
  } catch {
    return false;
  }
}
