import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  // Empêche le site d'être embarqué dans un iframe (clickjacking)
  "X-Frame-Options": "DENY",
  // Empêche le navigateur de deviner les types MIME
  "X-Content-Type-Options": "nosniff",
  // HSTS — forcer HTTPS pour 2 ans, inclut sous-domaines
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  // Pas de referer envoyé vers les sites externes
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Restreint les permissions navigateur sensibles
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=()",
  // CSP minimale (pas trop strict pour pas casser Next.js dev)
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

const PROTECTED_ROUTES = [/^\/dashboard(\/|$)/, /^\/admin(\/|$)/];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_ROUTES.some((re) => re.test(path));

  if (isProtected) {
    const token =
      request.cookies.get("authjs.session-token") ||
      request.cookies.get("__Secure-authjs.session-token");
    if (!token) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
  }

  const res = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

export const config = {
  // S'applique partout sauf static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
