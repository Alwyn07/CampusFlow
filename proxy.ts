import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { getRoleHome, protectedPrefixes } from "@/lib/roles";

const publicAuthRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const protectedRoute = protectedPrefixes.find(({ prefix }) =>
    pathname.startsWith(prefix),
  );

  const isAuthRoute = publicAuthRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (token && Number(token.sessionExpiresAt ?? 0) < Date.now()) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    return response;
  }

  if (isAuthRoute && token?.role) {
    return NextResponse.redirect(new URL(getRoleHome(String(token.role)), request.url));
  }

  if (!protectedRoute) {
    return NextResponse.next();
  }

  if (!token?.role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  if (!protectedRoute.allowed.includes(token.role)) {
    return NextResponse.redirect(new URL(getRoleHome(String(token.role)), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/faculty/:path*",
    "/student/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
