"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GATE_COOKIE_MAX_AGE,
  GATE_COOKIE_NAME,
  gateTokenFor,
} from "@/lib/gate";

const ALLOWED_NEXT_PREFIX = /^\/(dashboard|manage)(\/|$|\?)/;

export async function unlock(formData: FormData) {
  const pw = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");
  const expected = process.env.APP_GATE_PASSWORD || "";

  if (!expected) return { error: "App gate is not configured. Set APP_GATE_PASSWORD in your environment." };
  if (pw !== expected) return { error: "Incorrect password." };

  const token = await gateTokenFor(expected);
  cookies().set(GATE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: GATE_COOKIE_MAX_AGE,
    path: "/",
  });

  redirect(ALLOWED_NEXT_PREFIX.test(next) ? next : "/dashboard");
}
