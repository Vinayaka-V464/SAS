"use client"
import React from 'react'
import { getClasses, getSectionsForClass, addCircular, AttachmentLink, AttachmentFile, getAssignedClassesForTeacher, getAssignedSectionsForTeacher } from '../data'

export default function TeacherCirculars() {
  const [teacher, setTeacher] = React.useState<{ name: string; subject: string } | null>(null)
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
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [title, setTitle] = React.useState('')
  const [body, setBody] = React.useState('')
  const [linkInput, setLinkInput] = React.useState('')
  const [attachments, setAttachments] = React.useState<Array<AttachmentLink | AttachmentFile>>([])
  const [message, setMessage] = React.useState('')

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('teacher')
      if (raw) setTeacher(JSON.parse(raw))
    } catch {}
  }, [])

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
    const items: AttachmentFile[] = []
    for (const f of Array.from(files)) {
      if (f.size > maxBytes) { setMessage(`Skipped ${f.name} (>1MB)`); continue }
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader(); r.onerror = () => rej(''); r.onload = () => res(String(r.result)); r.readAsDataURL(f)
      })
      items.push({ type: 'file', name: f.name, mime: f.type || 'application/octet-stream', dataUrl })
    }
    if (items.length) setAttachments(prev => [...items, ...prev])
  }

  const onPublish = () => {
    const t = title.trim()
    const b = body.trim()
    if (!t) { setMessage('Enter title'); setTimeout(()=>setMessage(''), 1200); return }
    if (!b && attachments.length === 0) { setMessage('Enter body or add attachment'); setTimeout(()=>setMessage(''), 1200); return }
    addCircular({ title: t, body: b, date, klass, section: section as any, attachments, createdBy: teacher?.name })
    setMessage('Circular published successfully.')
    setTitle(''); setBody(''); setAttachments([]); setLinkInput('')
    setTimeout(()=>setMessage(''), 1500)
  }

  return (
    <div className="dash">
      <h2 className="title">Circulars</h2>
      <p className="subtitle">Publish circulars to a specific class and section.</p>

      <div style={{display:'grid', gap:12, marginTop:12}}>
        <div className="row">
          <select className="input select" value={klass} onChange={e=>setKlass(e.target.value)}>
            {(typeof window !== 'undefined' ? (() => { try { const raw = sessionStorage.getItem('teacher'); if (raw) { const t = JSON.parse(raw); const arr = getAssignedClassesForTeacher(t.name); return (arr.length ? arr : getClasses()) } } catch {} return getClasses() })() : getClasses()).map(c=> <option key={c}>{c}</option>)}
          </select>
          <select className="input select" value={section} onChange={e=>setSection(e.target.value)}>
            {(typeof window !== 'undefined' ? (() => { try { const raw = sessionStorage.getItem('teacher'); if (raw) { const t = JSON.parse(raw); const arr = getAssignedSectionsForTeacher(t.name, klass); return (arr.length ? arr : getSectionsForClass(klass)) } } catch {} return getSectionsForClass(klass) })() : getSectionsForClass(klass)).map(s=> <option key={s}>{s}</option>)}
          </select>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
        <script dangerouslySetInnerHTML={{__html:''}} />
        <input className="input" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <textarea className="paper" style={{minHeight:140}} placeholder="Circular content" value={body} onChange={e=>setBody(e.target.value)} />
        <div className="row">
          <input className="input" placeholder="https://link.to/resource (optional)" value={linkInput} onChange={e=>setLinkInput(e.target.value)} />
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
                  <span style={{fontWeight:600}}>{a.type === 'link' ? (a as AttachmentLink).url : (a as AttachmentFile).name}</span>
                </div>
                <button className="btn-ghost" type="button" onClick={()=> setAttachments(prev => prev.filter((_,idx)=> idx!==i))}>Remove</button>
              </div>
            ))}
          </div>
        )}
        <div className="actions">
          <button className="btn" type="button" onClick={onPublish}>Publish Circular</button>
        </div>
        {message && <div className="profile-message">{message}</div>}
      </div>
    </div>
  )
}
