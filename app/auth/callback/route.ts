import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GATE_COOKIE_MAX_AGE, GATE_COOKIE_NAME, gateTokenFor } from "@/lib/gate";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      const pw = process.env.APP_GATE_PASSWORD;
      if (pw) {
        const token = await gateTokenFor(pw);
        response.cookies.set(GATE_COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: GATE_COOKIE_MAX_AGE,
          path: "/",
        });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=callback_failed`);
}
