"use client"
import React from 'react'
import { findStudent, getSubjects, subjectForHourFor } from '../../teacher/data'
import { subjectColor, type ColorTag } from '../../lib/colors'

type LogEntry = { date: string; hour: number; status: 'Present' | 'Absent' }
type SubjectStats = { total: number; present: number; absent: number; logs: LogEntry[] }

function parseAttendance() {
  const raw = localStorage.getItem('school:attendance')
  return raw ? JSON.parse(raw) : {}
}

function formatDMY(ymd: string) {
  return `${ymd.slice(8,10)}/${ymd.slice(5,7)}/${ymd.slice(0,4)}`
}

// subjectColor ensures new subjects get a new color first

export default function ParentAttendancePage() {
  const [stats, setStats] = React.useState<Record<string, SubjectStats>>(() => ({}))
  const [open, setOpen] = React.useState<Record<string, boolean>>(() => ({}))
  const [subjects, setSubjects] = React.useState<string[]>([])
  const [mounted, setMounted] = React.useState(false)

  const recompute = React.useCallback(() => {
    try {
      const sraw = sessionStorage.getItem('parent')
      if (!sraw) return
      const { roll } = JSON.parse(sraw)
      const me = findStudent(roll)
      if (!me) return
      const store = parseAttendance()
      const init: Record<string, SubjectStats> = {}
      // We'll fill seen subjects from logs; display order comes from settings via getSubjects()

      for (const k of Object.keys(store)) {
        const parts = k.split('|')
        if (parts.length < 4) continue
        const [date, klass, section, hourStr] = parts
        if (klass !== me.klass || section !== me.section) continue
        const hour = Number(hourStr)
        const subj = subjectForHourFor(me.klass, me.section, hour)
        const m = store[k] || {}
        if (!(me.usn in m)) continue
        const isPresent = !!m[me.usn]
        const bucket = (init[subj] ||= { total: 0, present: 0, absent: 0, logs: [] })
        bucket.total += 1
        if (isPresent) bucket.present += 1; else bucket.absent += 1
        bucket.logs.push({ date, hour, status: isPresent ? 'Present' : 'Absent' })
      }

      for (const s of Object.keys(init)) {
        init[s].logs.sort((a,b) => {
          const ak = `${a.date}-${String(a.hour).padStart(2,'0')}`
          const bk = `${b.date}-${String(b.hour).padStart(2,'0')}`
          return bk.localeCompare(ak)
        })
      }
      setStats(init)
    } catch {}
  }, [])

  React.useEffect(() => {
    setMounted(true)
    setSubjects(getSubjects())
    recompute()
    const onStorage = (e: StorageEvent) => { 
      if (e.key === 'school:attendance') recompute()
      if (e.key === 'school:subjects' || e.key === 'school:classSubjects') setSubjects(getSubjects())
    }
    const onBus = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail || {}
        if (!detail || !detail.key) { recompute(); return }
        if (detail.key === 'school:attendance') recompute()
        if (detail.key === 'school:subjects' || detail.key === 'school:classSubjects') setSubjects(getSubjects())
      } catch { recompute() }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('school:update', onBus as EventListener)
    }
  }, [recompute])

  if (!mounted) return null
  return (
    <div className="dash">
      <h2 className="title">Attendance</h2>
      <p className="subtitle">Subject-wise summary with detailed logs for your child.</p>

      <div style={{display:'grid', gap:12, marginTop:12}}>
        {(subjects.length ? subjects : Object.keys(stats)).map((sub) => {
          const s = stats[sub] || { total: 0, present: 0, absent: 0, logs: [] }
          const pct = s.total ? Math.round((s.present * 100) / s.total) : 0
          const opened = !!open[sub]
          const tag = subjectColor(sub as string)
          return (
            <div key={sub} className="subject-card">
              <div className={`subject-header banner-${tag}`} style={{display:'grid', gridTemplateColumns:'2fr repeat(4,1fr)', gap:8, alignItems:'center', padding:'12px 14px', borderBottom: opened ? '1px solid var(--panel-border)' : 'none'}}>
                <div style={{fontWeight:800, fontSize:16}}>{sub}</div>
                <div style={{textAlign:'center'}}>
                  <div className="note">Total</div>
                  <div style={{fontSize:20, fontWeight:800}}>{s.total}</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div className="note">Present</div>
                  <div style={{fontSize:20, fontWeight:800, color:'var(--success)'}}>{s.present}</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div className="note">Absent</div>
                  <div style={{fontSize:20, fontWeight:800, color:'var(--danger)'}}>{s.absent}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(prev => ({ ...prev, [sub]: !opened }))}
                  className="subject-pct"
                  title="Toggle detailed log"
                >
                  <div className="note">Percent</div>
                  <div style={{fontSize:20, fontWeight:800}}>{pct}%</div>
                </button>
              </div>
              {opened && (
                <div className="subject-log">
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, padding:'8px 10px', border:'1px solid var(--panel-border)', borderRadius:8, background:'var(--panel-soft)'}}>
                    <strong>Date</strong>
                    <strong>Period</strong>
                    <strong>Status</strong>
                  </div>
                  <div style={{display:'grid', gap:6, marginTop:8}}>
                    {s.logs.length === 0 && (
                      <div className="note">No classes recorded for this subject yet.</div>
                    )}
                    {s.logs.map((entry, idx) => (
                      <div key={`${entry.date}-${entry.hour}-${idx}`} style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, alignItems:'center', border:'1px solid var(--panel-border)', borderRadius:8, padding:'8px 10px'}}>
                        <span>{formatDMY(entry.date)}</span>
                        <span>Hour {entry.hour}</span>
                        <span style={{fontWeight:700, color: entry.status === 'Present' ? 'var(--success)' : 'var(--danger)'}}>{entry.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
