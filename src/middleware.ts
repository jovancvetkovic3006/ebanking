import { NextResponse, type NextRequest } from "next/server";

// Lightweight guard: checks only that a session cookie exists.
// Full JWT verification happens inside API/routes on the server.
export function middleware(req: NextRequest) {
  const protectedPaths = ["/dashboard", "/transfer"];
  const { pathname } = req.nextUrl;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const hasSession = req.cookies.get("session");
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/transfer/:path*"],
};
