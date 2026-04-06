'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error'

type Beleg = {
  id: string
  file: File
  preview: string
  name: string
  size: string
  status: UploadStatus
  errorMsg?: string
  storagePath?: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_BADGE: Record<UploadStatus, { label: string; bg: string; color: string; border: string }> = {
  pending:   { label: 'Bereit',     bg: 'rgba(62,207,142,0.08)',  color: 'var(--neon-green)',  border: 'rgba(62,207,142,0.2)' },
  uploading: { label: 'Upload…',    bg: 'rgba(139,92,246,0.08)',  color: 'var(--neon-purple)', border: 'rgba(139,92,246,0.2)' },
  done:      { label: 'Gespeichert',bg: 'rgba(62,207,142,0.12)',  color: 'var(--neon-green)',  border: 'rgba(62,207,142,0.3)' },
  error:     { label: 'Fehler',     bg: 'rgba(239,68,68,0.08)',   color: '#f87171',            border: 'rgba(239,68,68,0.2)'  },
}

export default function BelegUpload({ userId }: { userId: string }) {
  const [belege, setBelege] = useState<Beleg[]>([])
  const [dragging, setDragging] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  function addFiles(files: File[]) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    const valid = files.filter(f => allowed.includes(f.type))
    const newBelege: Beleg[] = valid.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      name: file.name,
      size: formatSize(file.size),
      status: 'pending',
    }))
    setBelege(prev => [...prev, ...newBelege])
  }

  function setStatus(id: string, status: UploadStatus, extra?: Partial<Beleg>) {
    setBelege(prev => prev.map(b => b.id === id ? { ...b, status, ...extra } : b))
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files))
  }

  function removeBeleg(id: string) {
    setBelege(prev => {
      const b = prev.find(b => b.id === id)
      if (b?.preview) URL.revokeObjectURL(b.preview)
      return prev.filter(b => b.id !== id)
    })
  }

  async function startCamera() {
    setCameraError(null)
    setCameraActive(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch {
      setCameraError('Kamera konnte nicht geöffnet werden. Bitte Berechtigung prüfen.')
      setCameraActive(false)
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
    setCameraError(null)
  }

  function capturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `Beleg_${Date.now()}.jpg`, { type: 'image/jpeg' })
      addFiles([file])
      stopCamera()
    }, 'image/jpeg', 0.92)
  }

  async function handleEinreichen() {
    const pending = belege.filter(b => b.status === 'pending')
    if (!pending.length) return

    setUploading(true)
    const supabase = createClient()

    await Promise.all(pending.map(async beleg => {
      setStatus(beleg.id, 'uploading')

      const ext = beleg.file.name.split('.').pop() ?? 'bin'
      // Pfad: {userId}/{uuid}.{ext}  → jeder User sieht nur seine eigenen Dateien via RLS
      const path = `${userId}/${beleg.id}.${ext}`

      const { error } = await supabase.storage
        .from('belege')
        .upload(path, beleg.file, { contentType: beleg.file.type, upsert: false })

      if (error) {
        setStatus(beleg.id, 'error', { errorMsg: error.message })
      } else {
        setStatus(beleg.id, 'done', { storagePath: path })
      }
    }))

    setUploading(false)
  }

  const pendingCount = belege.filter(b => b.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      {!cameraActive && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="glass-card rounded-xl p-5 flex flex-col items-center gap-3 cursor-pointer"
            style={{ border: '1px solid var(--glass-border)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(62,207,142,0.1)', border: '1px solid rgba(62,207,142,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--neon-green)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Datei hochladen</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>JPG, PNG, PDF</p>
            </div>
          </button>

          <button
            onClick={startCamera}
            className="glass-card rounded-xl p-5 flex flex-col items-center gap-3 cursor-pointer"
            style={{ border: '1px solid var(--glass-border)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--neon-purple)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Foto aufnehmen</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Kamera öffnen</p>
            </div>
          </button>
        </div>
      )}

      {/* Drag & Drop Zone */}
      {!cameraActive && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className="rounded-xl border-2 border-dashed p-8 text-center transition-all"
          style={{
            borderColor: dragging ? 'var(--neon-green)' : 'rgba(255,255,255,0.08)',
            background: dragging ? 'rgba(62,207,142,0.04)' : 'transparent',
            boxShadow: dragging ? '0 0 24px rgba(62,207,142,0.1)' : 'none',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Dateien hier hineinziehen</p>
        </div>
      )}

      {/* Camera View */}
      {cameraActive && (
        <div className="glass-card rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
          <div className="relative bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-[60vh] object-contain" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-40 rounded-lg" style={{ border: '2px solid rgba(62,207,142,0.5)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)' }} />
            </div>
          </div>
          <div className="p-4 flex items-center justify-between" style={{ background: 'rgba(10,10,15,0.9)' }}>
            <button onClick={stopCamera} className="text-sm px-4 py-2 rounded-lg"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
              Abbrechen
            </button>
            <button onClick={capturePhoto}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{ background: 'var(--neon-green)', boxShadow: '0 0 24px var(--neon-green-glow)' }}>
              <div className="w-10 h-10 rounded-full bg-white/20" />
            </button>
            <div className="w-20" />
          </div>
        </div>
      )}

      {cameraError && (
        <p className="text-sm text-center" style={{ color: '#f87171' }}>{cameraError}</p>
      )}

      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple className="hidden" onChange={onFileInput} />

      {/* Beleg List */}
      {belege.length > 0 && (
        <div className="space-y-2 mt-2">
          <p className="text-xs font-medium px-1" style={{ color: 'var(--text-muted)' }}>
            {belege.length} {belege.length === 1 ? 'Beleg' : 'Belege'}
          </p>

          <div className="space-y-2">
            {belege.map(b => {
              const badge = STATUS_BADGE[b.status]
              return (
                <div key={b.id} className="glass-card rounded-xl p-3 flex items-center gap-3"
                  style={{ border: `1px solid ${b.status === 'error' ? 'rgba(239,68,68,0.2)' : 'var(--glass-border)'}` }}>

                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {b.preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.preview} alt={b.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: b.status === 'error' ? '#f87171' : 'var(--text-muted)' }}>
                      {b.status === 'error' ? b.errorMsg : b.size}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className="text-xs px-2 py-1 rounded-md shrink-0 flex items-center gap-1.5"
                    style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                    {b.status === 'uploading' && (
                      <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    )}
                    {b.status === 'done' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {badge.label}
                  </span>

                  {/* Remove — nur wenn nicht am Uploaden */}
                  {b.status !== 'uploading' && (
                    <button onClick={() => removeBeleg(b.id)}
                      className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5"
                      style={{ color: 'var(--text-muted)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Einreichen */}
          {pendingCount > 0 && (
            <button
              onClick={handleEinreichen}
              disabled={uploading}
              className="neon-btn w-full py-2.5 rounded-xl text-sm mt-2"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Wird hochgeladen…
                </span>
              ) : (
                pendingCount === 1 ? '1 Beleg einreichen' : `${pendingCount} Belege einreichen`
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
