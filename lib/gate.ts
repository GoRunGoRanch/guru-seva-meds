const APP_SALT = "guru-seva-meds::v1";

export async function gateTokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode(`${APP_SALT}::${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isGateOpen(cookieValue: string | undefined): Promise<boolean> {
  const pw = process.env.APP_GATE_PASSWORD;
  if (!pw) return true;
  if (!cookieValue) return false;
  const expected = await gateTokenFor(pw);
  if (cookieValue.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= cookieValue.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export const GATE_COOKIE_NAME = "app_gate";
export const GATE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
