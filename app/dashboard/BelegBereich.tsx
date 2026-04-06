'use client'

import { useState } from 'react'
import BelegUpload from './BelegUpload'
import BelegListe from './BelegListe'

export default function BelegBereich({ userId }: { userId: string }) {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      <BelegUpload userId={userId} onUploaded={() => setRefreshKey(k => k + 1)} />

      <div className="mt-10">
        <h2 className="text-sm font-medium mb-4" style={{ color: 'var(--text-muted)' }}>
          Gespeicherte Belege
        </h2>
        <BelegListe key={refreshKey} userId={userId} />
      </div>
    </>
  )
}
