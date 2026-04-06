import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-grid relative overflow-hidden" style={{ background: 'var(--bg-deep)' }}>

      {/* Ambient blobs */}
      <div className="blob blob-green" style={{ top: '-5%', right: '10%', opacity: 0.5 }} />
      <div className="blob blob-purple" style={{ bottom: '10%', left: '5%', opacity: 0.4 }} />

      {/* Topbar */}
      <header className="relative z-10 border-b" style={{ borderColor: 'var(--glass-border)', background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'var(--neon-green)', boxShadow: '0 0 12px var(--neon-green-glow)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#0a0a0f" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Taxian
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</span>
            <form action={signOut}>
              <button type="submit"
                className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-100"
                style={{
                  color: 'var(--text-muted)',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                }}>
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Willkommen zurück, {user.email?.split('@')[0]}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Projekte', value: '—' },
            { label: 'Aufgaben', value: '—' },
            { label: 'Status', value: 'Aktiv', accent: true },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-5"
              style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.3)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              <p className="text-2xl font-semibold"
                style={{ color: stat.accent ? 'var(--neon-green)' : 'var(--text-primary)' }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
