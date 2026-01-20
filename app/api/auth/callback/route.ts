import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const authSource = searchParams.get('auth_source')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Extract first name from Google profile and store in cookie for onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata) {
        const fullName = user.user_metadata.full_name || user.user_metadata.name || ''
        const firstName = fullName.split(' ')[0]
        if (firstName) {
          cookieStore.set({
            name: 'onboarding_name',
            value: firstName,
            path: '/',
            maxAge: 60 * 60, // 1 hour - just for onboarding
            sameSite: 'lax',
          })
        }
      }

      // Store auth source for showing appropriate message to new users from login
      if (authSource) {
        cookieStore.set({
          name: 'auth_source',
          value: authSource,
          path: '/',
          maxAge: 60 * 5, // 5 minutes - just for the redirect
          sameSite: 'lax',
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
