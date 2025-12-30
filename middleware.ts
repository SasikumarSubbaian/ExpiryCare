import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for dev routes (development only) - check early to avoid any processing
  if (pathname.startsWith('/dev')) {
    return NextResponse.next()
  }

  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in middleware')
    // Return response without auth check if env vars are missing
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          try {
            return request.cookies.get(name)?.value
          } catch {
            return undefined
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          } catch {
            // Cookie set failed - continue anyway
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          } catch {
            // Cookie remove failed - continue anyway
          }
        },
      },
    }
    )

    let user = null
    try {
      const { data, error } = await supabase.auth.getUser()
      if (!error && data) {
        user = data.user
      }
    } catch (authError) {
      // Auth check failed - continue without user
      // This is OK for public pages
    }

    // Protected routes - redirect to login if not authenticated
    // Includes all routes that require authentication
    const protectedRoutes = ['/dashboard', '/upgrade', '/settings']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    // Auth routes - redirect to dashboard if already authenticated
    const authRoutes = ['/login', '/signup']
    const isAuthRoute = authRoutes.includes(pathname)

    try {
      if (isProtectedRoute && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }

      if (isAuthRoute && user) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    } catch (redirectError) {
      // Redirect failed - continue with normal response
      console.error('[Middleware] Redirect error:', redirectError)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Return response even if there's an error to prevent 500
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     * - dev routes (development only)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|dev|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
