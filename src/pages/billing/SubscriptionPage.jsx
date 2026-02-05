import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import './SubscriptionPage.css'

export default function SubscriptionPage({ token, tenantId }) {
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  const auth = { Authorization: `Bearer ${token}` }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [curRes, histRes, plansRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}/subscriptions/current`, { headers: auth }),
        fetch(`/api/tenants/${tenantId}/subscriptions/history`, { headers: auth }),
        fetch('/api/plans', { headers: auth }),
      ])
      if (!curRes.ok) throw new Error('Aucun abonnement trouvé')
      const curData = await curRes.json()
      setCurrent(curData)
      const histData = histRes.ok ? await histRes.json() : []
      setHistory(Array.isArray(histData) ? histData : [])
      const planData = plansRes.ok ? await plansRes.json() : []
      setPlans(Array.isArray(planData) ? planData : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenantId) load()
  }, [tenantId])

  const activate = async () => {
    if (!selectedPlan) return
    setProcessing(true)
    setError('')
    try {
      const res = await fetch(`/api/tenants/${tenantId}/subscriptions/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({ planId: Number(selectedPlan) }),
      })
      if (!res.ok) throw new Error('Activation impossible')
      setSelectedPlan('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="subscription-page">
      <div className="subscription-header">
        <div>
          <h2>Abonnement du tenant</h2>
          <p>Plan actif, changement de plan et historique.</p>
        </div>
      </div>

      {loading ? <div className="subscription-status">Chargement…</div> : null}
      {error ? <div className="subscription-error">{error}</div> : null}

      {current ? (
        <div className="subscription-current">
          <div>
            <div className="subscription-label">Plan actuel</div>
            <div className="subscription-plan">{current.planName || current.planCode}</div>
          </div>
          <div>
            <div className="subscription-label">Statut</div>
            <div className={`subscription-pill status-${current.status?.toLowerCase()}`}>
              {current.status}
            </div>
          </div>
          <div>
            <div className="subscription-label">Depuis</div>
            <div>{current.startDate || '—'}</div>
          </div>
          <div>
            <div className="subscription-label">Prochaine échéance</div>
            <div>{current.nextBillingDate || '—'}</div>
          </div>
        </div>
      ) : null}

      <div className="subscription-change">
        <label className="subscription-field">
          <span className="subscription-label">Changer de plan</span>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
          >
            <option value="">Sélectionner un plan</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.price} {p.currency} / {p.billingCycle?.toLowerCase()})
              </option>
            ))}
          </select>
        </label>
        <Button variant="primary" disabled={!selectedPlan || processing} onClick={activate}>
          {processing ? 'Activation…' : 'Activer'}
        </Button>
      </div>

      <div className="subscription-history">
        <div className="subscription-history-head">
          <div>Date</div>
          <div>Action</div>
          <div>Ancien plan</div>
          <div>Nouveau plan</div>
          <div>Par</div>
        </div>
        {history.map((h) => (
          <div key={h.id} className="subscription-history-row">
            <div>{h.performedAt}</div>
            <div>{h.action}</div>
            <div>{h.oldPlanId || '—'}</div>
            <div>{h.newPlanId}</div>
            <div>{h.performedBy || '—'}</div>
          </div>
        ))}
        {history.length === 0 ? (
          <div className="subscription-empty">Pas d’historique</div>
        ) : null}
      </div>
    </div>
  )
}
