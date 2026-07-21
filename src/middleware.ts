import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ============================================
// Edge-compatible constants
// (Do NOT import from auth-helpers or subdomain —
//  auth-helpers uses Node.js modules; we inline everything here)
// ============================================

const DASHBOARD_ROLES = ["ADMIN", "EDITOR", "READER"];

const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 3,
  EDITOR: 2,
  READER: 1,
};

const ROOT_DOMAIN = "sanaathrumylens.co.ke";

interface SubdomainConfig {
  subdomain: string;
  role: string;
  label: string;
  description: string;
  accentColor: string;
  minRoleLevel: number;
}

const SUBDOMAINS: SubdomainConfig[] = [
  {
    subdomain: "admin",
    role: "ADMIN",
    label: "Admin Panel",
    description: "Content management, users, and configuration",
    accentColor: "#d97706",
    minRoleLevel: 3,
  },
  {
    subdomain: "editor",
    role: "EDITOR",
    label: "Editor Desk",
    description: "Review & publish content, manage editorial workflow",
    accentColor: "#059669",
    minRoleLevel: 2,
  },
];

// API routes that are public for GET requests
const publicGetApiRoutes = [
  "/api/auth",
  "/api/posts",
  "/api/categories",
  "/api/tags",
  "/api/events",
  "/api/settings",
  "/api/ads",
  "/api/artists",
  "/api/campaigns/track",
];

// API routes that are public for specific POST requests (no auth required)
const publicPostApiRoutes = [
  "/api/newsletter",
  "/api/contact",
  "/api/ads/track",
  "/api/sponsored/submit",
  "/api/analytics/track",
];

// Role requirements for specific API route prefixes
const apiRoleRequirements: Record<string, string> = {
  "/api/users": "ADMIN",
  "/api/dashboard": "READER",
  "/api/media": "READER",
  "/api/bookmarks": "READER",
  "/api/reading-lists": "READER",
  "/api/comments": "READER",
  "/api/community": "READER",
  "/api/flagged": "READER",
};

// ============================================
// Helper functions
// ============================================

/**
 * Parse JWT payload from the session token cookie (without verifying signature).
 * This is used for quick role checks in middleware; full verification happens in API routes.
 */
function parseJWTPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Base64url decode
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Detect which subdomain the request is coming from.
 * Returns the SubdomainConfig or null if it's the base domain / localhost.
 */
function detectSubdomain(hostname: string): SubdomainConfig | null {
  // localhost/dev handling — no subdomain enforcement
  if (hostname === "localhost" || hostname.startsWith("127.0.0.1") || hostname === "0.0.0.0") {
    return null;
  }

  // Check if this is a subdomain of our root domain
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomainPart = hostname.replace(`.${ROOT_DOMAIN}`, "");
    if (!subdomainPart || subdomainPart === "www") {
      return null; // www or bare domain = public
    }
    const found = SUBDOMAINS.find((s) => s.subdomain === subdomainPart);
    return found || null;
  }

  // Custom domain / Vercel preview — no subdomain enforcement
  return null;
}

/**
 * Get the subdomain config for a given role.
 * Returns the most specific subdomain for that role, or null for READER.
 */
function getSubdomainForRole(role: string): SubdomainConfig | null {
  const level = ROLE_HIERARCHY[role] ?? 0;
  if (level <= 1) return null; // READER has no subdomain
  return SUBDOMAINS.find((s) => s.role === role) || null;
}

/**
 * Check if a user with the given role can access a subdomain.
 * Strict matching: each role can only access their own subdomain.
 * ADMIN can access any subdomain (management oversight).
 */
function canAccessSubdomain(userRole: string, subdomain: SubdomainConfig): boolean {
  // ADMIN can access any subdomain for management oversight
  if (userRole === "ADMIN") {
    return true;
  }
  // Other roles must match their subdomain exactly
  return userRole === subdomain.role;
}

/**
 * Build a URL on a different subdomain while preserving the protocol.
 */
function buildSubdomainUrl(subdomain: string, pathname: string, request: NextRequest): URL {
  const protocol = request.nextUrl.protocol || "https:";
  return new URL(`${protocol}//${subdomain}.${ROOT_DOMAIN}${pathname}`);
}

/**
 * Build a URL on the base domain while preserving the protocol.
 */
function buildBaseDomainUrl(pathname: string, request: NextRequest): URL {
  const protocol = request.nextUrl.protocol || "https:";
  return new URL(`${protocol}//${ROOT_DOMAIN}${pathname}`);
}

/**
 * Get the session token and parsed role from the request cookies.
 * 
 * Strategy:
 * 1. Check for a custom "x-role" cookie set during login (non-encrypted, subdomain-shared)
 * 2. Fall back to next-auth/jwt getToken() for encrypted JWE tokens
 * 3. Last resort: try plain JWT parsing
 */
async function getUserRole(request: NextRequest): Promise<{ sessionToken: string | null; role: string; noSession?: boolean }> {
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    return { sessionToken: null, role: "READER", noSession: true };
  }

  // Method 1: Check custom role cookie (set by our /api/auth/session wrapper)
  const roleCookie = request.cookies.get("x-user-role")?.value;
  if (roleCookie && roleCookie !== "READER") {
    return { sessionToken, role: roleCookie };
  }

  // Method 2: Try getToken() from next-auth/jwt
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (token) {
      const role = (token.role as string) || "READER";
      return { sessionToken, role };
    }
  } catch {
    // getToken() failed — likely NEXTAUTH_SECRET not available in Edge runtime
  }

  // Method 3: Fallback: try parsing as plain JWT
  const payload = parseJWTPayload(sessionToken);
  if (payload?.role) {
    return { sessionToken, role: payload.role as string };
  }

  return { sessionToken, role: "READER" };
}

// ============================================
// Middleware
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host")?.split(":")[0] || "";
  const subdomain = detectSubdomain(hostname);

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const { sessionToken, role: userRole, noSession } = await getUserRole(request);

  // If there's no session but a stale x-user-role cookie exists, clear it
  const shouldClearStaleCookie = !!(noSession && request.cookies.get("x-user-role")?.value);

  // Whenever we have a session token and a known non-READER role,
  // set the x-user-role cookie so subdomain middleware can read it.
  // This works around the Edge runtime limitation where getToken()
  // can't decrypt JWE tokens because NEXTAUTH_SECRET is unavailable.
  const shouldSetRoleCookie = !!(sessionToken && userRole !== "READER" && !request.cookies.get("x-user-role")?.value);

  // ============================================
  // Subdomain-specific routing
  // ============================================
  if (subdomain) {
    // We are on a subdomain (e.g., control.sanaathrumylens.co.ke)

    // Allow API routes on any subdomain (same auth checks as base domain)
    if (pathname.startsWith("/api/")) {
      // Apply the same API route auth logic
      if (pathname.startsWith("/api/auth")) {
        return NextResponse.next();
      }

      const isPublicApi = publicGetApiRoutes.some((route) =>
        pathname.startsWith(route)
      );
      if (isPublicApi && request.method === "GET") {
        return NextResponse.next();
      }

      const isPublicPostApi = publicPostApiRoutes.some((route) =>
        pathname.startsWith(route)
      );
      if (isPublicPostApi && request.method === "POST") {
        return NextResponse.next();
      }

      if (
        pathname.startsWith("/api/newsletter/unsubscribe") &&
        request.method === "GET"
      ) {
        return NextResponse.next();
      }

      if (!sessionToken) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      // Parse JWT for role check
      for (const [routePrefix, requiredRole] of Object.entries(
        apiRoleRequirements
      )) {
        if (pathname.startsWith(routePrefix)) {
          const userPermLevel = ROLE_HIERARCHY[userRole] ?? 0;
          const requiredPermLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

          if (userPermLevel < requiredPermLevel) {
            return NextResponse.json(
              { error: "Insufficient permissions" },
              { status: 403 }
            );
          }
          break;
        }
      }

      return NextResponse.next();
    }

    // Allow auth/signin on subdomains
    if (pathname.startsWith("/auth/signin")) {
      return NextResponse.next();
    }

    // Block /auth/signup on subdomains — redirect to base domain signup
    if (pathname.startsWith("/auth/signup")) {
      const signupUrl = buildBaseDomainUrl("/auth/signup", request);
      const response = NextResponse.redirect(signupUrl);
      response.headers.set("X-Debug", "signup-blocked-on-subdomain");
      return response;
    }

    // On a subdomain, redirect / to /dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Only serve /dashboard routes on subdomains
    if (!pathname.startsWith("/dashboard")) {
      // Redirect non-dashboard paths to /dashboard on this subdomain
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // User is accessing /dashboard on a subdomain
    // Check authentication
    if (!sessionToken) {
      // Redirect to sign-in on the BASE domain (where the cookie is set)
      // After login, the base domain middleware will redirect to this subdomain
      const signInUrl = buildBaseDomainUrl("/auth/signin", request);
      signInUrl.searchParams.set("callbackUrl", `https://${subdomain.subdomain}.${ROOT_DOMAIN}${pathname}`);
      const response = NextResponse.redirect(signInUrl);
      response.headers.set("X-Debug", "no-session-token");
      return response;
    }

    // Check if the user's role can access this subdomain
    if (!canAccessSubdomain(userRole, subdomain)) {
      // User doesn't have permission for this subdomain
      // Redirect them to their correct subdomain or to the redirect page
      const correctSubdomain = getSubdomainForRole(userRole);
      if (correctSubdomain) {
        // Redirect to their correct subdomain dashboard
        const redirectUrl = buildSubdomainUrl(correctSubdomain.subdomain, "/dashboard/redirect", request);
        redirectUrl.searchParams.set("attempted", subdomain.subdomain);
        const response = NextResponse.redirect(redirectUrl);
        response.headers.set("X-Debug", `wrong-role:${userRole}-needs:${subdomain.role}`);
        return response;
      } else {
        // READER or unknown role — redirect to base domain dashboard
        const redirectUrl = buildBaseDomainUrl("/dashboard/redirect", request);
        redirectUrl.searchParams.set("attempted", subdomain.subdomain);
        const response = NextResponse.redirect(redirectUrl);
        response.headers.set("X-Debug", `no-subdomain-for-role:${userRole}`);
        return response;
      }
    }

    // READERS should not be on subdomains at all (even if they somehow get past)
    if (userRole === "READER") {
      const redirectUrl = buildBaseDomainUrl("/dashboard/redirect", request);
      redirectUrl.searchParams.set("attempted", subdomain.subdomain);
      const response = NextResponse.redirect(redirectUrl);
      response.headers.set("X-Debug", "reader-on-subdomain");
      return response;
    }

    // Role-based path restrictions within subdomain dashboard
    // (Same as existing logic for base domain /dashboard)
    if (userRole === "READER") {
      const allowedReaderPaths = ["/dashboard", "/dashboard/reader", "/dashboard/reading-lists", "/dashboard/profile"];
      if (!allowedReaderPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.redirect(new URL("/dashboard/reader", request.url));
      }
    } else if (!DASHBOARD_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  // ============================================
  // Base domain routing (no subdomain)
  // ============================================

  // Check if it's an API route — same logic as before
  const isApiRoute = pathname.startsWith("/api/");

  if (isApiRoute) {
    // Allow auth routes fully
    if (pathname.startsWith("/api/auth")) {
      return NextResponse.next();
    }

    // Allow public API routes (GET requests only)
    const isPublicApi = publicGetApiRoutes.some((route) =>
      pathname.startsWith(route)
    );
    if (isPublicApi && request.method === "GET") {
      return NextResponse.next();
    }

    // Allow specific POST routes without auth
    const isPublicPostApi = publicPostApiRoutes.some((route) =>
      pathname.startsWith(route)
    );
    if (isPublicPostApi && request.method === "POST") {
      return NextResponse.next();
    }

    // Allow newsletter unsubscribe (GET) without auth
    if (
      pathname.startsWith("/api/newsletter/unsubscribe") &&
      request.method === "GET"
    ) {
      return NextResponse.next();
    }

    // For protected API routes, check authentication via session cookie
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse JWT for role check
    for (const [routePrefix, requiredRole] of Object.entries(
      apiRoleRequirements
    )) {
      if (pathname.startsWith(routePrefix)) {
        const userPermLevel = ROLE_HIERARCHY[userRole] ?? 0;
        const requiredPermLevel = ROLE_HIERARCHY[requiredRole] ?? 0;

        if (userPermLevel < requiredPermLevel) {
          return NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 }
          );
        }
        break;
      }
    }

    return NextResponse.next();
  }

  // Check dashboard route access on base domain
  if (pathname.startsWith("/dashboard")) {
    if (!sessionToken) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // On the base domain, /dashboard is only for READER role
    // Higher roles should be redirected to their subdomain dashboard
    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;

    if (userLevel >= 2) {
      // EDITOR, ADMIN — redirect to their subdomain
      // But only if we're on the production domain (not localhost)
      if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
        const correctSubdomain = getSubdomainForRole(userRole);
        if (correctSubdomain) {
          const redirectUrl = buildSubdomainUrl(correctSubdomain.subdomain, pathname, request);
          return addRoleCookie(NextResponse.redirect(redirectUrl), shouldSetRoleCookie, userRole, shouldClearStaleCookie);
        }
      }
      // On localhost or other domains, fall through to normal dashboard access
    }

    // READERS can only access /dashboard and /dashboard/reader and /dashboard/profile
    if (userRole === "READER") {
      const allowedReaderPaths = ["/dashboard", "/dashboard/reader", "/dashboard/reading-lists", "/dashboard/profile"];
      if (!allowedReaderPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.redirect(new URL("/dashboard/reader", request.url));
      }
    } else if (!DASHBOARD_ROLES.includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return addRoleCookie(NextResponse.next(), shouldSetRoleCookie, userRole, shouldClearStaleCookie);
  }

  // All other routes (public blog, etc.) — pass through
  return addRoleCookie(NextResponse.next(), shouldSetRoleCookie, userRole, shouldClearStaleCookie);
}

/**
 * Add the x-user-role cookie to the response if needed.
 * This ensures subdomain middleware can read the user's role
 * even when getToken() can't decrypt JWE tokens in Edge runtime.
 * Also clears stale x-user-role cookies when there's no session.
 */
function addRoleCookie(response: NextResponse, shouldSet: boolean, role: string, shouldClear?: boolean): NextResponse {
  if (shouldClear) {
    // Clear stale role cookie — user has no active session
    response.cookies.set("x-user-role", "", {
      path: "/",
      domain: `.${ROOT_DOMAIN}`,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 0,
    });
  } else if (shouldSet) {
    response.cookies.set("x-user-role", role, {
      path: "/",
      domain: `.${ROOT_DOMAIN}`,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 24 * 60 * 60, // 24 hours, same as session
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js).*)"],
};
