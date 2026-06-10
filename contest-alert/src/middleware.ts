import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // 1. Check for mock cookie session first (to support local developer testing with zero Supabase setup)
  const mockRole = request.cookies.get("rit-mock-user")?.value;
  
  if (mockRole === "student" || mockRole === "admin") {
    // Admin routes protection
    if (pathname.startsWith("/admin") && mockRole !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    
    // Login page redirecting
    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = mockRole === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }
    
    return supabaseResponse;
  }

  // 2. Fallback to Supabase SSR Auth
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // If no env is configured, or it is a placeholder, force redirect to login/bypass options
  const isDummyUrl = !supabaseUrl || supabaseUrl === "your_supabase_project_url" || !supabaseUrl.startsWith("http");
  
  if (isDummyUrl) {
    const isPublicRoute = ["/", "/login", "/auth/callback"].some(
      (route) => pathname === route || pathname.startsWith("/auth/")
    );
    if (!isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // Refresh session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Public routes that don't require auth
    const publicRoutes = ["/", "/login", "/auth/callback"];
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith("/auth/")
    );

    // If not authenticated and trying to access protected route
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // If authenticated, check role for admin routes
    if (user && pathname.startsWith("/admin")) {
      const role = user.user_metadata?.role || "student";
      if (role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }

    // If authenticated but onboarding not completed, redirect to onboarding
    if (user && !pathname.startsWith("/onboarding") && !pathname.startsWith("/auth") && pathname !== "/") {
      const role = user.user_metadata?.role || "student";
      const onboarding_completed = user.user_metadata?.onboarding_completed || false;

      if (!onboarding_completed && role === "student") {
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }

    // If authenticated and on login page, redirect to dashboard
    if (user && pathname === "/login") {
      const role = user.user_metadata?.role || "student";
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch (error) {
    const isPublicRoute = ["/", "/login", "/auth/callback"].some(
      (route) => pathname === route || pathname.startsWith("/auth/")
    );
    if (!isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
