import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { GATE_COOKIE_NAME, isGateOpen } from "@/lib/gate";

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isGateExempt =
    path.startsWith("/enter") ||
    path.startsWith("/auth/callback") ||
    path === "/favicon.ico" ||
    path.startsWith("/_next");

  if (!isGateExempt) {
    const gateCookie = request.cookies.get(GATE_COOKIE_NAME)?.value;
    const open = await isGateOpen(gateCookie);
    if (!open) {
      const url = request.nextUrl.clone();
      url.pathname = "/enter";
      url.searchParams.set("next", path + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPublic =
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/enter") ||
    path === "/favicon.ico" ||
    path.startsWith("/_next");

  if (!user && !isAuthPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
