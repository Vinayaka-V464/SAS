"use client"
import React from 'react'
import { seedIfNeeded, findStudent } from './teacher/data'
import { useRouter } from 'next/navigation'

type Role = 'student' | 'parent' | 'admin' | 'accountant' | 'teacher'

// HOD departments mapped to the 5 subjects used across the app
const departments = [
  'Kannada',
  'English',
  'Chemistry',
  'Physics',
  'Mathematics'
]

export default function Home() {
  const router = useRouter()
  const [role, setRole] = React.useState<Role>('student')
  const [name, setName] = React.useState('')
  const [roll, setRoll] = React.useState('')
  const [dept, setDept] = React.useState(departments[0])
  const [user, setUser] = React.useState('')
  const [pass, setPass] = React.useState('')
  const [empId, setEmpId] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const resetFields = (r: Role) => {
    setError('')
    setName('')
    setRoll('')
    setUser('')
    setPass('')
    setEmpId('')
    if (r === 'admin') setDept(departments[0])
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      switch (role) {
        case 'student': {
          const r = roll.trim()
          const n = name.trim()
          if (!n) throw new Error('Enter student name')
          if (!r) throw new Error('Enter roll number')
          if (pass !== '12345') throw new Error('Passcode must be 12345 (temporary)')
          const me = findStudent(r)
          if (!me) throw new Error('Invalid roll. Use one from the class list.')
          const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()
          if (norm(n) !== norm(me.name)) throw new Error("Name doesn't match our records for this roll")
          // Store verified identity from roster
          sessionStorage.setItem('student', JSON.stringify({ name: me.name, roll: me.usn }))
          router.push(`/student/dashboard?roll=${encodeURIComponent(me.usn)}`)
          break
        }
        case 'teacher': {
          if (!name.trim()) throw new Error('Enter teacher name')
          if (pass !== '12345') throw new Error('Teacher password must be 12345 (temporary)')
          const raw = localStorage.getItem('school:teachers')
          const teachers = raw ? JSON.parse(raw) : []
          const t = teachers.find((x: any) => x.name.toLowerCase() === name.trim().toLowerCase())
          if (!t) throw new Error('Unknown teacher. Use one of the seeded names on first load.')
          const primary = Array.isArray(t.subjects) ? (t.subjects[0] || '') : (t.subject || '')
          sessionStorage.setItem('teacher', JSON.stringify({ name: t.name, subject: primary }))
          router.push('/teacher/dashboard')
          break
        }
        case 'parent': {
          if (!roll.trim()) throw new Error("Enter child's roll number")
          if (pass !== '12345') throw new Error('Parent password must be 12345 (temporary)')
          sessionStorage.setItem('parent', JSON.stringify({ roll }))
          router.push(`/parent/dashboard?roll=${encodeURIComponent(roll)}`)
          break
        }
        case 'admin': {
          if (!user.trim()) throw new Error('Enter name')
          if (pass !== '12345') throw new Error('Passcode must be 12345 (temporary)')
          const dept = 'General'
          sessionStorage.setItem('admin', JSON.stringify({ user, dept }))
          router.push(`/admin/dashboard`)
          break
        }
        case 'accountant': {
          if (!empId.trim() || !pass.trim()) throw new Error('Enter Employee ID and passcode')
          sessionStorage.setItem('accountant', JSON.stringify({ empId }))
          router.push('/accountant/dashboard')
          break
        }
      }
    } catch (err: any) {
      setError(err.message || 'Could not sign in')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    try { seedIfNeeded() } catch {}
  }, [])

  return (
    <div className="auth-card">
      <div className="brand">
        <span className="dot" />
        <strong>School SAS</strong>
      </div>
      <h1 className="title">Sign In</h1>
      <p className="subtitle">Clean black & white classic UI • One page for all roles</p>

      <form onSubmit={onSubmit}>
        <div className="field">
          <label className="label" htmlFor="role">Role</label>
          <select id="role" className="input select" value={role}
                  onChange={(e) => { const r = e.target.value as Role; setRole(r); resetFields(r) }}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
            <option value="admin">Admin / HOD</option>
            <option value="accountant">Accountant</option>
          </select>
        </div>

        {role === 'student' && (
          <>
            <div className="field">
              <label className="label" htmlFor="sname">Student Name</label>
              <input id="sname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Student 801" />
            </div>
            <div className="field">
              <label className="label" htmlFor="sroll">Roll Number</label>
              <input id="sroll" className="input" value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="e.g. 801" />
            </div>
            <div className="field">
              <label className="label" htmlFor="spass">Passcode</label>
              <input id="spass" type="password" className="input" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="12345" />
            </div>
          </>
        )}

        {role === 'teacher' && (
          <>
            <div className="field">
              <label className="label" htmlFor="tname">Teacher Name</label>
              <input id="tname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ms. Priya N" />
            </div>
            <div className="field">
              <label className="label" htmlFor="tpass">Password</label>
              <input id="tpass" type="password" className="input" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="12345" />
            </div>
          </>
        )}

        {role === 'parent' && (
          <>
            <div className="field">
              <label className="label" htmlFor="proll">Child Roll Number</label>
              <input id="proll" className="input" value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="e.g. 22CS045" />
            </div>
            <div className="field">
              <label className="label" htmlFor="ppass">Parent Password</label>
              <input id="ppass" type="password" className="input" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="12345" />
            </div>
          </>
        )}

        {role === 'admin' && (
          <>
            <div className="row">
              <div className="field">
                <label className="label" htmlFor="auser">Name</label>
                <input id="auser" className="input" value={user} onChange={(e) => setUser(e.target.value)} placeholder="e.g. HOD Name" />
              </div>
              <div className="field">
                <label className="label" htmlFor="apass">Passcode</label>
                <input id="apass" type="password" className="input" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="12345" />
              </div>
            </div>
          </>
        )}

        {role === 'accountant' && (
          <>
            <div className="field">
              <label className="label" htmlFor="emp">Employee ID</label>
              <input id="emp" className="input" value={empId} onChange={(e) => setEmpId(e.target.value)} placeholder="e.g. AC1023" />
            </div>
            <div className="field">
              <label className="label" htmlFor="cpass">Passcode</label>
              <input id="cpass" type="password" className="input" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="simple for now" />
            </div>
          </>
        )}

        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </div>
        <p className="note">Temp rules: Student password = Roll. Parent password = 12345. Others accept simple passcodes for now.</p>
      </form>
    </div>
  )
}
