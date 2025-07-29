import { NextRequest, NextResponse } from "next/server";
import {
  authMiddleware,
  redirectToHome,
  redirectToLogin,
} from "next-firebase-auth-edge";
import { firebaseConfig, serverConfig } from "@/lib/firebase/config";

const PUBLIC_PATHS = ["/register", "/login", "/reset-password", "/room/global"];

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/portfolio/")) {
    return NextResponse.next();
  }

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
    handleValidToken: async ({ token, decodedToken }, headers) => {
      // Authenticated user should not be able to access /login, /register and /reset-password routes
      if (
        PUBLIC_PATHS.includes(request.nextUrl.pathname) &&
        request.nextUrl.pathname !== "/room/global"
      ) {
        return redirectToHome(request);
      }

      // if (request.nextUrl.pathname === "/swapmeet") {
      //   const { x, y } = await spawnSection();
      //   return NextResponse.redirect(
      //     new URL(`/swapmeet/market/${x}/${y}`, request.url),
      //   );
      // }
            // 🔄  Edge‑safe fetch instead of direct Prisma call
            if (request.nextUrl.pathname === "/swapmeet") {
              const apiUrl = new URL("/api/swapmeet/spawn", request.url);
              const res    = await fetch(apiUrl, {
                // pass session cookies / headers if your API route needs them
                headers: { cookie: request.headers.get("cookie") ?? "" },
              });
      
              if (res.ok) {
                const { x, y } = await res.json();
                return NextResponse.redirect(
                  new URL(`/swapmeet/market/${x}/${y}`, request.url),
                );
              }
      
              // Fallback if API failed
              return NextResponse.next();
            }

      return NextResponse.next({
        request: {
          headers,
        },
      });
    },
    handleInvalidToken: async (reason) => {
      console.info("Missing or malformed credentials", { reason });

      return redirectToLogin(request, {
        path: "/login",
        publicPaths: PUBLIC_PATHS,
      });
    },
    handleError: async (error) => {
      console.error("Unhandled authentication error", { error });

      return redirectToLogin(request, {
        path: "/login",
        publicPaths: PUBLIC_PATHS,
      });
    },
  });
}

export const config = {
  matcher: [
    "/api/login",
    "/api/logout",
    "/((?!_next|favicon.ico|api|.*\\.).+)",
  ],
};
