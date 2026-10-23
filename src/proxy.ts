import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { isPublicPageRequest, normalizePublicPath, productCatalogPath } from "@/lib/seo-routing";

export async function proxy(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (isPublicPageRequest(request.method, normalizePublicPath(pathname))) {
    url.pathname = normalizePublicPath(pathname);
    const canonicalOrigin = new URL(SITE_URL);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
    const publicHost = [canonicalOrigin.host, `www.${canonicalOrigin.host}`].includes(host);
    const protocol = request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    const originChanged = publicHost && (host !== canonicalOrigin.host || protocol !== canonicalOrigin.protocol.replace(":", ""));
    if (publicHost) {
      url.protocol = canonicalOrigin.protocol;
      url.host = canonicalOrigin.host;
      url.port = canonicalOrigin.port;
    }
    const match = url.pathname.match(/^\/catalog\/[^/]+\/([^/]+)$/);
    if (match && match[1] !== "guide") {
      let slug: string;
      try { slug = decodeURIComponent(match[1]); } catch { return NextResponse.next(); }
      const product = await prisma.product.findUnique({ where: { slug }, select: { slug: true, category: { select: { slug: true } } } });
      if (product) url.pathname = productCatalogPath({ slug: product.slug, categorySlug: product.category.slug });
    }
    if (url.pathname !== pathname || originChanged) return NextResponse.redirect(url.toString(), 301);
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|css|js)).*)"],
};
