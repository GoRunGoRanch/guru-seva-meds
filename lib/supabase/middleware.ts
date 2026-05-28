import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, readSessionCookieValue } from "@/lib/session";

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isPublic =
    path.startsWith("/login") ||
    path === "/favicon.ico" ||
    path.startsWith("/_next");

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await readSessionCookieValue(cookie);

  if (!session && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (session && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
