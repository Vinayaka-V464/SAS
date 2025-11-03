"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import { findStudent, readDiary, readCalendarByMonth } from '../../teacher/data'

type EventColor = 'blue' | 'green' | 'orange' | 'pink' | 'violet' | 'red' | 'teal'

function useTheme() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored)
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark')
      }
    } catch {}
  }, [])
  React.useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme, mounted])
  return { theme, toggle: () => setTheme(t => (t === 'light' ? 'dark' : 'light')) }
}

function ymOf(d: Date) {
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${d.getFullYear()}-${m}`
}

function formatDMYFromYMD(ymd: string) {
  return `${ymd.slice(8,10)}/${ymd.slice(5,7)}/${ymd.slice(0,4)}`
}

export default function ParentDashboard() {
  const pathname = usePathname()
  const { toggle, theme } = useTheme()
  // Profile state
  const [parentName, setParentName] = React.useState<string>('Parent')
  const [photo, setPhoto] = React.useState<string | null>(null)
  const [photoDraft, setPhotoDraft] = React.useState<string | null>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [profileDraftName, setProfileDraftName] = React.useState('Parent')
  const [profileDraftPassword, setProfileDraftPassword] = React.useState('')
  const [profileMessage, setProfileMessage] = React.useState('')
  const avatarRef = React.useRef<HTMLElement | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const [childRoll, setChildRoll] = React.useState<string>('')
  const [childName, setChildName] = React.useState<string>('')
  const [klass, setKlass] = React.useState<string>('')
  const [section, setSection] = React.useState<'A' | 'B' | ''>('')
  const [diaryDate, setDiaryDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [diaryEntries, setDiaryEntries] = React.useState<Array<{subject:string; teacher:string; note:string; attachments?: any[]; color: EventColor}>>([])
  const [month, setMonth] = React.useState<Date>(() => new Date())
  const [notifications, setNotifications] = React.useState<Array<{date:string; title:string; tag:string; color:EventColor; description:string}>>([])

  React.useEffect(() => {
    // Load child roll from parent session
    try {
      const raw = sessionStorage.getItem('parent')
      if (!raw) return
      const { roll, name } = JSON.parse(raw)
      if (!roll) return
      setChildRoll(roll)
      if (name) { setParentName(name); setProfileDraftName(name) }
      const me = findStudent(roll)
      if (me) { setChildName(me.name); setKlass(me.klass); setSection(me.section) }
      // Load profile overrides and photo by child roll key
      try {
        const profRaw = localStorage.getItem(`parent:profile:${roll}`)
        if (profRaw) {
          const prof = JSON.parse(profRaw)
          if (prof?.name) { setParentName(prof.name); setProfileDraftName(prof.name) }
        }
      } catch {}
      try {
        const ph = localStorage.getItem(`parent:photo:${roll}`)
        if (ph) setPhoto(ph)
      } catch {}
    } catch {}
  }, [])

  const onPhotoChange = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoDraft(String(reader.result))
    reader.readAsDataURL(file)
  }

  React.useEffect(() => {
    // Diary entries for selected date, filtered by child's class/section
    try {
      const arr = readDiary(diaryDate)
      const filtered = arr.filter((e: any) => (!klass || e.klass === klass) && (!section || e.section === section))
      const mapped = filtered.map((e: any, idx: number) => ({
        subject: e.subject || 'Subject',
        teacher: e.teacher || 'Teacher',
        note: e.note || '',
        attachments: e.attachments || [],
        color: (['blue','green','orange','pink','violet'] as EventColor[])[idx % 5]
      }))
      setDiaryEntries(mapped)
    } catch { setDiaryEntries([]) }
  }, [diaryDate, klass, section])
  React.useEffect(() => {
    const recomputeDiary = () => {
      try {
        const arr = readDiary(diaryDate)
        const filtered = arr.filter((e: any) => (!klass || e.klass === klass) && (!section || e.section === section))
        const mapped = filtered.map((e: any, idx: number) => ({ subject: e.subject || 'Subject', teacher: e.teacher || 'Teacher', note: e.note || '', attachments: e.attachments || [], color: (['blue','green','orange','pink','violet'] as EventColor[])[idx % 5] }))
        setDiaryEntries(mapped)
      } catch { setDiaryEntries([]) }
    }
    const recomputeCal = () => { try { setNotifications(readCalendarByMonth(ymOf(month)) as any) } catch { setNotifications([]) } }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'school:diary') recomputeDiary()
      if (e.key === 'school:calendar') recomputeCal()
    }
    const onBus = (e: Event) => {
      try {
        const key = (e as CustomEvent).detail?.key
        if (!key) { recomputeDiary(); recomputeCal(); return }
        if (key === 'school:diary') recomputeDiary()
        if (key === 'school:calendar') recomputeCal()
      } catch { recomputeDiary(); recomputeCal() }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('school:update', onBus as EventListener) }
  }, [diaryDate, klass, section, month])

  React.useEffect(() => {
    // Notifications: reuse academic calendar entries of the current month
    try { setNotifications(readCalendarByMonth(ymOf(month)) as any) } catch { setNotifications([]) }
  }, [month])

  const navLinks: Array<{ href: Route; label: string }> = [
    { href: '/parent/dashboard', label: 'Dashboard' },
    { href: '/parent/progress', label: 'Progress' },
    { href: '/parent/attendance', label: 'Attendance' },
    { href: '/parent/payments', label: 'Payments' }
  ]

  return (
    <div>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>School SAS — Parent</strong>
          </div>
          <nav className="tabs" aria-label="Parent navigation">
            {navLinks.map(link => {
              const active = pathname?.startsWith(link.href)
              return (
                <Link key={link.href} className={`tab ${active ? 'tab-active' : ''}`} href={link.href}>
                  {link.label}
                </Link>
              )
            })}
          </nav>
          <div className="actions" style={{ position: 'relative' }}>
            <button className="btn-ghost" onClick={toggle} aria-label="Toggle theme">
              {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
            {photo ? (
              <img
                ref={avatarRef as React.MutableRefObject<HTMLImageElement | null>}
                src={photoDraft ?? photo}
                alt="Profile"
                className="avatar"
                onClick={() => setMenuOpen(o => !o)}
              />
            ) : (
              <div
                ref={avatarRef}
                className="avatar"
                aria-label="Set profile photo"
                title="Set profile photo"
                onClick={() => setMenuOpen(o => !o)}
              />
            )}
            {menuOpen && (
              <div ref={menuRef} className="menu" role="dialog" aria-label="Profile settings">
                <div className="menu-title">Profile Settings</div>
                <div className="field">
                  <label className="label">Parent Name</label>
                  <input className="input" value={profileDraftName} onChange={e=>setProfileDraftName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="field">
                  <label className="label">Child Roll</label>
                  <input className="input" value={childRoll} readOnly />
                </div>
                <div className="field">
                  <label className="label">Reset Password (simple)</label>
                  <input className="input" type="password" value={profileDraftPassword} onChange={e=>setProfileDraftPassword(e.target.value)} placeholder="Enter new simple password" />
                </div>
                <div className="field">
                  <label className="label">Profile Photo</label>
                  <input className="input" type="file" accept="image/*" onChange={e=>onPhotoChange(e.target.files?.[0])} />
                  {photoDraft && <div className="profile-preview">Preview ready. Save to keep changes.</div>}
                </div>
                {profileMessage && <div className="profile-message">{profileMessage}</div>}
                <div className="actions">
                  <button className="btn" type="button" onClick={() => {
                    try {
                      const trimmed = profileDraftName.trim() || 'Parent'
                      // Update session for convenience
                      const raw = sessionStorage.getItem('parent')
                      const payload = raw ? { ...JSON.parse(raw), name: trimmed } : { roll: childRoll, name: trimmed }
                      sessionStorage.setItem('parent', JSON.stringify(payload))
                      setParentName(trimmed)
                      if (childRoll) {
                        try { localStorage.setItem(`parent:profile:${childRoll}`, JSON.stringify({ name: trimmed, password: profileDraftPassword.trim() || '' })) } catch {}
                        if (photoDraft) { try { localStorage.setItem(`parent:photo:${childRoll}`, photoDraft) } catch {} }
                        if (photoDraft) { setPhoto(photoDraft); setPhotoDraft(null) }
                      }
                      setProfileDraftPassword('')
                      setProfileMessage('Profile updated successfully.')
                    } catch {
                      setProfileMessage('Could not update profile. Please try again.')
                    }
                  }}>Save changes</button>
                  <button className="btn-ghost" type="button" onClick={() => { setMenuOpen(false); setPhotoDraft(null); setProfileDraftPassword(''); setProfileMessage('') }}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Close profile menu on outside click / Escape */}
      {menuOpen && (
        <ProfileMenuCloser onClose={() => { setMenuOpen(false); setPhotoDraft(null); setProfileDraftPassword(''); setProfileMessage('') }} anchorRef={avatarRef} menuRef={menuRef} />
      )}

      <div className="dash-wrap">
        <div className="greeting">Hello, {parentName}. Monitoring {childName ? `${childName} (${childRoll})` : 'your ward'}.</div>

        <div className="grid">
          <section className="cal" aria-label="Digital diary">
            <div className="cal-head">
              <div className="cal-title">Digital Diary</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="input diary-date-input"
                  type="date"
                  value={diaryDate}
                  onChange={event => setDiaryDate(event.target.value)}
                />
              </div>
            </div>
            {diaryEntries.length === 0 && (
              <div className={`diary-banner banner-blue`}>
                <div>
                  <div className="diary-subject">No Updates</div>
                  <span className="diary-teacher">Teachers haven't published diary for this date.</span>
                </div>
                <span className="diary-lock">Read only</span>
              </div>
            )}
            {diaryEntries.map((entry, idx) => (
              <div key={idx} style={{marginTop: idx?12:0, border:'1px solid var(--panel-border)', borderRadius:16, overflow:'hidden', background:'var(--panel)', boxShadow:'0 10px 24px rgba(15,23,42,0.10)'}}>
                <div className={`diary-banner banner-${entry.color}`} style={{marginTop:0, borderBottom:'1px solid var(--panel-border)'}}>
                  <div>
                    <div className="diary-subject">{entry.subject}</div>
                    <span className="diary-teacher">Updated by {entry.teacher}</span>
                  </div>
                  <span className="diary-lock">Read only</span>
                </div>
                {Array.isArray((entry as any).attachments) && (entry as any).attachments.length > 0 && (
                  <div style={{display:'grid', gap:6, padding:'10px 14px'}}>
                    {(entry as any).attachments.map((a: any, i: number) => (
                      <div key={i} style={{display:'flex', alignItems:'center', justifyContent:'space-between', border:'1px dashed var(--panel-border)', borderRadius:10, padding:'8px 10px'}}>
                        <div style={{display:'flex', alignItems:'center', gap:10}}>
                          <span className="note">{a.type === 'link' ? 'Link' : 'File'}</span>
                          <span style={{fontWeight:600, overflow:'hidden', textOverflow:'ellipsis'}}>{a.type === 'link' ? a.url : a.name}</span>
                        </div>
                        {a.type === 'link' ? (
                          <a className="back" href={a.url} target="_blank" rel="noopener noreferrer">Open</a>
                        ) : (
                          <a className="back" href={a.dataUrl} download={a.name}>Download</a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="paper-view">{entry.note}</div>
              </div>
            ))}
            <p className="diary-note">Parents can read these updates. Contact the class teacher for clarifications.</p>
          </section>

          <aside className="events">
            <div className="events-head">Notifications</div>
            <div className="note-list">
              {notifications.length === 0 && <div className="note-card note-blue">No notifications for this month.</div>}
              {notifications.map((e, idx) => (
                <div key={idx} className={`note-card note-${(e as any).color || 'blue'}`}>
                  <div className="note-chip">{(e as any).tag || 'EVENT'}</div>
                  <div className="note-title">{(e as any).title}</div>
                  <small>{formatDMYFromYMD((e as any).date)}</small>
                  {(e as any).description && <p>{(e as any).description}</p>}
                </div>
              ))}
            </div>
          </aside>
        </div>

        <div className="dash" style={{ marginTop: 24 }}>
          <Link className="back" href="/">&larr; Back to login</Link>
        </div>
      </div>
    </div>
  )
}

function ProfileMenuCloser({ onClose, anchorRef, menuRef }: { onClose: () => void; anchorRef: React.RefObject<HTMLElement | null>; menuRef: React.RefObject<HTMLDivElement | null> }) {
  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (menuRef.current?.contains(target)) return
      if (anchorRef.current && (anchorRef.current as any).contains && (anchorRef.current as any).contains(target)) return
      onClose()
    }
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, anchorRef, menuRef])
  return null
}
