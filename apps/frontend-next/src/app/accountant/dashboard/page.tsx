import Link from 'next/link'

export default function AccountantDashboard() {
  return (
    <div className="dash">
      <h2 className="title">Accountant Dashboard (Placeholder)</h2>
      <p className="subtitle">Payments, invoices and reconciliations will be managed here.</p>
      <div style={{ marginTop: 16 }}>
        <Link className="back" href="/">← Back to Home</Link>
      </div>
    </div>
  )
}

