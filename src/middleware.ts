import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/onboarding"];
const ADMIN_ONLY = ["/admin"];
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("metrika_session")?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAdminOnly = ADMIN_ONLY.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));

  // Sem sessão → redireciona para login
  if ((isProtected || isAdminOnly) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Já logado tentando acessar login/register → vai para dashboard
  if (isAuthRoute && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
