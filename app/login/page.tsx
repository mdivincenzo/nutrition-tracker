'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDevTools, setShowDevTools] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Show dev tools on localhost
    setShowDevTools(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="floating-orb purple w-80 h-80 -top-40 -right-40 animate-float" />
      <div className="floating-orb indigo w-64 h-64 bottom-20 -left-32 animate-float" style={{ animationDelay: '-3s' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-semibold gradient-text">1K A Day</span>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Welcome back</h1>
          <p className="text-text-secondary">Sign in to continue your journey</p>
        </div>

        <div className="glass-card p-8">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3.5 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="divider">
            <span>or continue with email</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="input-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error-muted border border-error/30">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="loading-dots">
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                    <div className="loading-dot" />
                  </div>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-text-secondary mt-8">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent-violet hover:text-accent-fuchsia transition-colors">
            Sign up
          </Link>
        </p>

        {/* Dev Tools - only on localhost */}
        {showDevTools && (
          <div className="mt-8 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
            <p className="text-xs text-yellow-500 font-medium mb-3">Dev Tools</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setEmail('dev@test.com')
                  setPassword('devtest123')
                }}
                className="w-full py-2 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors"
              >
                Fill Dev Credentials
              </button>
              <button
                onClick={async () => {
                  const res = await fetch('/api/dev/reset', { method: 'POST' })
                  const data = await res.json()
                  alert(data.message || data.error)
                }}
                className="w-full py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                Reset My Profile (re-test onboarding)
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
