import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { extractRoleFromSession } from "@/lib/auth/role";
import { env } from "@/lib/env";

const ADMIN_PATHS = ["/admin"];
const EMPLOYEE_PATHS = ["/employee"];
const PUBLIC_PATHS = ["/login"];
const SHARED_AUTH_PATHS = ["/profile", "/leaderboard", "/webhook-test"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Build a response we may mutate (for cookie refresh)
  const response = NextResponse.next();

  const supabase = createServerClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Unauthenticated — redirect to login
  if (!session) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = extractRoleFromSession(session, { allowUserMetadataFallback: false });

  // Authenticated shared pages are allowed for all roles.
  if (SHARED_AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return response;
  }

  // Role-based path guards
  if (
    ADMIN_PATHS.some((p) => pathname.startsWith(p)) &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/employee/dashboard", request.url));
  }

  if (
    EMPLOYEE_PATHS.some((p) => pathname.startsWith(p)) &&
    role === "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/proxy|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
