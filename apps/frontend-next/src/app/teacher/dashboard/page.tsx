"use client"
import React from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { seedIfNeeded, getClasses, getSectionsForClass, rosterBy, saveAttendance, readAttendance, saveDiary, addCalendarEvent, readCalendarByMonth, getAssignedClassesForTeacher, getAssignedSectionsForTeacher, hourOptionsForClass, getHoursForClass, getAssignedSubjectsForTeacher, getSubjects, getClassSubjects } from '../data'

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

export default function TeacherDashboard() {
  const { theme, toggle } = useTheme()
  const [teacher, setTeacher] = React.useState<{ name: string; subject: string } | null>(null)
  const [klass, setKlass] = React.useState<string>('')
  const [section, setSection] = React.useState<string>('')
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [hour, setHour] = React.useState<number>(1)
  const [present, setPresent] = React.useState<Record<string, boolean>>({})
  const [message, setMessage] = React.useState('')
  const [diaryNote, setDiaryNote] = React.useState('')
  const [diaryDate, setDiaryDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [diaryKlass, setDiaryKlass] = React.useState<string>(() => getClasses()[0] || 'Class 8')
  const [diarySection, setDiarySection] = React.useState<string>(() => getSectionsForClass((getClasses()[0]||''))[0] || 'A')
  const [teacherSubjects, setTeacherSubjects] = React.useState<string[]>([])
  const [diarySubject, setDiarySubject] = React.useState<string>('')
  React.useEffect(() => {
    setSection(prev => {
      const arr = getSectionsForClass(klass)
      return arr.includes(prev) ? prev : (arr[0] || '')
    })
    // Ensure selected hour stays within configured range for the class
    try {
      const max = getHoursForClass(klass)
      setHour(h => (h <= max ? h : 1))
    } catch {}
  }, [klass])
  React.useEffect(() => {
    setDiarySection(prev => {
      const arr = getSectionsForClass(diaryKlass)
      return arr.includes(prev) ? prev : (arr[0] || '')
    })
  }, [diaryKlass])
  const [linkInput, setLinkInput] = React.useState('')
  const [attachments, setAttachments] = React.useState<Array<any>>([])
  // Profile state
  const [photo, setPhoto] = React.useState<string | null>(null)
  const [photoDraft, setPhotoDraft] = React.useState<string | null>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [profileDraftName, setProfileDraftName] = React.useState('')
  const [profileDraftPassword, setProfileDraftPassword] = React.useState('')
  const [profileMessage, setProfileMessage] = React.useState('')
  const avatarRef = React.useRef<HTMLElement | null>(null)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const [teacherKey, setTeacherKey] = React.useState<string>('')
  // Calendar state
  const [calDate, setCalDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [calTitle, setCalTitle] = React.useState('')
  const [calTag, setCalTag] = React.useState('ASSESSMENT')
  const [calColor, setCalColor] = React.useState<'blue'|'green'|'orange'|'pink'|'violet'>('blue')
  const [calDesc, setCalDesc] = React.useState('')
  const [calMonth, setCalMonth] = React.useState<string>(() => new Date().toISOString().slice(0,7))
  const [calList, setCalList] = React.useState<Array<any>>([])

  React.useEffect(() => {
    seedIfNeeded()
    const raw = sessionStorage.getItem('teacher')
    if (raw) {
      const obj = JSON.parse(raw)
      setTeacher(obj)
      if (obj?.name) setTeacherKey(obj.name)
      // Load subjects for this teacher from staff records
      try {
        const tRaw = localStorage.getItem('school:teachers')
        const list = tRaw ? JSON.parse(tRaw) : []
        const rec = Array.isArray(list) ? list.find((x: any) => x.name && obj.name && x.name.toLowerCase() === obj.name.toLowerCase()) : null
        const subs: string[] = rec?.subjects && Array.isArray(rec.subjects) ? rec.subjects : (rec?.subject ? [rec.subject] : (obj.subject ? [obj.subject] : []))
        setTeacherSubjects(subs)
        setDiarySubject(subs[0] || obj.subject || '')
      } catch {}
      try {
        const classes = getAssignedClassesForTeacher(obj.name)
        if (classes.length) {
          setKlass(classes[0])
          const secs = getAssignedSectionsForTeacher(obj.name, classes[0])
          setSection(secs[0] || getSectionsForClass(classes[0])[0] || '')
        } else {
          const all = getClasses(); setKlass(all[0] || ''); setSection(getSectionsForClass(all[0] || '')[0] || '')
        }
      } catch {}
    }
  }, [])

  // Respond to HOD updates for classes/sections/assignments/subjects
  React.useEffect(() => {
    const onBus = (e: Event) => {
      try {
        const key = (e as CustomEvent).detail?.key as string | undefined
        if (!key) return
        if (key === 'school:assignments' || key === 'school:subjects' || key === 'school:classSubjects' || key === 'school:teachers') {
          if (!teacher) return
          const assigned = getAssignedSubjectsForTeacher(teacher.name, diaryKlass, diarySection)
          const classSubs = getClassSubjects(diaryKlass, diarySection)
          const base = (assigned.length ? assigned : (classSubs.length ? classSubs : (teacherSubjects.length ? teacherSubjects : getSubjects())))
          setDiarySubject(prev => (base.includes(prev) ? prev : (base[0] || prev)))
        }
        if (key === 'school:classSections' || key === 'school:classes') {
          setSection(prev => { const arr = getSectionsForClass(klass); return arr.includes(prev) ? prev : (arr[0] || prev) })
          setDiarySection(prev => { const arr = getSectionsForClass(diaryKlass); return arr.includes(prev) ? prev : (arr[0] || prev) })
        }
      } catch {}
    }
    window.addEventListener('school:update', onBus as EventListener)
    return () => window.removeEventListener('school:update', onBus as EventListener)
  }, [teacher, klass, diaryKlass, diarySection, teacherSubjects])

  // Keep diary subject within allowed list for selected class/section
  React.useEffect(() => {
    if (!teacher) return
    const assigned = getAssignedSubjectsForTeacher(teacher.name, diaryKlass, diarySection)
    const classSubs = getClassSubjects(diaryKlass, diarySection)
    const base = (assigned.length ? assigned : (classSubs.length ? classSubs : (teacherSubjects.length ? teacherSubjects : getSubjects())))
    setDiarySubject(prev => (base.includes(prev) ? prev : (base[0] || prev)))
  }, [teacher, teacherSubjects, diaryKlass, diarySection])

  // Load profile overrides and photo when teacher is known
  React.useEffect(() => {
    if (!teacherKey) return
    try {
      const profRaw = localStorage.getItem(`teacher:profile:${teacherKey}`)
      if (profRaw) {
        const prof = JSON.parse(profRaw)
        if (prof?.name) {
          setTeacher(t => t ? { ...t, name: prof.name } : t)
          setProfileDraftName(prof.name)
        }
      } else {
        setProfileDraftName(teacher?.name || '')
      }
    } catch {}
    try {
      const ph = localStorage.getItem(`teacher:photo:${teacherKey}`)
      if (ph) setPhoto(ph)
    } catch {}
  }, [teacherKey])

  const onPhotoChange = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotoDraft(String(reader.result))
    reader.readAsDataURL(file)
  }

  React.useEffect(() => {
    const map = readAttendance(date, klass, section, hour)
    setPresent(map)
  }, [date, klass, section, hour])

  const students = React.useMemo(() => rosterBy(klass, section), [klass, section])

  const navLinks: Array<{ href: Route; label: string }> = [
    { href: '/teacher/dashboard', label: 'Dashboard' },
    { href: '/teacher/academic-content', label: 'Academic Content' },
    { href: '/teacher/circulars', label: 'Circulars' },
    { href: '/teacher/marks', label: 'Marks Entry' }
  ]

  const onSaveAttendance = () => {
    // Persist a complete map for this class/hour so every student reflects in their dashboard
    const full: Record<string, boolean> = {}
    for (const s of students) {
      full[s.usn] = Object.prototype.hasOwnProperty.call(present, s.usn) ? !!present[s.usn] : true
    }
    saveAttendance(date, klass, section, hour, full)
    setMessage('Attendance saved.')
    setTimeout(() => setMessage(''), 1500)
  }

  const onSaveDiary = () => {
    if (!teacher) return
    const note = diaryNote.trim()
    if (!note && attachments.length === 0) return setMessage('Enter a note or add an attachment.')
    const subj = (diarySubject || teacher.subject || '').trim()
    saveDiary(diaryDate, { subject: subj, teacher: teacher.name, note, klass: diaryKlass, section: diarySection as any, attachments })
    setMessage('Diary updated for the selected date.')
    setDiaryNote('')
    setAttachments([])
    setLinkInput('')
    setTimeout(() => setMessage(''), 1500)
  }

  const addLink = () => {
    try {
      const u = new URL(linkInput.trim())
      setAttachments(prev => [{ type: 'link', url: u.toString() }, ...prev])
      setLinkInput('')
    } catch {
      setMessage('Enter a valid URL starting with http or https')
      setTimeout(() => setMessage(''), 1200)
    }
  }

  const addFiles = async (files?: FileList | null) => {
    if (!files) return
    const maxBytes = 1024 * 1024 // 1MB per file
    const items: any[] = []
    for (const f of Array.from(files)) {
      if (f.size > maxBytes) { setMessage(`Skipped ${f.name} (>1MB)`); continue }
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader(); r.onerror = () => rej(''); r.onload = () => res(String(r.result)); r.readAsDataURL(f)
      })
      items.push({ type: 'file', name: f.name, mime: f.type || 'application/octet-stream', dataUrl })
    }
    if (items.length) setAttachments(prev => [...items, ...prev])
  }

  // Calendar actions
  React.useEffect(() => {
    try { setCalList(readCalendarByMonth(calMonth)) } catch { setCalList([]) }
  }, [calMonth])
  React.useEffect(() => {
    const refresh = () => { try { setCalList(readCalendarByMonth(calMonth)) } catch { setCalList([]) } }
    const onStorage = (e: StorageEvent) => { if (e.key === 'school:calendar') refresh() }
    const onBus = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('school:update', onBus as EventListener) }
  }, [calMonth])

  const onAddCalendarEvent = () => {
    if (!teacher) return
    if (!calTitle.trim()) { setMessage('Enter event title'); setTimeout(()=>setMessage(''), 1200); return }
    addCalendarEvent({ date: calDate, title: calTitle.trim(), tag: calTag.trim() || 'EVENT', color: calColor, description: calDesc.trim(), createdBy: teacher.name })
    setMessage('Calendar event added.')
    setCalDesc(''); setCalTitle('')
    setCalList(readCalendarByMonth(calMonth))
  }

  return (
    <div>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark">
            <span className="dot" />
            <strong>School SAS — Teacher</strong>
          </div>
          <nav className="tabs" aria-label="Teacher navigation">
            {navLinks.map(link => (
              <Link key={link.href} className={`tab ${link.href === '/teacher/dashboard' ? 'tab-active' : ''}`} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="actions" style={{ position: 'relative' }}>
            <button className="btn-ghost" onClick={toggle}>{theme === 'light' ? 'Dark' : 'Light'} Mode</button>
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
                  <label className="label">Name</label>
                  <input className="input" value={profileDraftName} onChange={e=>setProfileDraftName(e.target.value)} placeholder="Teacher name" />
                </div>
                <div className="field">
                  <label className="label">Subject</label>
                  <input className="input" value={teacher?.subject || ''} readOnly />
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
                      const trimmed = profileDraftName.trim() || (teacher?.name || 'Teacher')
                      if (teacher) {
                        const payload = { ...teacher, name: trimmed }
                        sessionStorage.setItem('teacher', JSON.stringify(payload))
                        setTeacher(payload)
                      }
                      if (teacherKey) {
                        try { localStorage.setItem(`teacher:profile:${teacherKey}`, JSON.stringify({ name: trimmed, password: profileDraftPassword.trim() || '' })) } catch {}
                        if (photoDraft) { try { localStorage.setItem(`teacher:photo:${teacherKey}`, photoDraft) } catch {} }
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
        <div className="greeting">Welcome{teacher ? `, ${teacher.name}${(teacherSubjects && teacherSubjects.length) ? ` (${teacherSubjects.join(', ')})` : (teacher.subject ? ` (${teacher.subject})` : '')}` : ''}.</div>

        <div className="grid">
          <section className="cal" aria-label="Attendance">
            <div className="cal-head">
              <div className="cal-title">Mark Attendance</div>
            </div>
            <div style={{display:'grid', gap:12, padding:18}}>
              <div className="row">
                <select className="input select" value={klass} onChange={e=>setKlass(e.target.value)}>
                  {(teacher ? (getAssignedClassesForTeacher(teacher.name).length ? getAssignedClassesForTeacher(teacher.name) : getClasses()) : getClasses()).map(c=> <option key={c}>{c}</option>)}
                </select>
                <select className="input select" value={section} onChange={e=>setSection(e.target.value)}>
                  {(teacher ? (getAssignedSectionsForTeacher(teacher.name, klass).length ? getAssignedSectionsForTeacher(teacher.name, klass) : getSectionsForClass(klass)) : getSectionsForClass(klass)).map(s=> <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="row">
                <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
                <select className="input select" value={hour} onChange={e=>setHour(Number(e.target.value))}>
                  {hourOptionsForClass(klass).map(h=> <option key={h} value={h}>Hour {h}</option>)}
                </select>
              </div>
              <div style={{display:'grid', gap:8}}>
                <div className="actions">
                  <button className="btn-ghost" type="button" onClick={()=>{
                    const map: Record<string, boolean> = {}
                    for (const s of students) map[s.usn] = true
                    setPresent(map)
                  }}>Mark all present</button>
                  <button className="btn-ghost" type="button" onClick={()=>{
                    const map: Record<string, boolean> = {}
                    for (const s of students) map[s.usn] = false
                    setPresent(map)
                  }}>Mark all absent</button>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:8}}>
                  {students.map(s => (
                    <label key={s.usn} style={{border:'1px solid var(--panel-border)', borderRadius:10, padding:10, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                      <span style={{fontWeight:600}}>{s.usn} — {s.name}</span>
                      <select
                        className="input select"
                        style={{width:140}}
                        // Default to Present when undefined to match save behavior
                        value={present[s.usn] === false ? 'A' : 'P'}
                        onChange={e=>{
                          const v = e.target.value === 'P'
                          setPresent(prev => ({...prev, [s.usn]: v}))
                        }}
                      >
                        <option value="P">Present</option>
                        <option value="A">Absent</option>
                      </select>
                    </label>
                  ))}
                </div>
                <div className="actions">
                  <button className="btn" type="button" onClick={onSaveAttendance}>Save Attendance</button>
                </div>
              </div>
            </div>
          </section>

          <aside className="events">
            <div className="events-head">Digital Diary / Assignment</div>
            <div style={{padding:18, display:'grid', gap:10}}>
              <div style={{display:'grid', gap:8}}>
                <div className="row">
                  <input className="input" type="date" value={diaryDate} onChange={e=>setDiaryDate(e.target.value)} />
                  <select className="input select" value={diarySubject} onChange={e=> setDiarySubject(e.target.value)}>
                    {(function(){
                      if (!teacher) return []
                      const assigned = getAssignedSubjectsForTeacher(teacher.name, diaryKlass, diarySection)
                      const classSubs = getClassSubjects(diaryKlass, diarySection)
                      const base = (assigned.length ? assigned : (classSubs.length ? classSubs : (teacherSubjects.length ? teacherSubjects : getSubjects())))
                      return base.map(s => <option key={s} value={s}>{s}</option>)
                    })()}
                  </select>
                </div>
                <div className="row">
                  <select className="input select" value={diaryKlass} onChange={e=>setDiaryKlass(e.target.value)}>
                    {(teacher ? (getAssignedClassesForTeacher(teacher.name).length ? getAssignedClassesForTeacher(teacher.name) : getClasses()) : getClasses()).map(c=> <option key={c}>{c}</option>)}
                  </select>
                  <select className="input select" value={diarySection} onChange={e=>setDiarySection(e.target.value)}>
                    {(teacher ? (getAssignedSectionsForTeacher(teacher.name, diaryKlass).length ? getAssignedSectionsForTeacher(teacher.name, diaryKlass) : getSectionsForClass(diaryKlass)) : getSectionsForClass(diaryKlass)).map(s=> <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <textarea className="paper" style={{minHeight:160}} placeholder="Enter assignment/diary update" value={diaryNote} onChange={e=>setDiaryNote(e.target.value)} />
              <div className="row">
                <input className="input" placeholder="https://link.to/resource" value={linkInput} onChange={e=>setLinkInput(e.target.value)} />
                <button type="button" className="btn-ghost" onClick={addLink}>Add Link</button>
              </div>
              <div className="row" style={{alignItems:'center'}}>
                <input className="input" type="file" multiple onChange={e=>addFiles(e.target.files)} />
              </div>
              {attachments.length > 0 && (
                <div style={{display:'grid', gap:6}}>
                  {attachments.map((a, i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px dashed var(--panel-border)', borderRadius:8, padding:'6px 10px'}}>
                      <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <span className="note">{a.type === 'link' ? 'Link' : 'File'}</span>
                        <span style={{fontWeight:600}}>{a.type === 'link' ? a.url : a.name}</span>
                      </div>
                      <button className="btn-ghost" type="button" onClick={()=> setAttachments(prev => prev.filter((_,idx)=> idx!==i))}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <button className="btn" type="button" onClick={onSaveDiary}>Publish for selected date</button>
              {message && <div className="profile-message">{message}</div>}
            </div>
          </aside>
        </div>

        <div className="grid" style={{marginTop:18}}>
          <section className="cal" aria-label="Academic calendar events">
            <div className="cal-head">
              <div className="cal-title">Academic Calendar — Add Event</div>
            </div>
            <div style={{display:'grid', gap:10, padding:18}}>
              <div className="row">
                <input className="input" type="date" value={calDate} onChange={e=>{ setCalDate(e.target.value); setCalMonth(e.target.value.slice(0,7)) }} />
                <select className="input select" value={calColor} onChange={e=> setCalColor(e.target.value as any)}>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="orange">Orange</option>
                  <option value="pink">Pink</option>
                  <option value="violet">Violet</option>
                  <option value="red">Red</option>
                  <option value="teal">Teal</option>
                </select>
                <input className="input" value={calTag} onChange={e=> setCalTag(e.target.value)} placeholder="Tag e.g. ASSESSMENT" />
              </div>
              <input className="input" value={calTitle} onChange={e=> setCalTitle(e.target.value)} placeholder="Event title" />
              <textarea className="paper" style={{minHeight:100}} placeholder="Event description (optional)" value={calDesc} onChange={e=> setCalDesc(e.target.value)} />
              <div className="actions">
                <button className="btn" type="button" onClick={onAddCalendarEvent}>Add Event</button>
              </div>
            </div>
          </section>

          <aside className="events">
            <div className="events-head">Events in {calMonth}</div>
            <div className="note-list">
              {calList.length === 0 && <div className="note-card note-blue">No events saved for this month.</div>}
              {calList.map((e, idx) => (
                <div key={idx} className={`note-card note-${e.color}`}>
                  <div className="note-chip">{e.tag}</div>
                  <div className="note-title">{e.title}</div>
                  <small>{e.date}</small>
                  {e.description && <p>{e.description}</p>}
                  <small>By {e.createdBy}</small>
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
