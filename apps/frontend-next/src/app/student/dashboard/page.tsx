"use client"
import React from 'react'
import { findStudent } from '../../teacher/data'
import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'

type EventColor = 'blue' | 'green' | 'orange' | 'pink' | 'violet'

type Event = { date: string; title: string; color: EventColor; description: string; tag: string }

// No static diary entries; shows only what teachers publish

function useTheme() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = React.useState(false)
  const storageKeyRef = React.useRef<string>('theme')
  React.useEffect(() => {
    setMounted(true)
    try {
      // Derive per-student theme key if available
      const sraw = sessionStorage.getItem('student')
      if (sraw) {
        try {
          const { roll } = JSON.parse(sraw)
          if (roll) storageKeyRef.current = `student:theme:${roll}`
        } catch {}
      }
      const stored = localStorage.getItem(storageKeyRef.current) as 'light' | 'dark' | null
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
    try { localStorage.setItem(storageKeyRef.current, theme) } catch {}
  }, [theme, mounted])
  return { theme, toggle: () => setTheme(t => (t === 'light' ? 'dark' : 'light')) }
}

function getMonthMatrix(base: Date) {
  const first = new Date(base.getFullYear(), base.getMonth(), 1)
  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7)) // start on Monday
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    days.push(d)
  }
  return days
}

function formatYMD(d: Date) {
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// Deterministic date helpers to avoid SSR/CSR locale differences
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

function ymOf(d: Date) {
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  return `${d.getFullYear()}-${m}`
}

function formatDMYFromYMD(ymd: string) {
  // ymd is expected as YYYY-MM-DD
  const y = ymd.slice(0, 4)
  const m = ymd.slice(5, 7)
  const d = ymd.slice(8, 10)
  return `${d}/${m}/${y}`
}

export default function StudentDashboard() {
  const pathname = usePathname()
  const { toggle, theme } = useTheme()

  const [month, setMonth] = React.useState(() => new Date())
  const [name, setName] = React.useState('Student')
  const [roll, setRoll] = React.useState('')
  const [photo, setPhoto] = React.useState<string | null>(null)
  const [photoDraft, setPhotoDraft] = React.useState<string | null>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null)
  const [diaryDate, setDiaryDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [profileDraftName, setProfileDraftName] = React.useState('Student')
  const [profileDraftPassword, setProfileDraftPassword] = React.useState('')
  const [profileMessage, setProfileMessage] = React.useState('')
  const avatarRef = React.useRef<HTMLElement | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const mobileNavRef = React.useRef<HTMLDivElement | null>(null)

  // Mobile breakpoint detection to alter calendar behavior
  const isMobile = (() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 640px)').matches
  })()

  React.useEffect(() => {
    const stored = sessionStorage.getItem('student')
    if (stored) {
      try {
        const obj = JSON.parse(stored)
        if (obj.name) {
          setName(obj.name)
          setProfileDraftName(obj.name)
        }
        if (obj.roll) {
          setRoll(obj.roll)
          // Load per-student profile and photo
          try {
            const profRaw = localStorage.getItem(`student:profile:${obj.roll}`)
            if (profRaw) {
              const prof = JSON.parse(profRaw)
              if (typeof prof?.name === 'string' && prof.name.trim()) {
                setName(prof.name)
                setProfileDraftName(prof.name)
              }
            }
          } catch {}
          const ph = localStorage.getItem(`student:photo:${obj.roll}`)
          if (ph) setPhoto(ph)
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [])

  React.useEffect(() => {
    setProfileDraftName(name)
  }, [name])

  const days = getMonthMatrix(month)
  const isSameMonth = (d: Date) => d.getMonth() === month.getMonth()
  const isToday = (d: Date) => {
    const t = new Date()
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
  }
  const monthStr = `${MONTHS[month.getMonth()]} ${month.getFullYear()}`
  const [extraEvents, setExtraEvents] = React.useState<Event[]>([])
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('school:calendar')
      if (!raw) { setExtraEvents([]); return }
      const store = JSON.parse(raw)
      const out: Event[] = []
      for (const k of Object.keys(store)) {
        const v = store[k]
        const arr = Array.isArray(v) ? v : [v]
        for (const ev of arr) {
          out.push({ date: ev.date, title: ev.title, color: ev.color as EventColor, description: ev.description, tag: ev.tag })
        }
      }
      setExtraEvents(out)
    } catch { setExtraEvents([]) }
  }, [])
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === 'school:calendar') {
      try {
        const raw = localStorage.getItem('school:calendar')
        const store = raw ? JSON.parse(raw) : {}
        const out: Event[] = []
        for (const k of Object.keys(store)) {
          const v = store[k]; const arr = Array.isArray(v) ? v : [v]
          for (const ev of arr) out.push({ date: ev.date, title: ev.title, color: ev.color as EventColor, description: ev.description, tag: ev.tag })
        }
        setExtraEvents(out)
      } catch { setExtraEvents([]) }
    } }
    const onBus = () => {
      try {
        const raw = localStorage.getItem('school:calendar')
        const store = raw ? JSON.parse(raw) : {}
        const out: Event[] = []
        for (const k of Object.keys(store)) {
          const v = store[k]; const arr = Array.isArray(v) ? v : [v]
          for (const ev of arr) out.push({ date: ev.date, title: ev.title, color: ev.color as EventColor, description: ev.description, tag: ev.tag })
        }
        setExtraEvents(out)
      } catch { setExtraEvents([]) }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('school:update', onBus as EventListener)
    }
  }, [])
  const allEvents = React.useMemo(() => [...extraEvents], [extraEvents])
  const eventsThisMonth = allEvents.filter(e => e.date.slice(0, 7) === ymOf(month))

  const onPhotoChange = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = String(reader.result)
      setPhotoDraft(data)
    }
    reader.readAsDataURL(file)
  }

  const previewPhoto = photoDraft ?? photo
  const [diaryEntries, setDiaryEntries] = React.useState<Array<{subject:string; teacher:string; note:string; attachments?: any[]; color: EventColor}>>([])

  React.useEffect(() => {
    // Compute on client after mount to avoid hydration mismatch
    try {
      const raw = localStorage.getItem('school:diary')
      if (raw) {
        const store = JSON.parse(raw)
        const v = store[diaryDate]
        if (v) {
          const arr = Array.isArray(v) ? v : [v]
          let klass: string | null = null
          let section: string | null = null
          try {
            const sraw = sessionStorage.getItem('student')
            if (sraw) {
              const { roll } = JSON.parse(sraw)
              const me = findStudent(roll)
              if (me) { klass = me.klass; section = me.section }
            }
          } catch {}
          const filtered = klass && section ? arr.filter((e: any) => e.klass === klass && e.section === section) : arr
          const mapped = filtered.map((e: any, idx: number) => ({
            subject: e.subject || 'Subject',
            teacher: e.teacher || 'Teacher',
            note: e.note || '',
            attachments: e.attachments || [],
            color: (['blue','green','orange','pink','violet'] as EventColor[])[idx % 5]
          }))
          setDiaryEntries(mapped)
          return
        }
      }
    } catch {}
    setDiaryEntries([])
  }, [diaryDate])
  React.useEffect(() => {
    const recompute = () => {
      try {
        const raw = localStorage.getItem('school:diary')
        const store = raw ? JSON.parse(raw) : {}
        const v = store[diaryDate]
        const arr = v ? (Array.isArray(v) ? v : [v]) : []
        let klass: string | null = null, section: string | null = null
        try { const sraw = sessionStorage.getItem('student'); if (sraw) { const { roll } = JSON.parse(sraw); const me = findStudent(roll); if (me) { klass = me.klass; section = me.section } } } catch {}
        const filtered = klass && section ? arr.filter((e: any) => e.klass === klass && e.section === section) : arr
        const mapped = filtered.map((e: any, idx: number) => ({ subject: e.subject || 'Subject', teacher: e.teacher || 'Teacher', note: e.note || '', attachments: e.attachments || [], color: (['blue','green','orange','pink','violet'] as EventColor[])[idx % 5] }))
        setDiaryEntries(mapped)
      } catch { setDiaryEntries([]) }
    }
    const onStorage = (e: StorageEvent) => { if (e.key === 'school:diary') recompute() }
    const onBus = (e: Event) => {
      try { const detail = (e as CustomEvent).detail; if (!detail || !detail.key || detail.key === 'school:diary') recompute() } catch { recompute() }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('school:update', onBus as EventListener) }
  }, [diaryDate])

  const navLinks: Array<{ href: Route; label: string }> = [
    { href: '/student/dashboard', label: 'Dashboard' },
    { href: '/student/progress', label: 'Progress Report' },
    { href: '/student/attendance', label: 'Attendance' },
    { href: '/student/circulars', label: 'Circulars' },
    { href: '/student/syllabus', label: 'Academic Syllabus' }
  ]

  const closeMenu = React.useCallback(() => {
    setMenuOpen(false)
    setPhotoDraft(null)
    setProfileDraftPassword('')
    setProfileMessage('')
    setProfileDraftName(name)
  }, [name])

  const onAvatarClick = () => {
    setMenuOpen(open => {
      const next = !open
      if (next) {
        setProfileDraftName(name)
        setProfileDraftPassword('')
        setProfileMessage('')
        setPhotoDraft(null)
      } else {
        setPhotoDraft(null)
        setProfileDraftPassword('')
        setProfileMessage('')
      }
      return next
    })
  }

  // Close the profile menu when the user clicks outside or presses Escape.
  React.useEffect(() => {
    if (!menuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (menuRef.current?.contains(target)) return
      if (avatarRef.current?.contains(target)) return
      closeMenu()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen, closeMenu])

  // Close the mobile nav on outside click or Escape
  React.useEffect(() => {
    if (!mobileNavOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (mobileNavRef.current?.contains(target)) return
      setMobileNavOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileNavOpen])


  const handleProfileSave = () => {
    try {
      const stored = sessionStorage.getItem('student')
      const payload = stored ? JSON.parse(stored) : {}
      const trimmedName = profileDraftName.trim() || 'Student'
      payload.name = trimmedName
      if (roll) payload.roll = roll
      if (profileDraftPassword.trim()) {
        payload.password = profileDraftPassword.trim()
      }
      sessionStorage.setItem('student', JSON.stringify(payload))
      // Persist per-student profile
      try { localStorage.setItem(`student:profile:${roll}`, JSON.stringify({ name: trimmedName, password: payload.password || '' })) } catch {}
      setName(trimmedName)
      if (photoDraft) {
        try { localStorage.setItem(`student:photo:${roll}`, photoDraft) } catch {}
        setPhoto(photoDraft)
        setPhotoDraft(null)
      }
      setProfileDraftPassword('')
      setProfileMessage('Profile updated successfully.')
    } catch {
      setProfileMessage('Could not update profile. Please try again.')
    }
  }

  return (
    <div>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>NOVA FUZE</strong>
          </div>
          <nav className="tabs" aria-label="Student navigation">
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
            <button
              className="btn-ghost hamburger"
              aria-label="Open navigation menu"
              onClick={() => setMobileNavOpen(open => !open)}
            >
              ☰
            </button>
            <button className="btn-ghost" onClick={toggle} aria-label="Toggle theme">
              {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
            {previewPhoto ? (
              <img
                ref={avatarRef as React.MutableRefObject<HTMLImageElement | null>}
                src={previewPhoto}
                alt="Profile"
                className="avatar"
                onClick={onAvatarClick}
              />
            ) : (
              <div
                ref={avatarRef}
                className="avatar"
                aria-label="Set profile photo"
                title="Set profile photo"
                onClick={onAvatarClick}
              />
            )}
            {menuOpen && (
              <div ref={menuRef} className="menu" role="dialog" aria-label="Profile settings">
                <div className="menu-title">Profile Settings</div>
                <div className="field">
                  <label className="label">Name</label>
                  <input
                    className="input"
                    value={profileDraftName}
                    onChange={event => setProfileDraftName(event.target.value)}
                    placeholder="Student name"
                  />
                </div>
                <div className="field">
                  <label className="label">Roll Number</label>
                  <input className="input" value={roll} readOnly />
                </div>
                <div className="field">
                  <label className="label">Reset Password (simple)</label>
                  <input
                    className="input"
                    type="password"
                    value={profileDraftPassword}
                    placeholder="Enter new simple password"
                    onChange={event => setProfileDraftPassword(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Profile Photo</label>
                  <input className="input" type="file" accept="image/*" onChange={event => onPhotoChange(event.target.files?.[0])} />
                  {photoDraft && <div className="profile-preview">Preview ready. Save to keep changes.</div>}
                </div>
                {profileMessage && <div className="profile-message">{profileMessage}</div>}
                <div className="actions">
                  <button className="btn" type="button" onClick={handleProfileSave}>
                    Save changes
                  </button>
                  <button className="btn-ghost" type="button" onClick={closeMenu}>
                    Close
                  </button>
                </div>
              </div>
            )}
            {mobileNavOpen && (
              <div ref={mobileNavRef} className="mobile-nav" role="dialog" aria-label="Mobile navigation">
                {navLinks.map(link => {
                  const active = pathname?.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      className={`tab ${active ? 'tab-active' : ''}`}
                      href={link.href}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dash-wrap">
        <div className="greeting">
          Hello, <strong>{name}</strong>! Here is your refreshed academic hub.
        </div>

        <div className="grid">
          <section className="cal" aria-label="Academic calendar">
            <div className="cal-head">
              <button className="btn-ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
                Prev
              </button>
              <div className="cal-title">{monthStr}</div>
              <button className="btn-ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
                Next
              </button>
            </div>
            <div className="cal-grid">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="cal-dow">
                  {d}
                </div>
              ))}
              {days.map((d, index) => {
                const ymd = formatYMD(d)
                const dots = allEvents.filter(e => e.date === ymd)
                const primaryColor = dots[0]?.color
                const isSelected = selectedDay === ymd
                const showEventPills = dots.length > 0 && (!isMobile || !isSelected)
                const showEventLine = dots.length > 0 && isMobile && isSelected
                const eventLine = showEventLine ? dots.map(e => e.tag.toUpperCase()).join(' • ') : ''
                return (
                  <div
                    key={index}
                    className={`cal-day ${isSameMonth(d) ? '' : 'cal-out'} ${isToday(d) ? 'cal-today' : ''} ${
                      dots.length ? 'cal-has-event' : ''
                    } ${isSelected ? 'cal-selected' : ''}`}
                    data-eventcolor={primaryColor || undefined}
                    role={isMobile ? 'button' : undefined}
                    aria-pressed={isMobile ? isSelected : undefined}
                    onClick={() => {
                      if (!isMobile) return
                      if (!dots.length) return setSelectedDay(null)
                      setSelectedDay(prev => (prev === ymd ? null : ymd))
                    }}
                  >
                    <div className="cal-num">{d.getDate()}</div>
                    <div className="event-dots">
                      {dots.map((e, idx) => (
                        <span key={idx} className={`event-dot dot-${e.color}`} title={e.title} />
                      ))}
                    </div>
                    {showEventPills && (
                      <div className="event-pills">
                        {dots.map((e, idx) => (
                          <span key={idx} className={`event-pill pill-${e.color}`} title={e.description}>
                            {e.tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {showEventLine && (
                      <div className="event-line" title={eventLine}>
                        {eventLine}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="cal-mini">Bright highlights mark important days. See more details on the right.</div>
          </section>

          <aside className="events">
            <div className="events-head">Events in {MONTHS[month.getMonth()]}</div>
            <div className="note-list">
              {eventsThisMonth.length === 0 && <div className="note-card note-blue">No events planned this month.</div>}
              {eventsThisMonth.map((e, idx) => (
                <div key={idx} className={`note-card note-${e.color}`}>
                  <div className="note-chip">{e.tag}</div>
                  <div className="note-title">{e.title}</div>
                  <small>{formatDMYFromYMD(e.date)}</small>
                  <p>{e.description}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="diary" aria-label="Digital diary">
          <div className="diary-head">
            <div className="diary-heading">Student Digital Diary</div>
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
          <p className="diary-note">Students can read these updates. Contact your class teacher if you need a change.</p>
        </section>
      </div>

      <div className="dash" style={{ marginTop: 24 }}>
        <Link className="back" href="/">
          &larr; Back to login
        </Link>
      </div>
    </div>
  )
}
