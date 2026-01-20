import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Only allow in development
export const runtime = 'nodejs'

function createSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignore
          }
        },
      },
    }
  )
}

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get the profile ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ message: 'No profile found, nothing to reset' })
  }

  // Delete in order due to foreign key constraints
  const tables = ['chat_history', 'user_insights', 'meals', 'workouts', 'weigh_ins', 'profiles']
  const errors: string[] = []

  for (const table of tables) {
    const { error } = table === 'profiles'
      ? await supabase.from(table).delete().eq('user_id', user.id)
      : await supabase.from(table).delete().eq('profile_id', profile.id)

    if (error) {
      errors.push(`${table}: ${error.message}`)
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({
      error: `Failed to delete some data: ${errors.join(', ')}`,
      deletedProfileId: profile.id
    }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Profile and all related data deleted.',
    deletedProfileId: profile.id
  })
}
