import { NextResponse } from 'next/server'
import { readDB } from '../../../_lib/filedb'

type Target =
  | { type: 'student'; studentName?: string; parentPhone?: string }
  | { type: 'class'; grade: string }
  | { type: 'section'; grade: string; section: string }
  | { type: 'classes'; grades: string[] }

export async function POST(req: Request) {
  const { target } = await req.json().catch(() => ({})) as { target?: Target }
  if (!target || !target.type) return NextResponse.json({ items: [] })
  const db = readDB()
  // Candidates: applications with any status (optionally restrict)
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

  const items = apps.filter(matches).map((a) => ({
    appId: a.id,
    name: toName(a),
    grade: String(a?.data?.admission?.grade || ''),
    section: String(a?.data?.admission?.section || ''),
    parentPhone: a.parentPhone || '',
  }))

  return NextResponse.json({ items, count: items.length })
}

