'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid relative overflow-hidden"
      style={{ background: 'var(--bg-deep)' }}>

      {/* Ambient light blobs */}
      <div className="blob blob-green" style={{ top: '10%', left: '15%', opacity: 0.8 }} />
      <div className="blob blob-purple" style={{ bottom: '20%', right: '10%', opacity: 0.7 }} />
      <div className="blob blob-green" style={{ bottom: '10%', left: '30%', width: 200, height: 200, opacity: 0.4 }} />

      <div className="relative w-full max-w-md mx-auto px-4">

        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl mb-4 flex items-center justify-center"
            style={{ background: 'var(--neon-green)', boxShadow: '0 0 24px var(--neon-green-glow)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#0a0a0f" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Willkommen zurück
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Melde dich bei Taxian an
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass-card rounded-2xl p-8"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 24px 64px rgba(0,0,0,0.4)' }}>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}>
                E-Mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="neon-input w-full px-3.5 py-2.5 rounded-lg text-sm"
                placeholder="name@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}>
                  Passwort
                </label>
                <a href="#" className="text-xs transition-colors hover:opacity-100"
                  style={{ color: 'var(--neon-green)', opacity: 0.8 }}>
                  Vergessen?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="neon-input w-full px-3.5 py-2.5 rounded-lg text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg px-3.5 py-3"
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}>
                <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs leading-relaxed" style={{ color: '#f87171' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="neon-btn w-full py-2.5 px-4 rounded-lg text-sm mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Anmelden…
                </span>
              ) : 'Anmelden'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Kein Konto?{' '}
          <a href="#" className="transition-colors hover:opacity-100"
            style={{ color: 'var(--neon-green)', opacity: 0.8 }}>
            Administrator kontaktieren
          </a>
        </p>
      </div>
    </div>
  )
}
