"use server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE_MAX_AGE,
  SESSION_COOKIE_NAME,
  createSessionCookieValue,
  type Role,
} from "@/lib/session";

export async function signIn(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");

  if (!name) return { error: "Please type your name." };
  if (!password) return { error: "Please type the password." };
  if (name.length > 80) return { error: "Name is too long." };

  const typed = password.trim().toLowerCase();
  const servantPw = (process.env.APP_GATE_PASSWORD || "").trim().toLowerCase();
  const doctorPw = (process.env.DOCTOR_PASSWORD || "").trim().toLowerCase();

  let role: Role | null = null;
  if (doctorPw && typed === doctorPw) role = "doctor";
  else if (servantPw && typed === servantPw) role = "servant";

  if (!role) return { error: "Wrong password." };

  const cookieValue = await createSessionCookieValue({ name, role });
  cookies().set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: "/",
  });

  return { ok: true };
}
