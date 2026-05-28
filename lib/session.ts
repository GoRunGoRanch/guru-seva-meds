import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type Role = "servant" | "doctor";
export interface Session {
  name: string;
  role: Role;
}

const APP_SALT = "guru-seva-meds-session::v1";

function getSecret(): string {
  return (
    (process.env.APP_GATE_PASSWORD || "") +
    "::" +
    (process.env.DOCTOR_PASSWORD || "") +
    "::fallback"
  );
}

async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret() + APP_SALT),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionCookieValue(s: Session): Promise<string> {
  const payload = `${s.role}|${encodeURIComponent(s.name)}`;
  const sig = await hmac(payload);
  return `${payload}|${sig}`;
}

export async function readSessionCookieValue(
  cookie: string | undefined,
): Promise<Session | null> {
  if (!cookie) return null;
  const parts = cookie.split("|");
  if (parts.length !== 3) return null;
  const [role, nameEncoded, sig] = parts;
  if (role !== "servant" && role !== "doctor") return null;
  const expected = await hmac(`${role}|${nameEncoded}`);
  if (sig !== expected) return null;
  return { name: decodeURIComponent(nameEncoded), role };
}

export async function getSession(): Promise<Session | null> {
  const cookie = cookies().get(SESSION_COOKIE_NAME)?.value;
  return readSessionCookieValue(cookie);
}

export async function requireDoctor(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error("Not signed in.");
  if (s.role !== "doctor") throw new Error("Doctor role required.");
  return s;
}
