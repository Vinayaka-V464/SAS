"use client"
import React from 'react'
import { findStudent, getClassSubjects, readSyllabus, listMaterials, listPyqs, listTextbooks } from '../../teacher/data'
import { subjectColor, type ColorTag } from '../../lib/colors'

export default function SyllabusPage() {
  const [me, setMe] = React.useState<{ klass: string; section: string; usn: string } | null>(null)
  const [subjects, setSubjects] = React.useState<string[]>([])

  React.useEffect(() => {
    try { const raw = sessionStorage.getItem('student'); if (raw) {
      const { roll } = JSON.parse(raw); const s = findStudent(roll); if (s) { setMe({ klass: s.klass, section: s.section as any, usn: s.usn }); setSubjects(getClassSubjects(s.klass, s.section)) }
    } } catch {}
  }, [])

  React.useEffect(() => {
    const recompute = () => {
      try { const raw = sessionStorage.getItem('student'); if (!raw) return; const { roll } = JSON.parse(raw); const s = findStudent(roll); if (s) setSubjects(getClassSubjects(s.klass, s.section)) } catch {}
    }
    const onBus = (e: Event) => {
      try { const k = (e as CustomEvent).detail?.key; if (!k || k === 'school:classSubjects' || k === 'school:syllabus' || k === 'school:textbooks' || k === 'school:materials' || k === 'school:pyqs') recompute() } catch { recompute() }
    }
    window.addEventListener('school:update', onBus as EventListener)
    return () => window.removeEventListener('school:update', onBus as EventListener)
  }, [])

  const [open, setOpen] = React.useState<string | null>(null)
  const [zoom, setZoom] = React.useState<Record<string, number>>({})

  const toggle = (sub: string) => setOpen(prev => prev === sub ? null : sub)
  const z = (sub: string) => zoom[sub] || 1
  const setZ = (sub: string, v: number) => setZoom(prev => ({ ...prev, [sub]: Math.max(0.6, Math.min(2, v)) }))

  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>({})
  const toggleChapter = (id: string) => setOpenMap(prev => {
    const next: Record<string, boolean> = {}
    // Collapse others, toggle selected
    next[id] = !prev[id]
    return next
  })
  const isOpen = (id: string) => !!openMap[id]

  // Click-away to collapse subject panel
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      // If click is outside any subject-card, collapse
      if (!el.closest('.subject-card')) setOpen(null)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [])

  // Section toggles per subject (syllabus, textbook, materials, pyqs)
  const [secOpen, setSecOpen] = React.useState<Record<string, boolean>>({})
  const keyFor = (s: string, k: 'syllabus'|'textbook'|'materials'|'pyqs') => `${s}:${k}`
  const isSecOpen = (s: string, k: 'syllabus'|'textbook'|'materials'|'pyqs') => !!secOpen[keyFor(s,k)]
  const toggleSec = (s: string, k: 'syllabus'|'textbook'|'materials'|'pyqs') => setSecOpen(prev => ({ ...prev, [keyFor(s,k)]: !prev[keyFor(s,k)] }))

  const [viewer, setViewer] = React.useState<{ url: string; name: string } | null>(null)

  return (
    <div className="dash">
      <h2 className="title">Academic Syllabus</h2>
      <p className="subtitle">Subject-wise syllabus, e-textbook, notes/materials, and PYQs.</p>

      <div style={{display:'grid', gap:12, marginTop:12}}>
        {subjects.map((s) => {
          const syl = me ? readSyllabus(me.klass, me.section, s) : { chapters: [] }
          const books = me ? listTextbooks(me.klass, me.section, s) : []
          const mats = me ? listMaterials(me.klass, me.section, s) : []
          const pyqs = me ? listPyqs(me.klass, me.section, s) : []
          const opened = open === s
          const color: ColorTag = subjectColor(s)
          return (
            <div key={s} className="subject-card">
              <div className={`subject-header banner-${color}`} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', cursor:'pointer'}} onClick={()=>toggle(s)}>
                <div style={{fontWeight:800}}>{s}</div>
                <span className="chip-pill">{opened ? 'Tap to hide' : 'Tap to view'}</span>
              </div>
              {opened && (
                <div className="subject-log">
                  <div className="chart-card" style={{marginBottom:12}}>
                    <div className="chart-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span>Syllabus</span>
                      <button className="btn-ghost" onClick={()=> toggleSec(s,'syllabus')}>{isSecOpen(s,'syllabus') ? 'Hide' : 'View'}</button>
                    </div>
                    {!isSecOpen(s,'syllabus') && <div className="note">Tap View to expand syllabus.</div>}
                    {isSecOpen(s,'syllabus') && (
                      <>
                        {syl.chapters.length === 0 && <div className="note">Syllabus not published yet.</div>}
                        {syl.chapters.map((ch, idx) => {
                      const chBooks = books.filter(b => (b as any).chapterId === ch.id)
                      const [openChapters, setOpenChapters] = [openMap, setOpenMap]
                      return (
                      <div key={ch.id} style={{border:'1px solid var(--panel-border)', borderRadius:10, padding:10, marginTop:8}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer'}} onClick={()=> toggleChapter(ch.id)}>
                          <div style={{fontWeight:800}}>{idx+1}. {ch.title}</div>
                          <span className="chip-pill">{isOpen(ch.id) ? 'Hide' : 'View'}</span>
                        </div>
                        {isOpen(ch.id) && chBooks.length > 0 && (
                          <div style={{marginTop:8, display:'grid', gap:6}}>
                            {chBooks.map((b, j) => (
                              <div key={`${b.name}-${j}`} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px dashed var(--panel-border)', borderRadius:8, padding:'6px 10px'}}>
                                <div style={{fontWeight:700, overflow:'hidden', textOverflow:'ellipsis'}} title={b.name}>{b.name}</div>
                                <div className="row" style={{gap:8, margin:0}}>
                                  <button className="btn-ghost" onClick={()=> setViewer({ url: b.dataUrl, name: b.name })}>View</button>
                                  <a className="btn-ghost" href={b.dataUrl} download>Download</a>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{display:'grid', gap:6, marginTop:6}}>
                          {ch.subtopics.map((t, i) => (
                            <div key={t.id} style={{border:'1px dashed var(--panel-border)', borderRadius:8, padding:'6px 8px'}}>
                              <div style={{fontWeight:700}}>{idx+1}.{i+1} {t.title}</div>
                              {t.details && <div className="note">{t.details}</div>}
                            </div>
                          ))}
                          {ch.subtopics.length === 0 && <div className="note">No subtopics yet.</div>}
                        </div>
                      </div>
                    )})}
                      </>
                    )}
                  </div>

                  <div className="chart-card" style={{marginBottom:12}}>
                    <div className="chart-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span>E-Textbook</span>
                      <button className="btn-ghost" onClick={()=> toggleSec(s,'textbook')}>{isSecOpen(s,'textbook') ? 'Hide' : 'View'}</button>
                    </div>
                    {isSecOpen(s,'textbook') && (
                      <>
                        {books.filter(b => !(b as any).chapterId).length === 0 && <div className="note">No textbooks uploaded yet.</div>}
                        <div style={{display:'grid', gap:6}}>
                          {books.filter(b => !(b as any).chapterId).map((b, i) => (
                            <div key={`${b.name}-${i}`} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px dashed var(--panel-border)', borderRadius:8, padding:'6px 10px'}}>
                              <div style={{fontWeight:700, overflow:'hidden', textOverflow:'ellipsis'}} title={b.name}>{b.name}</div>
                              <div className="row" style={{gap:8, margin:0}}>
                                <button className="btn-ghost" onClick={()=> setViewer({ url: b.dataUrl, name: b.name })}>View</button>
                                <a className="btn-ghost" href={b.dataUrl} download>Download</a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="chart-card" style={{marginBottom:12}}>
                    <div className="chart-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span>Notes & Materials</span>
                      <button className="btn-ghost" onClick={()=> toggleSec(s,'materials')}>{isSecOpen(s,'materials') ? 'Hide' : 'View'}</button>
                    </div>
                    {!isSecOpen(s,'materials') && <div className="note">Tap View to see materials.</div>}
                    {isSecOpen(s,'materials') && (
                      <>
                        {mats.length === 0 && <div className="note">No materials yet.</div>}
                        <div style={{display:'grid', gap:6}}>
                          {mats.map((m, i) => {
                            const name = m.type === 'file' ? (m as any).name : (m as any).url
                            const url = m.type === 'file' ? (m as any).dataUrl : (m as any).url
                            return (
                              <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px dashed var(--panel-border)', borderRadius:8, padding:'6px 10px'}}>
                                <div style={{fontWeight:700, overflow:'hidden', textOverflow:'ellipsis'}} title={name}>{name}</div>
                                <div className="row" style={{gap:8, margin:0}}>
                                  <button className="btn-ghost" onClick={()=> setViewer({ url, name })}>View</button>
                                  <a className="btn-ghost" href={url} download>Download</a>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="chart-card">
                    <div className="chart-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span>Previous Year Question Papers</span>
                      <button className="btn-ghost" onClick={()=> toggleSec(s,'pyqs')}>{isSecOpen(s,'pyqs') ? 'Hide' : 'View'}</button>
                    </div>
                    {!isSecOpen(s,'pyqs') && <div className="note">Tap View to see PYQs.</div>}
                    {isSecOpen(s,'pyqs') && (
                      <>
                        {pyqs.length === 0 && <div className="note">No question papers yet.</div>}
                        <div style={{display:'grid', gap:6}}>
                          {pyqs.map((m, i) => {
                            const name = m.type === 'file' ? (m as any).name : (m as any).url
                            const url = m.type === 'file' ? (m as any).dataUrl : (m as any).url
                            return (
                              <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px dashed var(--panel-border)', borderRadius:8, padding:'6px 10px'}}>
                                <div style={{fontWeight:700, overflow:'hidden', textOverflow:'ellipsis'}} title={name}>{name}</div>
                                <div className="row" style={{gap:8, margin:0}}>
                                  <button className="btn-ghost" onClick={()=> setViewer({ url, name })}>View</button>
                                  <a className="btn-ghost" href={url} download>Download</a>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {viewer && (
        <div role="dialog" aria-label="Document viewer" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'grid', placeItems:'center'}} onClick={()=>setViewer(null)}>
          <div style={{width:'min(960px, 96vw)', height:'80vh', background:'var(--panel)', border:'1px solid var(--panel-border)', borderRadius:12, overflow:'hidden'}} onClick={e=> e.stopPropagation()}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderBottom:'1px solid var(--panel-border)'}}>
              <div style={{fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{viewer.name}</div>
              <div className="row" style={{gap:8, margin:0}}>
                <a className="btn-ghost" href={viewer.url} target="_blank" rel="noopener noreferrer">Open</a>
                <a className="btn-ghost" href={viewer.url} download>Download</a>
                <button className="btn-ghost" onClick={()=>setViewer(null)}>Close</button>
              </div>
            </div>
            <div style={{height:'calc(100% - 44px)', background:'#fff'}}>
              <object data={viewer.url} type="application/pdf" width="100%" height="100%">
                <iframe src={viewer.url} title="Document" style={{width:'100%', height:'100%', border:0}} />
              </object>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
