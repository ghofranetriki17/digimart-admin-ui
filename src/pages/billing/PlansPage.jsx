import { useEffect, useState } from 'react'
import TextInput from '../../components/ui/TextInput'
import Button from '../../components/ui/Button'
import './PlansPage.css'

const emptyForm = {
  code: '',
  name: '',
  description: '',
  price: '0',
  currency: 'TND',
  billingCycle: 'MONTHLY',
  discountPercentage: '0',
  standard: false,
  active: true,
  featureIds: [],
}

export default function PlansPage({ token }) {
  const [plans, setPlans] = useState([])
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  const auth = { Authorization: `Bearer ${token}` }

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [planRes, featRes] = await Promise.all([
        fetch('/api/plans?onlyActive=false', { headers: auth }),
        fetch('/api/premium-features', { headers: auth }).catch(() => null),
      ])
      if (!planRes.ok) throw new Error('Impossible de charger les plans')
      const planData = await planRes.json()
      setPlans(Array.isArray(planData) ? planData : [])
      if (featRes && featRes.ok) {
        const featData = await featRes.json()
        setFeatures(Array.isArray(featData) ? featData : [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (plan) => {
    setEditingId(plan.id)
    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description || '',
      price: String(plan.price ?? '0'),
      currency: plan.currency || 'TND',
      billingCycle: plan.billingCycle || 'MONTHLY',
      discountPercentage: String(plan.discountPercentage ?? '0'),
      standard: !!plan.standard,
      active: !!plan.active,
      featureIds: (plan.features || []).map((f) => f.id),
    })
    setModalOpen(true)
  }

  const savePlan = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price || '0'),
        discountPercentage: parseFloat(form.discountPercentage || '0'),
        featureIds: form.featureIds,
      }
      const url = editingId ? `/api/plans/${editingId}` : '/api/plans'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Sauvegarde impossible')
      setModalOpen(false)
      await loadAll()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (plan) => {
    const url = `/api/plans/${plan.id}/${plan.active ? 'deactivate' : 'activate'}`
    await fetch(url, { method: 'POST', headers: auth })
    await loadAll()
  }

  const toggleFeature = (id) => {
    setForm((prev) => {
      const has = prev.featureIds.includes(id)
      return {
        ...prev,
        featureIds: has ? prev.featureIds.filter((x) => x !== id) : [...prev.featureIds, id],
      }
    })
  }

  return (
    <div className="plans-page">
      <header className="plans-hero">
        <div className="plans-hero-title">
          <h2>Plans &amp; fonctionnalités</h2>
          <span className="plans-hero-badge">BILLING</span>
        </div>
        <p>Gérez les plans d’abonnement et les features premium.</p>
        <div className="plans-hero-actions">
          <Button variant="primary" onClick={openCreate}>Nouveau plan</Button>
        </div>
      </header>

      {loading ? <div className="plans-status">Chargement…</div> : null}
      {error ? <div className="plans-error">{error}</div> : null}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className="plan-card">
            <div className="plan-card-head">
              <div>
                <div className="plan-name">{plan.name}</div>
                <div className="plan-code">{plan.code}</div>
              </div>
              <div className={`plan-pill ${plan.active ? 'active' : 'inactive'}`}>
                {plan.active ? 'Actif' : 'Inactif'}
              </div>
            </div>
            <div className="plan-price">
              {plan.price} {plan.currency} / {plan.billingCycle?.toLowerCase()}
            </div>
            <div className="plan-features">
              {(plan.features || []).map((f) => (
                <span key={f.id} className="plan-feature-chip">{f.name}</span>
              ))}
              {(plan.features || []).length === 0 ? <span className="plan-empty">Aucune feature</span> : null}
            </div>
            <div className="plan-actions">
              <Button variant="secondary" onClick={() => openEdit(plan)}>Éditer</Button>
              <Button variant={plan.active ? 'ghost' : 'primary'} onClick={() => toggleActive(plan)}>
                {plan.active ? 'Désactiver' : 'Activer'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen ? (
        <div className="plans-modal">
          <div className="plans-modal-content">
            <div className="plans-modal-header">
              <h3>{editingId ? 'Modifier le plan' : 'Nouveau plan'}</h3>
              <button type="button" className="plans-close" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <div className="plans-form">
              <TextInput label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              <TextInput label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextInput label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="plans-row">
                <TextInput label="Prix" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                <TextInput label="Devise" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              </div>
              <div className="plans-row">
                <label className="plans-field">
                  <span className="plans-label">Cycle</span>
                  <select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}>
                    <option value="MONTHLY">Mensuel</option>
                    <option value="QUARTERLY">Trimestriel</option>
                    <option value="YEARLY">Annuel</option>
                    <option value="ONE_TIME">One-shot</option>
                  </select>
                </label>
                <TextInput
                  label="Remise (%)"
                  type="number"
                  step="0.01"
                  value={form.discountPercentage}
                  onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                />
              </div>

              <div className="plans-toggles">
                <label className="plans-checkbox">
                  <input
                    type="checkbox"
                    checked={form.standard}
                    onChange={(e) => setForm({ ...form, standard: e.target.checked })}
                  />
                  Plan standard
                </label>
                <label className="plans-checkbox">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  Actif
                </label>
              </div>

              <div className="plans-features">
                <div className="plans-label">Fonctionnalités incluses</div>
                <div className="plans-feature-list">
                  {features.map((f) => (
                    <label key={f.id} className="plans-feature-item">
                      <input
                        type="checkbox"
                        checked={form.featureIds.includes(f.id)}
                        onChange={() => toggleFeature(f.id)}
                      />
                      <span>{f.name}</span>
                    </label>
                  ))}
                  {features.length === 0 ? <div className="plans-empty">Pas de features configurées</div> : null}
                </div>
              </div>
            </div>

            <div className="plans-modal-actions">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button variant="primary" disabled={saving} onClick={savePlan}>
                {saving ? 'Sauvegarde…' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
