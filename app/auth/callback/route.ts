import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user data
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if profile is complete (has LinkedIn username)
        const { data: profile } = await supabase
          .from('profiles')
          .select('linkedin_username')
          .eq('id', user.id)
          .single()

        // If no LinkedIn username, redirect to onboarding
        if (!profile || !profile.linkedin_username) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }

        // Profile complete, redirect to home
        return NextResponse.redirect(`${origin}/home`)
      }
    }

    console.error('Auth callback error:', error)
  }

  // Something went wrong, redirect to home with error
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
