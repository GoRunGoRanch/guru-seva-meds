"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

  const servantPw = (process.env.APP_GATE_PASSWORD || "").trim();
  const doctorPw = (process.env.DOCTOR_PASSWORD || "").trim();

  let role: Role | null = null;
  if (doctorPw && password === doctorPw) role = "doctor";
  else if (servantPw && password === servantPw) role = "servant";

  if (!role) return { error: "Wrong password." };

  const cookieValue = await createSessionCookieValue({ name, role });
  cookies().set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: "/",
  });

  redirect("/dashboard");
}
