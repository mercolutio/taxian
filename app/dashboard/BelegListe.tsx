'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type StorageFile = {
  name: string
  id: string
  signedUrl: string
  isPdf: boolean
  createdAt: string
}

export default function BelegListe({ userId }: { userId: string }) {
  const [files, setFiles] = useState<StorageFile[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const supabase = createClient()

    const { data: objects } = await supabase.storage
      .from('belege')
      .list(userId, { sortBy: { column: 'created_at', order: 'desc' } })

    if (!objects?.length) { setLoading(false); return }

    const paths = objects.map(o => `${userId}/${o.name}`)
    const { data: urls } = await supabase.storage
      .from('belege')
      .createSignedUrls(paths, 60 * 60) // 1h gültig

    const mapped: StorageFile[] = objects.map((o, i) => ({
      name: o.name,
      id: o.id ?? o.name,
      signedUrl: urls?.[i]?.signedUrl ?? '',
      isPdf: o.name.endsWith('.pdf'),
      createdAt: o.created_at
        ? new Date(o.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '',
    }))

    setFiles(mapped)
    setLoading(false)
  }

  useEffect(() => { load() }, [userId])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6" style={{ color: 'var(--text-muted)' }}>
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <span className="text-sm">Lade Belege…</span>
      </div>
    )
  }

  if (!files.length) {
    return (
      <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
        Noch keine Belege gespeichert.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {files.map(f => (
        <a
          key={f.id}
          href={f.signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-card rounded-xl p-3 flex items-center gap-3 transition-all hover:border-white/10 group"
          style={{ border: '1px solid var(--glass-border)', display: 'flex' }}
        >
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            {f.isPdf ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.signedUrl} alt={f.name} className="w-full h-full object-cover" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {f.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{f.createdAt}</p>
          </div>

          {/* Open icon */}
          <svg className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      ))}
    </div>
  )
}
