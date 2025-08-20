import { NextRequest, NextResponse } from "next/server";
import {
  authMiddleware,
  redirectToHome,
  redirectToLogin,
} from "next-firebase-auth-edge";
import { firebaseConfig, serverConfig } from "@/lib/firebase/config";


const PUBLIC_PATHS = ["/register", "/login", "/reset-password", "/room/global"];

function isApPath(pathname: string) {
  if (pathname === "/.well-known/webfinger") return true;
  if (pathname === "/inbox") return true; // shared inbox (optional, future-proof)
  if (/^\/users\/[^/]+(\/(inbox|outbox|followers|following))?$/.test(pathname)) return true;
  return false;
}

function isApNegotiation(req: NextRequest) {
  const sp     = new URL(req.url).searchParams;
  if (sp.has("__ap")) return true; // handy manual override in a browser

  const accept = (req.headers.get("accept") || "").toLowerCase();
  const ctype  = (req.headers.get("content-type") || "").toLowerCase();

  const apJson = accept.includes("application/activity+json")
              || accept.includes("application/ld+json"); // covers profile variant
  const apPost = ctype.includes("application/activity+json")
              || ctype.includes("application/ld+json");

  return apJson || apPost;
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

    // --- 0) Always allow cheap methods through (preflight, head) ---
  if (request.method === "OPTIONS" || request.method === "HEAD") {
    return NextResponse.next();
  }


  // --- 1) Never run auth on static or public assets ---
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

    // --- 2) Never run auth on ANY api routes (at any depth) ---
  // (Prevents recursion when you fetch /swapmeet/api/spawn from middleware)
  if (pathname === "/api" || pathname.includes("/api/")) {
    return NextResponse.next();
  }
  // --- 3) Your other allowlists ---
  if (pathname.startsWith("/portfolio/")) return NextResponse.next();
  if (pathname === "/.well-known/webfinger") return NextResponse.next();
  if (isApPath(pathname) && isApNegotiation(request)) return NextResponse.next();

  // --- 4) Auth gate for everything else ---
  return authMiddleware(request, {
    loginPath: "/api/login",
    logoutPath: "/api/logout",
    apiKey: firebaseConfig.apiKey,
    cookieName: "__session",
    cookieSignatureKeys: serverConfig.cookieSignatureKeys,
    cookieSerializeOptions: {
      path: "/",
      httpOnly: true,
      secure: false,
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
        // This will NOT recurse now because /swapmeet/api/spawn is excluded above.
        const res = await fetch(new URL("/swapmeet/api/spawn", request.url));
        if (res.ok) {
          const { x, y } = (await res.json()) as { x: number; y: number };
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

// Matcher: apply to “pages” only; skip _next, root api, fonts/images/assets, files with dots
export const config = {
  cookieSerializeOptions: {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 12 * 60 * 60 * 24,
  },
  matcher: [
    "/.well-known/:path*",
    // let /api/* pass; it’s excluded inside anyway, but keeping it out here too helps:
    "/((?!_next|favicon.ico|api|fonts|images|assets|.*\\.).+)",
  ],
};