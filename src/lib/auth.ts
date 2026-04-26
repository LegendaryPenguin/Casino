/**
 * Simple in-memory auth + session store for the Casino demo.
 *
 * Designed for the EECS 447 demo where only a handful of users sign up.
 * No database tables are required: users and sessions live in process memory
 * and are reset whenever the dev server restarts.
 *
 * Sessions are tracked with an httpOnly cookie holding an opaque token. The
 * token itself is never persisted; we store its SHA-256 hash in memory.
 */
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "casino_session";

const SESSION_DAYS = 7;
const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
const PBKDF2_ITERATIONS = 120_000;
const PBKDF2_KEY_LENGTH = 32;
const PBKDF2_DIGEST = "sha256";

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  playerPid: number | null;
};

type StoredUser = SessionUser & {
  passwordSalt: Buffer;
  passwordHash: Buffer;
};

type StoredSession = {
  userId: number;
  expiresAt: number;
};

declare global {
  // Persist across Next.js HMR reloads in dev so signed-in users don't lose
  // their session every time a file is edited.
  var __casino_auth_store:
    | {
        users: Map<string, StoredUser>;
        sessions: Map<string, StoredSession>;
        nextUserId: number;
      }
    | undefined;
}

function getStore() {
  if (!globalThis.__casino_auth_store) {
    globalThis.__casino_auth_store = {
      users: new Map(),
      sessions: new Map(),
      nextUserId: 1,
    };
  }
  return globalThis.__casino_auth_store;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEY_LENGTH,
    PBKDF2_DIGEST,
  );
}

function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function pruneExpiredSessions(now = Date.now()) {
  const { sessions } = getStore();
  for (const [hash, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(hash);
  }
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
  password: string;
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
  const store = getStore();
  const name = input.name.trim();
  const email = normalizeEmail(input.email);

  if (store.users.has(email)) {
    return { ok: false, error: "An account with that email already exists." };
  }

  const salt = crypto.randomBytes(16);
  const passwordHash = hashPassword(input.password, salt);

  const user: StoredUser = {
    id: store.nextUserId++,
    name,
    email,
    playerPid: input.playerPid ?? null,
    passwordSalt: salt,
    passwordHash,
  };
  store.users.set(email, user);

  const { token, expiresAt } = createSessionForUser(user.id);

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
  for (const u of getStore().users.values()) {
    if (u.id === userId) {
      u.playerPid = pid;
      return;
    }
  }
}

export function verifyCredentials(
  email: string,
  password: string,
): SessionUser | null {
  const user = getStore().users.get(normalizeEmail(email));
  if (!user) return null;
  const candidate = hashPassword(password, user.passwordSalt);
  if (!timingSafeEqual(candidate, user.passwordHash)) return null;
  return publicUser(user);
}

export function createSessionForUser(userId: number): {
  token: string;
  expiresAt: Date;
} {
  pruneExpiredSessions();
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  getStore().sessions.set(hashSessionToken(token), {
    userId,
    expiresAt: expiresAt.getTime(),
  });
  return { token, expiresAt };
}

export function destroySession(token: string | undefined | null): void {
  if (!token) return;
  getStore().sessions.delete(hashSessionToken(token));
}

export function getUserBySessionToken(
  token: string | undefined | null,
): SessionUser | null {
  if (!token) return null;
  const store = getStore();
  pruneExpiredSessions();
  const session = store.sessions.get(hashSessionToken(token));
  if (!session) return null;

  for (const u of store.users.values()) {
    if (u.id === session.userId) {
      return publicUser(u);
    }
  }
  return null;
}
