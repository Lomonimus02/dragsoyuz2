import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-session";

function normalizePathname(pathname: string): string {
  let normalized = pathname.replace(/\/{2,}/g, "/");
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname, hostname } = url;

  // 1. www → non-www (301)
  if (hostname.startsWith("www.")) {
    url.hostname = hostname.slice(4);
    return NextResponse.redirect(url, 301);
  }

  // 2. Убираем множественные слеши и trailing slash (301, не 308)
  const finalPath = normalizePathname(pathname);
  if (finalPath !== pathname) {
    url.pathname = finalPath;
    return NextResponse.redirect(url, 301);
  }

  // 3. Авторизация в /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = await verifyAdminSession(sessionCookie);

  if (pathname === "/admin/login") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|css|js)).*)",
  ],
};
