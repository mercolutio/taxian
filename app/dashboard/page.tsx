import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BelegBereich from './BelegBereich'
import AdminView from './AdminView'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('[dashboard] user.id:', user.id)
  console.log('[dashboard] profile:', profile)
  console.log('[dashboard] profileError:', profileError)

  const isAdmin = profile?.role === 'admin'

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-grid relative overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      <div className="blob blob-green" style={{ top: '-5%', right: '10%', opacity: 0.5 }} />
      <div className="blob blob-purple" style={{ bottom: '10%', left: '5%', opacity: 0.4 }} />

      {/* Topbar */}
      <header className="relative z-10 border-b" style={{ borderColor: 'var(--glass-border)', background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'var(--neon-green)', boxShadow: '0 0 12px var(--neon-green-glow)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#0a0a0f" />
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Taxian</span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="text-xs px-2 py-1 rounded-md"
                style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--neon-purple)', border: '1px solid rgba(139,92,246,0.2)' }}>
                Admin
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}>
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {isAdmin ? (
          <>
            <div className="mb-8">
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Alle Belege
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Übersicht aller hochgeladenen Belege nach Mandant.
              </p>
            </div>
            <AdminView />
          </>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Meine Belege
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Lade deine Belege hoch oder fotografiere sie direkt.
              </p>
            </div>
            <BelegBereich userId={user.id} />
          </>
        )}
      </main>
    </div>
  )
}
