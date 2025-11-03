"use client"
import React from 'react'

type FeeItem = { label: string; amount: number; status: 'Paid' | 'Unpaid' }

export default function ParentPaymentsPage() {
  const [fees, setFees] = React.useState<FeeItem[]>([
    { label: 'Tuition Fee - Term 1', amount: 15000, status: 'Paid' },
    { label: 'Lab Fee', amount: 2000, status: 'Paid' },
    { label: 'Library Fee', amount: 800, status: 'Unpaid' },
    { label: 'Sports Fee', amount: 1200, status: 'Unpaid' }
  ])

  const pay = (idx: number) => {
    setFees(prev => prev.map((f, i) => i === idx ? { ...f, status: 'Paid' } : f))
  }

  const totalDue = fees.filter(f => f.status === 'Unpaid').reduce((s,f) => s + f.amount, 0)

  return (
    <div className="dash">
      <h2 className="title">Payments</h2>
      <p className="subtitle">View fee details and pay pending dues.</p>

      <div style={{display:'grid', gap:10, marginTop:12}}>
        {fees.map((f, idx) => (
          <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid var(--panel-border)', borderRadius:10, padding:'10px 12px'}}>
            <div>
              <div style={{fontWeight:700}}>{f.label}</div>
              <div className="note">Amount: ₹{f.amount.toLocaleString('en-IN')}</div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <span style={{fontWeight:700, color: f.status === 'Paid' ? 'var(--success)' : 'var(--danger)'}}>{f.status}</span>
              {f.status === 'Unpaid' && (
                <button className="btn-ghost" type="button" onClick={() => pay(idx)}>Pay Now</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="actions" style={{marginTop:16, justifyContent:'space-between'}}>
        <div style={{fontWeight:700}}>Total Due: ₹{totalDue.toLocaleString('en-IN')}</div>
        <button className="btn" type="button" disabled={totalDue === 0}>Proceed to Payment</button>
      </div>
    </div>
  )
}

