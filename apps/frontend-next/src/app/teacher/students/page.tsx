"use client"
import React from 'react'
import Link from 'next/link'
import { getClasses, getSectionsForClass, Student, seedIfNeeded, getAssignedClassesForTeacher, getAssignedSectionsForTeacher } from '../data'

const CLASS_USN_RANGES: Record<string, { start: number; end: number }> = {
  'Class 8': { start: 801, end: 810 },
  'Class 9': { start: 901, end: 910 },
  'Class 10': { start: 101, end: 110 }
}

function usnBlockFor(klass: string, section: 'A' | 'B'): number[] {
  const r = CLASS_USN_RANGES[klass]
  if (!r) return []
  const a = [r.start, r.start + 1, r.start + 2, r.start + 3, r.start + 4]
  const b = [r.start + 5, r.start + 6, r.start + 7, r.start + 8, r.start + 9]
  return section === 'A' ? a : b
}

function generateRoster(klass: string, section: 'A' | 'B'): Student[] {
  const block = usnBlockFor(klass, section)
  return block.map(n => ({ usn: String(n), name: `Student ${n}`, klass, section }))
}

function readStudents(): Student[] {
  try {
    const raw = localStorage.getItem('school:students')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeStudents(students: Student[]) {
  localStorage.setItem('school:students', JSON.stringify(students))
}

export default function TeacherStudents() {
  const [klass, setKlass] = React.useState<string>('')
  const [section, setSection] = React.useState<string>('')
  React.useEffect(() => {
    setSection(prev => {
      const arr = getSectionsForClass(klass)
      return arr.includes(prev) ? prev : (arr[0] || '')
    })
  }, [klass])
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('teacher')
      if (!raw) return
      const t = JSON.parse(raw)
      const classes = getAssignedClassesForTeacher(t.name)
      if (classes.length) {
        setKlass(classes[0])
        const secs = getAssignedSectionsForTeacher(t.name, classes[0])
        setSection(secs[0] || getSectionsForClass(classes[0])[0] || '')
      } else {
        const all = getClasses(); setKlass(all[0] || ''); setSection(getSectionsForClass(all[0] || '')[0] || '')
      }
    } catch {}
  }, [])
  // Fixed 5 per section as per scheme
  const [namesInput, setNamesInput] = React.useState('')
  const [preview, setPreview] = React.useState<Student[]>([])
  const [message, setMessage] = React.useState('')

  React.useEffect(() => { seedIfNeeded() }, [])

  React.useEffect(() => {
    // Default preview for selected class/section
    setPreview(generateRoster(klass, section))
  }, [klass, section])

  const buildFromNames = () => {
    const parts = namesInput
      .split(/\n|,/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 5)
    if (parts.length === 0) {
      setMessage('Enter names (comma or newline separated)')
      setTimeout(() => setMessage(''), 1200)
      return
    }
    const block = usnBlockFor(klass, section)
    const arr: Student[] = block.map((n, idx) => ({ usn: String(n), name: parts[idx] || `Student ${n}`, klass, section }))
    setPreview(arr)
  }

  const save = () => {
    const existing = readStudents()
    const filtered = existing.filter(s => !(s.klass === klass && s.section === section))
    const next = [...filtered, ...preview]
    writeStudents(next)
    setMessage(`Saved ${preview.length} students for ${klass} ${section}`)
    setTimeout(() => setMessage(''), 1500)
  }

  return (
    <div>
      <div className="dash">
        <div className="tabs">
          <Link className={`tab`} href="/teacher/dashboard">Dashboard</Link>
          <Link className={`tab`} href="/teacher/academic-content">Academic Content</Link>
          <Link className={`tab`} href="/teacher/circulars">Circulars</Link>
          <Link className={`tab`} href="/teacher/marks">Marks Entry</Link>
          <span className={`tab tab-active`}>Students</span>
        </div>
      </div>

      <div className="dash">
        <h2 className="title">Students (Bulk Create)</h2>
        <p className="subtitle">Create 30 students with roll numbers for the selected class/section.</p>

        <div className="row">
          <select className="input select" value={klass} onChange={e=> setKlass(e.target.value)}>
            {(typeof window !== 'undefined' ? (() => { try { const raw = sessionStorage.getItem('teacher'); if (raw) { const t = JSON.parse(raw); const arr = getAssignedClassesForTeacher(t.name); return (arr.length ? arr : getClasses()) } } catch {} return getClasses() })() : getClasses()).map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="input select" value={section} onChange={e=> setSection(e.target.value as 'A' | 'B')}>
            {(typeof window !== 'undefined' ? (() => { try { const raw = sessionStorage.getItem('teacher'); if (raw) { const t = JSON.parse(raw); const arr = getAssignedSectionsForTeacher(t.name, klass); return (arr.length ? arr : getSectionsForClass(klass)) } } catch {} return getSectionsForClass(klass) })() : getSectionsForClass(klass)).map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div style={{display:'grid', gap:10, marginTop:10}}>
          <div className="row">
            <button className="btn-ghost" type="button" onClick={()=> setPreview(generateRoster(klass, section))}>Auto-generate names</button>
            <button className="btn-ghost" type="button" onClick={buildFromNames}>Use custom names</button>
          </div>
          <textarea className="paper" placeholder="Optional: enter names (comma or newline separated) to use instead of auto-generated names" value={namesInput} onChange={e=> setNamesInput(e.target.value)} />
        </div>

        <div style={{marginTop:14}}>
          <div className="subtitle" style={{marginBottom:8}}>Preview ({preview.length})</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:8}}>
            {preview.map(s => (
              <div key={s.usn} style={{border:'1px solid var(--panel-border)', borderRadius:10, padding:10, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <span style={{fontWeight:600}}>{s.usn} — {s.name}</span>
                <span style={{opacity:0.7}}>{s.klass} {s.section}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="actions" style={{marginTop:12}}>
          <button className="btn" type="button" onClick={save}>Save Students</button>
          {message && <span className="message" style={{marginLeft:10}}>{message}</span>}
        </div>
      </div>

      <div className="dash" style={{ marginTop: 24 }}>
        <Link className="back" href="/">&larr; Back to login</Link>
      </div>
    </div>
  )
}
