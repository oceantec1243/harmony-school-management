import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase env vars are not set, skip auth check
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/login", "/auth/callback", "/auth/error"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  if (!user && !isPublicRoute) {
    // No user and trying to access protected route - redirect to login
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  if (user && request.nextUrl.pathname === "/auth/login") {
    // User is logged in but trying to access login page - redirect to home
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
