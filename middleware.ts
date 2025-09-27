// middleware.ts
import { NextResponse } from "next/server";
import {
  authMiddleware,
  redirectToHome,
  redirectToLogin,
} from "next-firebase-auth-edge";
import { firebaseConfig, serverConfig } from "@/lib/firebase/config";

const PUBLIC_PATHS = ["/register", "/login", "/reset-password", "/room/global"];


const PUBLIC_API = [
  /^\/api\/events$/,
  /^\/api\/agora\/events/,
];

function isApPath(pathname: string) {
  if (pathname === "/.well-known/webfinger") return true;
  if (pathname === "/inbox") return true; // shared inbox (optional)
  if (/^\/users\/[^/]+(\/(inbox|outbox|followers|following))?$/.test(pathname)) return true;
  return false;
}

function isApNegotiation(req: Request) {
  const sp = new URL(req.url).searchParams;
  if (sp.has("__ap")) return true;
  const accept = (req.headers.get("accept") || "").toLowerCase();
  const ctype  = (req.headers.get("content-type") || "").toLowerCase();
  const apJson = accept.includes("application/activity+json") || accept.includes("application/ld+json");
  const apPost = ctype.includes("application/activity+json") || ctype.includes("application/ld+json");
  return apJson || apPost;
}

export async function middleware(req: Request) {
  const { pathname } = new URL(req.url);
  if (PUBLIC_API.some((rx) => rx.test(pathname))) {
    return NextResponse.next();
  }
  const res = NextResponse.next();
  // set cookies here (not in config)
  res.cookies.set({
    name: "mesh.sid",
    value: "placeholder",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  // 0) Preflight/head pass through
  if (req.method === "OPTIONS" || req.method === "HEAD") {
    return NextResponse.next();
  }

  // 1) Skip static/public assets
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/fonts/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/assets/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/opensearch.xml"
  ) {
    return NextResponse.next();
  }

  // 2) Skip ALL api routes (any depth) to avoid recursion
  // if (pathname === "/api" || pathname.includes("/api/")) {
  //   return NextResponse.next();
  // }

  // 3) Other explicit allowlists
  if (pathname.startsWith("/portfolio/")) return NextResponse.next();
  if (pathname === "/.well-known/webfinger") return NextResponse.next();
  if (isApPath(pathname) && isApNegotiation(req)) return NextResponse.next();

  // Treat the incoming object as NextRequest at call sites (runtime it already is)
  const request = req as any;

  // 4) Auth gate for everything else
  return authMiddleware(request, {
    loginPath: "/api/login",
    logoutPath: "/api/logout",
    apiKey: firebaseConfig.apiKey,
    cookieName: "__session",
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    cookieSerializeOptions: {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 12 * 60 * 60 * 24,
    },
    serviceAccount: serverConfig.serviceAccount,
    handleValidToken: async (_ctx, headers) => {
      // Block auth'd users from auth pages (except /room/global)
      if (PUBLIC_PATHS.includes(pathname) && pathname !== "/room/global") {
        return redirectToHome(request);
      }

      // Friendly redirect for /swapmeet
      if (pathname === "/swapmeet") {
        const r = await fetch(new URL("/swapmeet/api/spawn", request.url));
        if (r.ok) {
          const { x, y } = (await r.json()) as { x: number; y: number };
          return NextResponse.redirect(new URL(`/swapmeet/market/${x}/${y}`, request.url));
        }
      }

      return NextResponse.next({ request: { headers } });
    },
    handleInvalidToken: async (reason) => {
      console.info("Missing or malformed credentials", { reason });
      return redirectToLogin(request, { path: "/login", publicPaths: PUBLIC_PATHS });
    },
    handleError: async (error) => {
      console.error("Unhandled authentication error", { error });
      return redirectToLogin(request, { path: "/login", publicPaths: PUBLIC_PATHS });
    },
  });
}

// Only keep supported fields here
export const config = {
  matcher: [
    "/.well-known/:path*",
    "/api/proposals/:path*",  // ← add this
    "/api/discussions/:path*",
    "/api/messages/:path*",
    "/api/conversations/:path*",
    "/api/drifts/:path*",            // 👈 add this
    "/api/me",                        // 👈 and this
    "/api/sheaf/:path*",
    "/discussions/:path*",
    "/messages/:path*",
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/ludics/:path*',
    '/api/commitments/:path*',
    '/api/compose/:path*',
    '/api/loci/:path*',
    '/api/:path*',
    "/((?!_next|favicon.ico|api|fonts|images|assets|.*\\.).+)",
  ],
};
