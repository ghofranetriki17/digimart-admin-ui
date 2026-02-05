import { useEffect, useState } from 'react'
import './AdminTenantsPage.css'

export default function AdminTenantsPage({ token }) {
  const [tenants, setTenants] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subStatus, setSubStatus] = useState({}) // { [tenantId]: { planId, planName } }
  const [rowLoading, setRowLoading] = useState({})

  const auth = { Authorization: `Bearer ${token}` }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [tRes, pRes] = await Promise.all([
        fetch('/api/tenants', { headers: auth }),
        fetch('/api/plans', { headers: auth }),
      ])
      if (!tRes.ok) throw new Error('Impossible de charger les tenants')
      const tenantsData = await tRes.json()
      setTenants(Array.isArray(tenantsData) ? tenantsData : [])

      const plansData = pRes.ok ? await pRes.json() : []
      setPlans(Array.isArray(plansData) ? plansData : [])

      const statuses = {}
      await Promise.all(
        (Array.isArray(tenantsData) ? tenantsData : []).map(async (t) => {
          const subRes = await fetch(`/api/admin/tenants/${t.id}/subscriptions/current`, { headers: auth })
          if (subRes.ok) {
            const sub = await subRes.json()
            statuses[t.id] = {
              planId: sub.planId,
              planName: sub.planName || sub.planCode || '—',
            }
          } else {
            statuses[t.id] = null
          }
        }),
      )
      setSubStatus(statuses)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activate = async (tenantId, planId) => {
    if (!planId) return
    setRowLoading((prev) => ({ ...prev, [tenantId]: true }))
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/subscriptions/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ planId: Number(planId) }),
      })

      if (!res.ok) {
        const body = await res.text()
        const msg = `Activation failed (${res.status}). ${body || 'No response body.'}`
        console.error(msg)
        setError(msg)
        return
      }

      await load()
    } finally {
      setRowLoading((prev) => ({ ...prev, [tenantId]: false }))
    }
  }

  return (
    <div className="admin-tenants-page">
      <header className="admin-tenants-hero">
        <div className="admin-hero-title">
          <h2>Tenants &amp; abonnements</h2>
          <span className="admin-hero-badge">SUPER ADMIN</span>
        </div>
        <p>Gérez les plans d’abonnement des tenants et basculez un plan actif en un clic.</p>
      </header>

      {loading ? <div className="admin-tenants-status">Chargement…</div> : null}
      {error ? <div className="admin-tenants-error">{error}</div> : null}

      <section className="admin-tenants-grid">
        {tenants.map((t) => {
          const current = subStatus[t.id]
          return (
            <div key={t.id} className="tenant-card">
              <div className="tenant-card-head">
                <div className="tenant-id">
                  <div className="admin-tenant-name">{t.name}</div>
                  <span className="admin-tenant-sub">{t.subdomain}</span>
                </div>
                <span className={`tenant-plan-pill ${current ? 'active' : 'inactive'}`}>
                  {current ? 'Plan actif' : 'Aucun plan'}
                </span>
              </div>

              <div className="tenant-card-body">
                <div className="tenant-current">
                  <span className="tenant-label">Plan actuel</span>
                  <strong>{current?.planName || 'Aucun'}</strong>
                </div>
                <div className="tenant-planlist">
                  {plans.map((p) => {
                    const isOn = current?.planId === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`tenant-toggle ${isOn ? 'on' : 'off'}`}
                        disabled={rowLoading[t.id]}
                        onClick={() => {
                          if (!isOn) activate(t.id, p.id)
                        }}
                      >
                        <span className="toggle-dot" />
                        <span className="toggle-label">
                          {p.name} ({p.price} {p.currency})
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {rowLoading[t.id] ? <div className="tenant-row-loading">Mise à jour…</div> : null}
            </div>
          )
        })}

        {tenants.length === 0 ? <div className="admin-tenants-empty">Aucun tenant</div> : null}
      </section>
    </div>
  )
}
