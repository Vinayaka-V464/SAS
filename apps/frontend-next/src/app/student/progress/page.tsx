"use client"
import React from 'react'
import { findStudent, readMarksByStudent, getSubjects, readTestRank, readTotalsByTest, getClassSubjects } from '../../teacher/data'
import { subjectColor, type ColorTag } from '../../lib/colors'

export default function ProgressPage() {
  const [rows, setRows] = React.useState<Array<{ test: string; subject: string; score: number; max: number; ts?: number; date?: string }>>([])

  const [meInfo, setMeInfo] = React.useState<{ usn: string; klass: string; section: 'A'|'B' } | null>(null)
  const [openRanks, setOpenRanks] = React.useState<string | null>(null)

  const recompute = React.useCallback(() => {
    try {
      const sraw = sessionStorage.getItem('student')
      if (!sraw) return
      const { roll } = JSON.parse(sraw)
      const me = findStudent(roll)
      if (!me) return
      setMeInfo({ usn: me.usn, klass: me.klass, section: me.section })
      const arr = readMarksByStudent(me.usn)
      setRows(arr.map(r => ({ test: r.test, subject: r.subject, score: r.score, max: r.max, ts: r.ts, date: r.date })))
    } catch {}
  }, [])

  React.useEffect(() => {
    recompute()
    const onStorage = (e: StorageEvent) => { if (e.key === 'school:marks') recompute() }
    const onBus = (e: Event) => {
      try { const detail = (e as CustomEvent).detail; if (!detail || !detail.key || detail.key === 'school:marks') recompute() } catch { recompute() }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('school:update', onBus as EventListener)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('school:update', onBus as EventListener)
    }
  }, [recompute])

  // Group by test to render marks cards
  const byTest = React.useMemo(() => {
    const m: Record<string, { items: Array<{ subject: string; score: number; max: number }>; date?: string; ts?: number; sum: number; total: number; pct: number } > = {}
    for (const r of rows) {
      if (!m[r.test]) m[r.test] = { items: [], date: r.date, ts: r.ts, sum: 0, total: 0, pct: 0 }
      m[r.test].items.push({ subject: r.subject, score: r.score, max: r.max })
      m[r.test].sum += r.score
      m[r.test].total += r.max
      if (!m[r.test].date && r.date) m[r.test].date = r.date
      if (!m[r.test].ts && r.ts) m[r.test].ts = r.ts
    }
    for (const k of Object.keys(m)) {
      m[k].pct = m[k].total ? Math.round((m[k].sum * 100) / m[k].total) : 0
      // Order subjects alphabetically to stay dynamic
      m[k].items.sort((a,b) => a.subject.localeCompare(b.subject))
    }
    // Sort tests newest first
    return Object.entries(m).sort((a,b) => (b[1].ts || 0) - (a[1].ts || 0))
  }, [rows])

  const BANNER_COLORS = ['blue','green','orange','pink','violet'] as const
  function colorForTest(name: string, idx: number) {
    const n = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (n.startsWith('ut 1')) return 'blue'
    if (n.startsWith('ut 2')) return 'green'
    if (n.startsWith('ut 3')) return 'orange'
    if (n.startsWith('ut 4')) return 'pink'
    if (n.includes('mid')) return 'violet'
    if (n.endsWith('sem')) return 'violet'
    // fallback: deterministic hash
    return BANNER_COLORS[(idx + Array.from(name||'').reduce((s,c)=>s+c.charCodeAt(0),0)) % BANNER_COLORS.length]
  }

  const gradeFor = (pct: number) => pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 55 ? 'C' : pct >= 40 ? 'D' : 'F'

  const onPrint = (cardId: string) => {
    try {
      const el = document.getElementById(cardId)
      if (!el) return
      el.classList.add('print-area')
      window.print()
      setTimeout(() => el.classList.remove('print-area'), 0)
    } catch {}
  }

  // Summary across all tests
  const overall = React.useMemo(() => {
    let sum = 0, total = 0
    const tests = new Set<string>()
    for (const r of rows) { sum += r.score; total += r.max; tests.add(r.test) }
    const pct = total ? Math.round((sum * 100) / total) : 0
    return { sum, total, pct, tests: tests.size }
  }, [rows])

  // Subject-wise averages for snapshot
  const subjectAvgs = React.useMemo(() => {
    const acc: Record<string, { sum: number; total: number }> = {}
    const subs = meInfo ? getClassSubjects(meInfo.klass, meInfo.section) : getSubjects()
    for (const r of rows) {
      if (!acc[r.subject]) acc[r.subject] = { sum: 0, total: 0 }
      acc[r.subject].sum += r.score
      acc[r.subject].total += r.max
    }
    const order = (subs && subs.length ? subs : Object.keys(acc).sort((a,b)=>a.localeCompare(b)))
    return order.map(sub => {
      const { sum, total } = acc[sub] || { sum: 0, total: 0 }
      const pct = total ? Math.round((sum * 100) / total) : 0
      return { subject: sub, pct }
    })
  }, [rows])

  function DonutChart({ data }: { data: Array<{ subject: string; pct: number }> }) {
    const colorHex: Record<ColorTag,string> = { blue:'#3b82f6', green:'#10b981', orange:'#f59e0b', pink:'#ec4899', violet:'#8b5cf6' }
    const values = data.map(d => Math.max(0, d.pct))
    const total = values.reduce((s, v) => s + v, 0) || 1
    const r = 36
    const c = 2 * Math.PI * r
    let offset = 0
    return (
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Performance distribution">
        <g transform="translate(60,60)">
          <circle r={r} cx={0} cy={0} fill="none" stroke="#e5e7eb" strokeWidth={12} />
          {data.map((d, i) => {
            const frac = (values[i] / total)
            const len = c * frac
            const dash = `${len} ${c - len}`
            const el = (
              <circle key={i}
                      r={r}
                      cx={0}
                      cy={0}
                      fill="none"
              stroke={colorHex[subjectColor(d.subject)] || '#999'}
                      strokeWidth={12}
                      strokeDasharray={dash}
                      strokeDashoffset={-offset}
                      transform="rotate(-90)" />
            )
            offset += len
            return el
          })}
          <text x="0" y="5" textAnchor="middle" fontWeight={800} fontSize="14">{overall.pct}%</text>
        </g>
      </svg>
    )
  }

  return (
    <div className="dash">
      <h2 className="title">Progress Report</h2>
      <p className="subtitle">Structured marks cards by test</p>

      <div style={{display:'grid', gap:12, marginTop:12}}>
        <div className="marks-card">
          <div className="marks-header banner-violet" style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:'1px solid var(--panel-border)'}}>
            <div style={{fontWeight:800}}>Overall Summary</div>
            <div style={{display:'flex', gap:12, alignItems:'center'}}>
              <div><strong>{overall.tests}</strong> tests</div>
              <div><strong>{overall.sum}</strong> / {overall.total}</div>
              <div style={{fontWeight:800, fontSize:18}}>{overall.pct}%</div>
            </div>
          </div>
          <div className="stats-wrap">
            <div className="donut">
              <DonutChart data={subjectAvgs} />
            </div>
            <div className="legend">
              {subjectAvgs.map((s, i) => {
                const tag = subjectColor(s.subject)
                const verdict = s.pct >= 70 ? 'Good' : s.pct >= 50 ? 'Average' : 'Needs Attention'
                return (
                  <div key={i} className="legend-row">
                    <span className={`legend-dot dot-${tag}`} />
                    <span className="legend-label">{s.subject}</span>
                    <span className="legend-pct">{s.pct}%</span>
                    <span className="legend-verdict">{verdict}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        {byTest.length === 0 && <div className="note">No marks recorded yet.</div>}
        {byTest.map(([testName, data], idx) => {
          const color = colorForTest(testName, idx)
          const overallGrade = gradeFor(data.pct)
          const cardId = `marks-card-${idx}`
          const rankInfo = meInfo ? readTestRank(meInfo.klass, meInfo.section, testName, meInfo.usn) : { rank: null, of: 0, sum: 0, total: 0, pct: 0 }
          return (
            <div key={testName} id={cardId} className="marks-card">
              <div className={`marks-header banner-${color}`} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:'1px solid var(--panel-border)'}}>
                <div style={{display:'flex', flexDirection:'column'}}>
                  <div style={{fontWeight:800}}>{testName}</div>
                  <small>{data.date ? data.date : ''}</small>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <button className="chip-rank as-button" type="button" onClick={() => setOpenRanks(prev => prev === testName ? null : testName)} title={rankInfo.rank ? `Rank ${rankInfo.rank}/${rankInfo.of}` : 'View class ranking'}>
                    {rankInfo.rank ? `Rank ${rankInfo.rank}/${rankInfo.of || 0}` : 'Rank -'}
                  </button>
                  <span className="chip-grade">{overallGrade}</span>
                  <div style={{fontWeight:800, fontSize:20}}>{data.pct}%</div>
                  <button className="btn-tiny" type="button" onClick={() => onPrint(cardId)} title="Download PDF via Print">Print / PDF</button>
                </div>
              </div>
              {openRanks === testName && meInfo && (
                <RankList klass={meInfo.klass} section={meInfo.section} test={testName} meUsn={meInfo.usn} />
              )}
              <div className="marks-table">
                <div className="marks-head">
                  <strong>Subject</strong>
                  <strong>Marks</strong>
                  <strong>Percent</strong>
                </div>
                <div className="marks-body">
                  {data.items.map((it, i2) => (
                    <div key={i2} className="marks-row">
                      <span>{it.subject}</span>
                      <span style={{textAlign:'center', fontWeight:700}}>{it.score} / {it.max}</span>
                      {(() => { const pct = it.max ? Math.round((it.score*100)/it.max) : 0; const g = gradeFor(pct); return (
                        <span style={{textAlign:'right', fontWeight:800}}>{pct}% <span className="chip-grade" style={{marginLeft:6}}>{g}</span></span>
                      )})()}
                    </div>
                  ))}
                </div>
                <div className="marks-foot">
                  <strong>Total</strong>
                  <strong style={{textAlign:'center'}}>{data.sum} / {data.total}</strong>
                  <strong style={{textAlign:'right'}}>{data.pct}%</strong>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RankList({ klass, section, test, meUsn }: { klass: string; section: 'A'|'B'; test: string; meUsn: string }) {
  const totals = readTotalsByTest(klass, section, test)
  const top = totals.slice(0, Math.max(3, totals.length))
  const medal = (i: number) => (i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : null)
  return (
    <div className="rank-wrap">
      <div className="rank-head">
        <strong>Rank</strong>
        <strong>Student</strong>
        <strong>Marks</strong>
        <strong>Percent</strong>
      </div>
      <div className="rank-body">
        {top.map((t, idx) => {
          const m = medal(idx)
          return (
            <div key={t.usn} className={`rank-row ${m ? `rank-${m}` : ''} ${t.usn === meUsn ? 'rank-me' : ''}`}>
              <span>{idx + 1}</span>
              <span>{t.usn} — {findStudent(t.usn)?.name || 'Student'}</span>
              <span style={{textAlign:'center'}}>{t.sum} / {t.total}</span>
              <span style={{textAlign:'right', fontWeight:800}}>{t.pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
