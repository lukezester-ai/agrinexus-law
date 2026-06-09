import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const BUILT_IN_ADMIN_EMAILS = ['lukezester@gmail.com']

function adminEmailAllowlist(): Set<string> | null {
  const raw = process.env.ADMIN_EMAILS?.trim().replace(/^"+|"+$/g, '')
  const configuredEmails = raw
    ? raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    : []
  const emails = [...new Set([...BUILT_IN_ADMIN_EMAILS, ...configuredEmails])]
  return emails.length > 0 ? new Set(emails) : null
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-request state pollution.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProfilePath = request.nextUrl.pathname.startsWith('/profile')
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin')

  if (
    !user &&
    (isProfilePath || isAdminPath)
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/vhod'
    return NextResponse.redirect(url)
  }

  if (user && isAdminPath) {
    const allowlist = adminEmailAllowlist()
    const email = user.email?.toLowerCase()
    if (allowlist && (!email || !allowlist.has(email))) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
