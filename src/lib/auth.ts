/**
 * Signed cookie auth for the Casino demo.
 *
 * Vercel serverless functions cannot rely on process memory being shared
 * between requests, so the session payload is stored in an httpOnly cookie and
 * signed with an HMAC. Any function can validate the cookie independently.
 */
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "casino_session";

const SESSION_DAYS = 7;
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
const SESSION_VERSION = 1;

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  playerPid: number | null;
};

type StoredUser = SessionUser;

type SessionPayload = SessionUser & {
  v: typeof SESSION_VERSION;
  exp: number;
  nonce: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function fallbackSecret(): string {
  const parts = [
    process.env.DB_HOST,
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(":");
  }

  return "casino-demo-session-secret";
}

function authSecret(): string {
  return process.env.AUTH_SECRET?.trim() || fallbackSecret();
}

function toBase64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return crypto
    .createHmac("sha256", authSecret())
    .update(value)
    .digest("base64url");
}

function signaturesMatch(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}

function numericIdForEmail(email: string): number {
  const digest = crypto.createHash("sha256").update(email).digest();
  return digest.readUInt32BE(0) & 0x7fffffff;
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export type CreateAccountInput = {
  name: string;
  email: string;
  playerPid?: number | null;
};

export type CreatedAccount = {
  user: SessionUser;
  sessionToken: string;
  sessionExpiresAt: Date;
};

function publicUser(u: StoredUser): SessionUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    playerPid: u.playerPid,
  };
}

export function createAccount(
  input: CreateAccountInput,
):
  | { ok: true; account: CreatedAccount }
  | { ok: false; error: string } {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  const user: StoredUser = {
    id: input.playerPid ?? numericIdForEmail(email),
    name,
    email,
    playerPid: input.playerPid ?? null,
  };

  const { token, expiresAt } = createSessionForUser(publicUser(user));

  return {
    ok: true,
    account: {
      user: publicUser(user),
      sessionToken: token,
      sessionExpiresAt: expiresAt,
    },
  };
}

export function setUserPlayerPid(userId: number, pid: number): void {
  void userId;
  void pid;
}

export function createSessionForUser(user: SessionUser): {
  token: string;
  expiresAt: Date;
} {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  const payload: SessionPayload = {
    ...user,
    v: SESSION_VERSION,
    exp: expiresAt.getTime(),
    nonce: crypto.randomBytes(16).toString("base64url"),
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const token = `${encodedPayload}.${sign(encodedPayload)}`;
  return { token, expiresAt };
}

export function destroySession(token: string | undefined | null): void {
  void token;
}

export function getUserBySessionToken(
  token: string | undefined | null,
): SessionUser | null {
  if (!token) return null;

  const [encodedPayload, signature, ...rest] = token.split(".");
  if (!encodedPayload || !signature || rest.length > 0) return null;
  if (!signaturesMatch(signature, sign(encodedPayload))) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as Partial<SessionPayload>;
    if (payload.v !== SESSION_VERSION) return null;
    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;
    if (typeof payload.id !== "number") return null;
    if (typeof payload.name !== "string") return null;
    if (typeof payload.email !== "string") return null;
    if (
      payload.playerPid !== null &&
      typeof payload.playerPid !== "number"
    ) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: normalizeEmail(payload.email),
      playerPid: payload.playerPid,
    };
  } catch {
    return null;
  }
}
