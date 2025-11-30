import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../../_lib/filedb'

type Target =
  | { type: 'student'; studentName?: string; parentPhone?: string }
  | { type: 'class'; grade: string }
  | { type: 'section'; grade: string; section: string }
  | { type: 'classes'; grades: string[] }

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const db = readDB()
  const adhoc = (db.adhocFees || []).find(a => a.id === params.id)
  if (!adhoc) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const target = adhoc.target as Target | undefined
  if (!target || !target.type) return NextResponse.json({ error: 'no_target' }, { status: 400 })

  const apps = db.applications
  const toName = (a: any) => `${a?.data?.student?.firstName || ''} ${a?.data?.student?.lastName || ''}`.trim()

  const matches = (a: any): boolean => {
    const grade = String(a?.data?.admission?.grade || '')
    const section = String(a?.data?.admission?.section || '')
    if (target.type === 'student') {
      const n = toName(a).toLowerCase()
      const want = (target.studentName || '').toLowerCase()
      const phoneOk = target.parentPhone ? String(a?.parentPhone || '').includes(String(target.parentPhone)) : true
      return (want ? n.includes(want) : true) && phoneOk
    }
    if (target.type === 'class') return grade === String((target as any).grade || '')
    if (target.type === 'section') return grade === String((target as any).grade || '') && section === String((target as any).section || '')
    if (target.type === 'classes') return Array.isArray((target as any).grades) && (target as any).grades.map(String).includes(grade)
    return false
  }

  const recipients = apps.filter(matches).map((a) => ({ appId: a.id, parentPhone: a.parentPhone || '', name: toName(a) }))
  db.adhocBills = Array.isArray(db.adhocBills) ? db.adhocBills : []
  const ts = new Date().toISOString()
  for (const r of recipients) {
    const bill = { id: `adhoc_bill_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`, adhocId: adhoc.id, appId: r.appId, parentPhone: r.parentPhone, name: r.name, title: adhoc.title, items: adhoc.items, total: adhoc.total, createdAt: ts, status: 'unpaid' as const }
    db.adhocBills.push(bill)
  }
  writeDB(db)
  return NextResponse.json({ ok: true, delivered: recipients.length })
}
