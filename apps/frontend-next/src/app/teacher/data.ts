export type Teacher = { name: string; subject: string }
export type Student = { usn: string; name: string; klass: string; section: string }
export type EventColor = 'blue' | 'green' | 'orange' | 'pink' | 'violet' | 'red' | 'teal'
export type CalendarEvent = {
  date: string // YYYY-MM-DD
  title: string
  tag: string
  color: EventColor
  description: string
  createdBy: string // teacher name
}

export const CLASSES = ['Class 8', 'Class 9', 'Class 10'] as const
export const SECTIONS = ['A', 'B'] as const
export const HOURS = [1, 2, 3, 4, 5] as const
export const SUBJECTS = ['Kannada', 'English', 'Chemistry', 'Physics', 'Mathematics'] as const

export function getClasses(): string[] {
  try {
    const raw = localStorage.getItem('school:classes')
    if (raw !== null) {
      const arr = JSON.parse(raw)
      return Array.isArray(arr) ? arr : []
    }
    return []
  } catch { return [] }
}

export function getSections(): string[] {
  // Union of all sections across classes; can be empty
  try {
    const rawMap = localStorage.getItem('school:classSections')
    if (rawMap !== null) {
      const map = JSON.parse(rawMap) as Record<string, string[]>
      const set = new Set<string>()
      Object.values(map || {}).forEach(arr => Array.isArray(arr) && arr.forEach(s => set.add(s)))
      return Array.from(set)
    }
  } catch {}
  try {
    const raw = localStorage.getItem('school:sections')
    if (raw !== null) {
      const arr = JSON.parse(raw)
      return Array.isArray(arr) ? arr : []
    }
    return []
  } catch { return [] }
}

export function getSectionsForClass(klass: string): string[] {
  try {
    const rawMap = localStorage.getItem('school:classSections')
    const map = rawMap ? (JSON.parse(rawMap) as Record<string, string[]>) : {}
    const arr = map[klass]
    if (Array.isArray(arr) && arr.length) return arr
  } catch {}
  return getSections()
}

export function getSubjects(): string[] {
  // Return only legacy global subjects. Class/section-scoped subjects are handled via getClassSubjects().
  try {
    const raw = localStorage.getItem('school:subjects')
    if (raw !== null) {
      const arr = JSON.parse(raw)
      return Array.isArray(arr) ? arr : []
    }
    return []
  } catch { return [] }
}

export type Subject = typeof SUBJECTS[number]

export function subjectForHour(hour: number): string {
  const subs = getSubjects()
  if (Array.isArray(subs) && subs.length > 0) {
    const idx = Math.max(0, (Number(hour) - 1) % subs.length)
    return subs[idx]
  }
  return `Hour ${Number(hour) || 0}`
}

export function subjectForHourFor(klass: string, section: string, hour: number): string {
  const subs = getClassSubjects(klass, section)
  const list = (subs && subs.length) ? subs : getSubjects()
  if (Array.isArray(list) && list.length > 0) {
    const idx = Math.max(0, (Number(hour) - 1) % list.length)
    return list[idx]
  }
  return `Hour ${Number(hour) || 0}`
}

export const TEACHERS: Teacher[] = [
  { name: 'Mr. Ramesh', subject: 'Kannada' },
  { name: 'Ms. Priya N', subject: 'English' },
  { name: 'Dr. Meera', subject: 'Chemistry' },
  { name: 'Mr. Arjun', subject: 'Physics' },
  { name: 'Mrs. Ananya', subject: 'Mathematics' }
]

// Hard-coded 30 students (editable):
// Class 8 → 801–810 | A: 801–805, B: 806–810
// Class 9 → 901–910 | A: 901–905, B: 906–910
// Class 10 → 101–110 | A: 101–105, B: 106–110
export const STUDENTS: Student[] = [
  // Class 8 — Section A
  { usn: '801', name: 'Student 801', klass: 'Class 8', section: 'A' },
  { usn: '802', name: 'Student 802', klass: 'Class 8', section: 'A' },
  { usn: '803', name: 'Student 803', klass: 'Class 8', section: 'A' },
  { usn: '804', name: 'Student 804', klass: 'Class 8', section: 'A' },
  { usn: '805', name: 'Student 805', klass: 'Class 8', section: 'A' },
  // Class 8 — Section B
  { usn: '806', name: 'Student 806', klass: 'Class 8', section: 'B' },
  { usn: '807', name: 'Student 807', klass: 'Class 8', section: 'B' },
  { usn: '808', name: 'Student 808', klass: 'Class 8', section: 'B' },
  { usn: '809', name: 'Student 809', klass: 'Class 8', section: 'B' },
  { usn: '810', name: 'Student 810', klass: 'Class 8', section: 'B' },

  // Class 9 — Section A
  { usn: '901', name: 'Student 901', klass: 'Class 9', section: 'A' },
  { usn: '902', name: 'Student 902', klass: 'Class 9', section: 'A' },
  { usn: '903', name: 'Student 903', klass: 'Class 9', section: 'A' },
  { usn: '904', name: 'Student 904', klass: 'Class 9', section: 'A' },
  { usn: '905', name: 'Student 905', klass: 'Class 9', section: 'A' },
  // Class 9 — Section B
  { usn: '906', name: 'Student 906', klass: 'Class 9', section: 'B' },
  { usn: '907', name: 'Student 907', klass: 'Class 9', section: 'B' },
  { usn: '908', name: 'Student 908', klass: 'Class 9', section: 'B' },
  { usn: '909', name: 'Student 909', klass: 'Class 9', section: 'B' },
  { usn: '910', name: 'Student 910', klass: 'Class 9', section: 'B' },

  // Class 10 — Section A
  { usn: '101', name: 'Student 101', klass: 'Class 10', section: 'A' },
  { usn: '102', name: 'Student 102', klass: 'Class 10', section: 'A' },
  { usn: '103', name: 'Student 103', klass: 'Class 10', section: 'A' },
  { usn: '104', name: 'Student 104', klass: 'Class 10', section: 'A' },
  { usn: '105', name: 'Student 105', klass: 'Class 10', section: 'A' },
  // Class 10 — Section B
  { usn: '106', name: 'Student 106', klass: 'Class 10', section: 'B' },
  { usn: '107', name: 'Student 107', klass: 'Class 10', section: 'B' },
  { usn: '108', name: 'Student 108', klass: 'Class 10', section: 'B' },
  { usn: '109', name: 'Student 109', klass: 'Class 10', section: 'B' },
  { usn: '110', name: 'Student 110', klass: 'Class 10', section: 'B' }
]

export function seedIfNeeded() {
  const versionKey = 'school:seed:version'
  const desired = 'v4-empty-initial'
  const current = localStorage.getItem(versionKey)
  if (current !== desired) {
    if (localStorage.getItem('school:teachers') === null) localStorage.setItem('school:teachers', JSON.stringify([]))
    if (localStorage.getItem('school:students') === null) localStorage.setItem('school:students', JSON.stringify([]))
    if (localStorage.getItem('school:classes') === null) localStorage.setItem('school:classes', JSON.stringify([]))
    if (localStorage.getItem('school:sections') === null) localStorage.setItem('school:sections', JSON.stringify([]))
    if (localStorage.getItem('school:subjects') === null) localStorage.setItem('school:subjects', JSON.stringify([]))
    if (localStorage.getItem('school:classSections') === null) localStorage.setItem('school:classSections', JSON.stringify({}))
    if (localStorage.getItem('school:attendance') === null) localStorage.setItem('school:attendance', JSON.stringify({}))
    if (localStorage.getItem('school:diary') === null) localStorage.setItem('school:diary', JSON.stringify({}))
    if (localStorage.getItem('school:calendar') === null) localStorage.setItem('school:calendar', JSON.stringify({}))
    if (localStorage.getItem('school:classHours') === null) localStorage.setItem('school:classHours', JSON.stringify({}))
    if (localStorage.getItem('school:classSubjects') === null) localStorage.setItem('school:classSubjects', JSON.stringify({}))
    if (localStorage.getItem('school:circulars') === null) localStorage.setItem('school:circulars', JSON.stringify([]))
    if (localStorage.getItem('school:marks') === null) localStorage.setItem('school:marks', JSON.stringify([]))
    localStorage.setItem(versionKey, desired)
    return
  }
  if (!localStorage.getItem('school:teachers')) localStorage.setItem('school:teachers', JSON.stringify([]))
  if (!localStorage.getItem('school:students')) localStorage.setItem('school:students', JSON.stringify([]))
  if (!localStorage.getItem('school:classes')) localStorage.setItem('school:classes', JSON.stringify([]))
  if (!localStorage.getItem('school:sections')) localStorage.setItem('school:sections', JSON.stringify([]))
  if (!localStorage.getItem('school:subjects')) localStorage.setItem('school:subjects', JSON.stringify([]))
  if (!localStorage.getItem('school:classSections')) localStorage.setItem('school:classSections', JSON.stringify({}))
  if (!localStorage.getItem('school:attendance')) {
    localStorage.setItem('school:attendance', JSON.stringify({}))
  }
  if (!localStorage.getItem('school:diary')) {
    localStorage.setItem('school:diary', JSON.stringify({}))
  }
  if (!localStorage.getItem('school:calendar')) {
    localStorage.setItem('school:calendar', JSON.stringify({}))
  }
  if (!localStorage.getItem('school:classHours')) localStorage.setItem('school:classHours', JSON.stringify({}))
  if (!localStorage.getItem('school:classSubjects')) localStorage.setItem('school:classSubjects', JSON.stringify({}))
  if (!localStorage.getItem('school:circulars')) localStorage.setItem('school:circulars', JSON.stringify([]))
  if (!localStorage.getItem('school:marks')) localStorage.setItem('school:marks', JSON.stringify([]))
}

// ---- Class hours (per class) ----
export function getHoursForClass(klass: string): number {
  try {
    const raw = localStorage.getItem('school:classHours')
    const map = raw ? JSON.parse(raw) as Record<string, number> : {}
    const n = map?.[klass]
    const v = Number(n)
    if (!Number.isFinite(v) || v < 1) return HOURS.length
    return Math.min(12, Math.max(1, Math.floor(v)))
  } catch { return HOURS.length }
}

export function setHoursForClass(klass: string, count: number) {
  const v = Math.min(12, Math.max(1, Math.floor(Number(count))))
  try {
    const raw = localStorage.getItem('school:classHours')
    const map = raw ? JSON.parse(raw) as Record<string, number> : {}
    map[klass] = v
    localStorage.setItem('school:classHours', JSON.stringify(map))
  } catch {}
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classHours' } })) } catch {}
}

export function hourOptionsForClass(klass: string): number[] {
  const n = getHoursForClass(klass)
  return Array.from({ length: n }, (_, i) => i + 1)
}

// Admin/HOD management helpers
export function getClassSubjects(klass: string, section: string): string[] {
  try {
    const raw = localStorage.getItem('school:classSubjects')
    const map = raw ? JSON.parse(raw) as Record<string, string[]> : {}
    const key = `${klass}|${section}`
    const arr = map[key]
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function addSubjectToClassSection(klass: string, section: string, name: string) {
  const key = `${klass}|${section}`
  try {
    const raw = localStorage.getItem('school:classSubjects')
    const map = raw ? JSON.parse(raw) as Record<string, string[]> : {}
    const arr = Array.isArray(map[key]) ? map[key] : []
    if (!arr.find(s => s.toLowerCase() === name.toLowerCase())) arr.push(name)
    map[key] = arr
    localStorage.setItem('school:classSubjects', JSON.stringify(map))
  } catch {}
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classSubjects' } })) } catch {}
}

export function removeSubjectFromClassSection(klass: string, section: string, name: string) {
  const key = `${klass}|${section}`
  try {
    const raw = localStorage.getItem('school:classSubjects')
    const map = raw ? JSON.parse(raw) as Record<string, string[]> : {}
    const arr = Array.isArray(map[key]) ? map[key] : []
    map[key] = arr.filter(s => s.toLowerCase() !== name.toLowerCase())
    localStorage.setItem('school:classSubjects', JSON.stringify(map))
  } catch {}
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classSubjects' } })) } catch {}
}
export function addSubject(name: string) {
  const raw = localStorage.getItem('school:subjects')
  const arr: string[] = raw ? JSON.parse(raw) : getSubjects()
  if (!arr.find(s => s.toLowerCase() === name.toLowerCase())) arr.push(name)
  localStorage.setItem('school:subjects', JSON.stringify(arr))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:subjects' } })) } catch {}
}

export function addClass(name: string) {
  const raw = localStorage.getItem('school:classes')
  const arr: string[] = raw ? JSON.parse(raw) : getClasses()
  if (!arr.find(s => s.toLowerCase() === name.toLowerCase())) arr.push(name)
  localStorage.setItem('school:classes', JSON.stringify(arr))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classes' } })) } catch {}
}

export function removeClass(name: string) {
  try {
    const raw = localStorage.getItem('school:classes')
    const arr: string[] = raw ? JSON.parse(raw) : []
    const next = arr.filter(c => c.toLowerCase() !== name.toLowerCase())
    localStorage.setItem('school:classes', JSON.stringify(next))
  } catch {}
  try {
    const rawMap = localStorage.getItem('school:classSections')
    const map: Record<string, string[]> = rawMap ? JSON.parse(rawMap) : {}
    if (name in map) {
      delete map[name]
      localStorage.setItem('school:classSections', JSON.stringify(map))
    }
  } catch {}
  try { if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classes' } }))
    window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classSections' } }))
  } } catch {}
}

export function addSectionToClass(klass: string, name: string) {
  const rawMap = localStorage.getItem('school:classSections')
  const map: Record<string, string[]> = rawMap ? JSON.parse(rawMap) : {}
  const arr: string[] = Array.isArray(map[klass]) ? map[klass] : []
  if (!arr.find(s => s.toLowerCase() === name.toLowerCase())) arr.push(name)
  map[klass] = arr
  localStorage.setItem('school:classSections', JSON.stringify(map))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classSections' } })) } catch {}
}

export function removeSectionFromClass(klass: string, name: string) {
  const rawMap = localStorage.getItem('school:classSections')
  const map: Record<string, string[]> = rawMap ? JSON.parse(rawMap) : {}
  const arr: string[] = Array.isArray(map[klass]) ? map[klass] : []
  const next = arr.filter(s => s.toLowerCase() !== name.toLowerCase())
  map[klass] = next
  localStorage.setItem('school:classSections', JSON.stringify(map))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:classSections' } })) } catch {}
}

export type TeachingAssignment = { teacher: string; subject: string; klass: string; section: string }
export function listAssignments(): TeachingAssignment[] {
  const raw = localStorage.getItem('school:assignments')
  return raw ? JSON.parse(raw) : []
}
export function saveAssignments(arr: TeachingAssignment[]) {
  localStorage.setItem('school:assignments', JSON.stringify(arr))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:assignments' } })) } catch {}
}

// ---- Assignment helpers (query) ----
export function getAssignmentsForTeacher(teacherName: string): TeachingAssignment[] {
  const all = listAssignments()
  return all.filter(a => a.teacher && a.teacher.toLowerCase() === teacherName.toLowerCase())
}

export function getAssignedClassesForTeacher(teacherName: string): string[] {
  const arr = getAssignmentsForTeacher(teacherName)
  const set = new Set<string>()
  arr.forEach(a => set.add(a.klass))
  return Array.from(set)
}

export function getAssignedSectionsForTeacher(teacherName: string, klass: string): string[] {
  const arr = getAssignmentsForTeacher(teacherName)
  const set = new Set<string>()
  arr.filter(a => a.klass === klass).forEach(a => set.add(a.section))
  return Array.from(set)
}

export function getAssignedSubjectsForTeacher(teacherName: string, klass?: string, section?: string): string[] {
  const arr = getAssignmentsForTeacher(teacherName)
  const set = new Set<string>()
  arr
    .filter(a => !klass || a.klass === klass)
    .filter(a => !section || a.section === section)
    .forEach(a => { if (a.subject) set.add(a.subject) })
  return Array.from(set)
}

export function rosterBy(klass: string, section: string): Student[] {
  const raw = localStorage.getItem('school:students')
  const all: Student[] = raw ? JSON.parse(raw) : []
  return all.filter(s => s.klass === klass && s.section === (section as any))
}

export function findStudent(usn: string): Student | undefined {
  const raw = localStorage.getItem('school:students')
  const all: Student[] = raw ? JSON.parse(raw) : []
  return all.find(s => s.usn === usn)
}

export function attendanceKey(date: string, klass: string, section: string, hour: number) {
  return `${date}|${klass}|${section}|${hour}`
}

export function saveAttendance(date: string, klass: string, section: string, hour: number, map: Record<string, boolean>) {
  const raw = localStorage.getItem('school:attendance')
  const store = raw ? JSON.parse(raw) : {}
  store[attendanceKey(date, klass, section, hour)] = map
  localStorage.setItem('school:attendance', JSON.stringify(store))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:attendance' } })) } catch {}
}

export function readAttendance(date: string, klass: string, section: string, hour: number): Record<string, boolean> {
  const raw = localStorage.getItem('school:attendance')
  const store = raw ? JSON.parse(raw) : {}
  return store[attendanceKey(date, klass, section, hour)] || {}
}

export type AttachmentLink = { type: 'link'; url: string; name?: string }
export type AttachmentFile = { type: 'file'; name: string; mime: string; dataUrl: string }
export type DiaryEntry = {
  subject: string
  teacher: string
  note: string
  klass: string
  section: string
  attachments?: Array<AttachmentLink | AttachmentFile>
  ts?: number
}

// ---- Academic Syllabus Stores ----
export type SyllabusSubtopic = { id: string; title: string; details?: string }
export type SyllabusChapter = { id: string; title: string; subtopics: SyllabusSubtopic[] }
export type SyllabusEntry = { klass: string; section: string; subject: string; chapters: SyllabusChapter[]; updatedAt?: number }

export function readSyllabus(klass: string, section: string, subject: string): SyllabusEntry {
  try {
    const raw = localStorage.getItem('school:syllabus')
    const arr: SyllabusEntry[] = raw ? JSON.parse(raw) : []
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const found = arr.find(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}` === key)
    return found || { klass, section, subject, chapters: [] }
  } catch { return { klass, section, subject, chapters: [] } }
}

export function saveSyllabus(entry: SyllabusEntry) {
  try {
    const raw = localStorage.getItem('school:syllabus')
    const arr: SyllabusEntry[] = raw ? JSON.parse(raw) : []
    const key = `${entry.klass}|${entry.section}|${entry.subject.toLowerCase()}`
    const next = { ...entry, updatedAt: Date.now() }
    const filtered = arr.filter(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}` !== key)
    filtered.unshift(next)
    localStorage.setItem('school:syllabus', JSON.stringify(filtered))
    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:syllabus' } })) } catch {}
  } catch {}
}

export type TextbookEntry = { klass: string; section: string; subject: string; name: string; mime: string; dataUrl: string; chapterId?: string | null; uploadedAt?: number }
export function setTextbook(tb: TextbookEntry) {
  try {
    const raw = localStorage.getItem('school:textbooks')
    const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
    // Allow multiple textbooks per subject and per chapter; prepend newest
    const next = [{ ...tb, uploadedAt: Date.now(), chapterId: tb.chapterId || null }, ...arr]
    localStorage.setItem('school:textbooks', JSON.stringify(next))
    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:textbooks' } })) } catch {}
  } catch {}
}
export function getTextbook(klass: string, section: string, subject: string): TextbookEntry | null {
  try {
    const raw = localStorage.getItem('school:textbooks')
    const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    // Return only the full-book entry (no chapterId)
    return arr.find(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}` === key && (!e.chapterId)) || null
  } catch { return null }
}
export function getTextbookForChapter(klass: string, section: string, subject: string, chapterId: string): TextbookEntry | null {
  try {
    const raw = localStorage.getItem('school:textbooks')
    const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
    const key = `${klass}|${section}|${subject.toLowerCase()}|${chapterId}`
    return arr.find(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}|${e.chapterId || ''}` === key) || null
  } catch { return null }
}

export function listTextbooks(klass: string, section: string, subject: string): TextbookEntry[] {
  try {
    const raw = localStorage.getItem('school:textbooks')
    const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    return arr.filter(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}` === key)
  } catch { return [] }
}

export function removeTextbook(klass: string, section: string, subject: string, chapterId?: string | null, uploadedAt?: number) {
  try {
    const raw = localStorage.getItem('school:textbooks')
    const arr: TextbookEntry[] = raw ? JSON.parse(raw) : []
    let next: TextbookEntry[]
    if (uploadedAt) {
      // Remove only the matching entry by timestamp id
      next = arr.filter(e => !(
        e.klass === klass && e.section === section && e.subject.toLowerCase() === subject.toLowerCase() &&
        (e.chapterId || null) === (chapterId || null) && e.uploadedAt === uploadedAt
      ))
    } else {
      // Fallback: remove all entries for this subject+chapter
      const fullKey = `${klass}|${section}|${subject.toLowerCase()}|${chapterId || ''}`
      next = arr.filter(e => `${e.klass}|${e.section}|${e.subject.toLowerCase()}|${e.chapterId || ''}` !== fullKey)
    }
    localStorage.setItem('school:textbooks', JSON.stringify(next))
    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:textbooks' } })) } catch {}
  } catch {}
}

export type ResourceItem = AttachmentLink | AttachmentFile
export function addMaterial(klass: string, section: string, subject: string, item: ResourceItem) {
  try {
    const raw = localStorage.getItem('school:materials')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = Array.isArray(map[key]) ? map[key] : []
    map[key] = [item, ...arr]
    localStorage.setItem('school:materials', JSON.stringify(map))
    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:materials' } })) } catch {}
  } catch {}
}
export function listMaterials(klass: string, section: string, subject: string): ResourceItem[] {
  try {
    const raw = localStorage.getItem('school:materials')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = map[key]
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function removeMaterial(klass: string, section: string, subject: string, index: number) {
  try {
    const raw = localStorage.getItem('school:materials')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = Array.isArray(map[key]) ? map[key] : []
    if (index >= 0 && index < arr.length) {
      arr.splice(index, 1)
      map[key] = arr
      localStorage.setItem('school:materials', JSON.stringify(map))
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:materials' } })) } catch {}
    }
  } catch {}
}

export function addPyq(klass: string, section: string, subject: string, item: ResourceItem) {
  try {
    const raw = localStorage.getItem('school:pyqs')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = Array.isArray(map[key]) ? map[key] : []
    map[key] = [item, ...arr]
    localStorage.setItem('school:pyqs', JSON.stringify(map))
    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:pyqs' } })) } catch {}
  } catch {}
}
export function listPyqs(klass: string, section: string, subject: string): ResourceItem[] {
  try {
    const raw = localStorage.getItem('school:pyqs')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = map[key]
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

export function removePyq(klass: string, section: string, subject: string, index: number) {
  try {
    const raw = localStorage.getItem('school:pyqs')
    const map: Record<string, ResourceItem[]> = raw ? JSON.parse(raw) : {}
    const key = `${klass}|${section}|${subject.toLowerCase()}`
    const arr = Array.isArray(map[key]) ? map[key] : []
    if (index >= 0 && index < arr.length) {
      arr.splice(index, 1)
      map[key] = arr
      localStorage.setItem('school:pyqs', JSON.stringify(map))
      try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:pyqs' } })) } catch {}
    }
  } catch {}
}

// ---- Circulars ----
export type Circular = {
  title: string
  body: string
  date: string // YYYY-MM-DD
  klass: string
  section: 'A' | 'B'
  attachments?: Array<AttachmentLink | AttachmentFile>
  createdBy?: string
  // Optional UI color banner; assigned on add
  color?: 'blue' | 'green' | 'orange' | 'pink' | 'violet'
  ts?: number
}

export function saveDiary(date: string, payload: DiaryEntry) {
  const raw = localStorage.getItem('school:diary')
  const store = raw ? JSON.parse(raw) : {}
  const arr: DiaryEntry[] = Array.isArray(store[date]) ? store[date] : (store[date] ? [store[date]] : [])
  const next = payload.ts ? payload : { ...payload, ts: Date.now() }
  // Replace existing entry for same subject + class/section
  const filtered = arr.filter((e: DiaryEntry) => !(
    e.subject.toLowerCase() === next.subject.toLowerCase() &&
    e.klass === next.klass &&
    e.section === next.section
  ))
  store[date] = [next, ...filtered]
  localStorage.setItem('school:diary', JSON.stringify(store))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:diary' } })) } catch {}
}

export function readDiary(date: string): DiaryEntry[] {
  const raw = localStorage.getItem('school:diary')
  const store = raw ? JSON.parse(raw) : {}
  const v = store[date]
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

export function readDiaryBy(date: string, klass: string, section: string): DiaryEntry[] {
  return readDiary(date).filter(e => e.klass === klass && e.section === section)
}

// ---- Academic Calendar helpers ----
export function addCalendarEvent(ev: CalendarEvent) {
  const raw = localStorage.getItem('school:calendar')
  const store = raw ? JSON.parse(raw) : {}
  const arr: CalendarEvent[] = Array.isArray(store[ev.date]) ? store[ev.date] : (store[ev.date] ? [store[ev.date]] : [])
  store[ev.date] = [ev, ...arr]
  localStorage.setItem('school:calendar', JSON.stringify(store))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:calendar' } })) } catch {}
}

export function readCalendarByDate(date: string): CalendarEvent[] {
  const raw = localStorage.getItem('school:calendar')
  const store = raw ? JSON.parse(raw) : {}
  const v = store[date]
  return v ? (Array.isArray(v) ? v : [v]) : []
}

export function readCalendarByMonth(ym: string): CalendarEvent[] {
  // ym: YYYY-MM
  const raw = localStorage.getItem('school:calendar')
  const store = raw ? JSON.parse(raw) : {}
  const out: CalendarEvent[] = []
  for (const k of Object.keys(store)) {
    if (k.slice(0,7) === ym) {
      const v = store[k]
      out.push(...(Array.isArray(v) ? v : [v]))
    }
  }
  return out
}

// ---- Marks & Assessments ----
export type MarkSheet = {
  test: string // e.g., UT-1, MID SEM, etc.
  subject: string
  klass: string
  section: string
  date?: string // YYYY-MM-DD
  max: number
  marks: Record<string, number> // usn -> score
  createdBy?: string
  ts?: number
}

function ensureMarksStore() {
  if (!localStorage.getItem('school:marks')) {
    localStorage.setItem('school:marks', JSON.stringify([]))
  }
}

export function saveMarks(sheet: MarkSheet) {
  ensureMarksStore()
  const raw = localStorage.getItem('school:marks')!
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const key = (x: MarkSheet) => `${x.test.toLowerCase()}|${x.subject.toLowerCase()}|${x.klass}|${x.section}`
  const k = key(sheet)
  const next: MarkSheet = { ...sheet, ts: Date.now() }
  const filtered = arr.filter(m => key(m) !== k)
  filtered.unshift(next)
  localStorage.setItem('school:marks', JSON.stringify(filtered))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:marks' } })) } catch {}
}

export function readMarks(klass: string, section: string, subject: string, test: string): MarkSheet | null {
  const raw = localStorage.getItem('school:marks')
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const k = `${test.toLowerCase()}|${subject.toLowerCase()}|${klass}|${section}`
  const found = arr.find(m => `${m.test.toLowerCase()}|${m.subject.toLowerCase()}|${m.klass}|${m.section}` === k)
  return found || null
}

export function readMarksByStudent(usn: string): Array<{ test: string; subject: string; score: number; max: number; date?: string; klass: string; section: string; ts?: number }> {
  const raw = localStorage.getItem('school:marks')
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const out: Array<{ test: string; subject: string; score: number; max: number; date?: string; klass: string; section: string; ts?: number }> = []
  for (const m of arr) {
    if (usn in m.marks) {
      out.push({ test: m.test, subject: m.subject, score: Number(m.marks[usn] ?? 0), max: m.max, date: m.date, klass: m.klass, section: m.section, ts: m.ts })
    }
  }
  // newest first
  out.sort((a,b) => (b.ts || 0) - (a.ts || 0))
  return out
}

export function listTestsBySubject(klass: string, section: string, subject: string): string[] {
  const raw = localStorage.getItem('school:marks')
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const set = new Set<string>()
  for (const m of arr) {
    if (m.klass === klass && m.section === section && m.subject.toLowerCase() === subject.toLowerCase()) {
      set.add(m.test)
    }
  }
  return Array.from(set)
}

function normalizeTestName(name: string) {
  return (name || '').toLowerCase().trim()
}

export function readTotalsByTest(klass: string, section: string, test: string): Array<{ usn: string; sum: number; total: number; pct: number }> {
  const raw = localStorage.getItem('school:marks')
  const arr: MarkSheet[] = raw ? JSON.parse(raw) : []
  const want = normalizeTestName(test)
  const sums: Record<string, { sum: number; total: number }> = {}
  for (const m of arr) {
    if (m.klass !== klass || m.section !== section) continue
    if (normalizeTestName(m.test) !== want) continue
    for (const usn of Object.keys(m.marks || {})) {
      const v = Number((m.marks as any)[usn] ?? 0)
      if (!sums[usn]) sums[usn] = { sum: 0, total: 0 }
      sums[usn].sum += isNaN(v) ? 0 : v
      sums[usn].total += m.max || 0
    }
  }
  const out: Array<{ usn: string; sum: number; total: number; pct: number }> = []
  for (const usn of Object.keys(sums)) {
    const { sum, total } = sums[usn]
    const pct = total ? (sum * 100) / total : 0
    out.push({ usn, sum, total, pct: Math.round(pct) })
  }
  // Sort by percentage desc, then by sum desc to break ties consistently
  out.sort((a,b) => (b.pct - a.pct) || (b.sum - a.sum))
  return out
}

export function readTestRank(klass: string, section: string, test: string, usn: string): { rank: number | null; of: number; sum: number; total: number; pct: number } {
  const totals = readTotalsByTest(klass, section, test)
  const of = totals.length
  const idx = totals.findIndex(t => t.usn === usn)
  if (idx === -1) return { rank: null, of, sum: 0, total: 0, pct: 0 }
  // Compute dense rank (equal scores share same rank)
  let rank = 1
  for (let i = 0; i < idx; i++) {
    if (totals[i].pct > totals[idx].pct || (totals[i].pct === totals[idx].pct && totals[i].sum > totals[idx].sum)) {
      rank += 1
    }
  }
  const me = totals[idx]
  return { rank, of, sum: me.sum, total: me.total, pct: me.pct }
}

// ---- Circular helpers ----
export function addCircular(c: Circular) {
  const raw = localStorage.getItem('school:circulars')
  const arr: Circular[] = raw ? JSON.parse(raw) : []
  // Assign a rotating banner color so each new circular has a new color
  const palette = ['blue','green','orange','pink','violet'] as const
  let idx = 0
  try {
    const stored = localStorage.getItem('school:circulars:nextColorIndex')
    const n = stored ? parseInt(stored, 10) : 0
    if (!Number.isNaN(n) && n >= 0 && n < palette.length) idx = n
  } catch {}
  const assignedColor = c.color && (palette as readonly string[]).includes(c.color) ? c.color : (palette[idx] as (typeof palette)[number])
  const nextIdx = (idx + 1) % palette.length
  try { localStorage.setItem('school:circulars:nextColorIndex', String(nextIdx)) } catch {}

  const next: Circular = { ...c, color: assignedColor, ts: c.ts ?? Date.now() }
  arr.unshift(next)
  localStorage.setItem('school:circulars', JSON.stringify(arr))
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('school:update', { detail: { key: 'school:circulars' } })) } catch {}
}

export function readCircularsByClassSection(klass: string, section: 'A' | 'B'): Circular[] {
  const raw = localStorage.getItem('school:circulars')
  const arr: Circular[] = raw ? JSON.parse(raw) : []
  return arr.filter(c => c.klass === klass && c.section === section)
}
