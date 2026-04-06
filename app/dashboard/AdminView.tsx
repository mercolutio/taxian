'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type BelegRow = {
  id: string
  filename: string
  size_bytes: number
  mime_type: string
  storage_path: string
  created_at: string
  signedUrl: string
  user_email: string
}

type GroupedMandant = {
  user_id: string
  email: string
  belege: BelegRow[]
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AdminView() {
  const [mandanten, setMandanten] = useState<GroupedMandant[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data } = await supabase
        .from('belege_mit_email')
        .select('id, filename, size_bytes, mime_type, storage_path, created_at, user_id, user_email')
        .order('created_at', { ascending: false })

      if (!data?.length) { setLoading(false); return }

      // signed URLs
      const { data: urls } = await supabase.storage
        .from('belege')
        .createSignedUrls(data.map(r => r.storage_path), 3600)

      const withUrls = data.map((r, i) => ({
        ...r,
        signedUrl: urls?.[i]?.signedUrl ?? '',
        user_email: r.user_email ?? r.user_id,
      }))

      // Gruppieren nach user_id
      const map = new Map<string, GroupedMandant>()
      for (const r of withUrls) {
        if (!map.has(r.user_id)) {
          map.set(r.user_id, { user_id: r.user_id, email: r.user_email, belege: [] })
        }
        map.get(r.user_id)!.belege.push(r as BelegRow)
      }

      const result = Array.from(map.values())
      setMandanten(result)
      if (result.length === 1) setExpanded(result[0].user_id)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center gap-2 py-10" style={{ color: 'var(--text-muted)' }}>
      <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <span className="text-sm">Lade Belege…</span>
    </div>
  )

  if (!mandanten.length) return (
    <div className="glass-card rounded-xl p-10 text-center" style={{ border: '1px solid var(--glass-border)' }}>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Noch keine Belege von Mandanten vorhanden.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {mandanten.map(m => (
        <div key={m.user_id} className="glass-card rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--glass-border)' }}>

          {/* Mandant Header */}
          <button
            onClick={() => setExpanded(expanded === m.user_id ? null : m.user_id)}
            className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-white/2 transition-colors"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
              style={{ background: 'rgba(62,207,142,0.15)', color: 'var(--neon-green)', border: '1px solid rgba(62,207,142,0.2)' }}>
              {m.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.email}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {m.belege.length} {m.belege.length === 1 ? 'Beleg' : 'Belege'}
              </p>
            </div>
            <svg
              className="shrink-0 transition-transform"
              style={{ transform: expanded === m.user_id ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-muted)' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Belege Liste */}
          {expanded === m.user_id && (
            <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="pt-3 space-y-2">
                {m.belege.map(b => (
                  <a key={b.id} href={b.signedUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg group transition-all hover:bg-white/3"
                    style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {b.mime_type.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.signedUrl} alt={b.filename} className="w-full h-full object-cover" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{b.filename}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {formatSize(b.size_bytes)} · {new Date(b.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <svg className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
