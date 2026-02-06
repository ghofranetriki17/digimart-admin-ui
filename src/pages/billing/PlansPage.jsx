import { useEffect, useState } from 'react'
import { FaCrown, FaList, FaThLarge } from 'react-icons/fa'
import Button from '../../components/atoms/Button'
import SearchInput from '../../components/atoms/SearchInput'
import EmptyState from '../../components/atoms/EmptyState'
import TextInput from '../../components/atoms/TextInput'
import CardGrid from '../../components/molecules/CardGrid'
import FilterBar from '../../components/molecules/FilterBar'
import SectionHeader from '../../components/molecules/SectionHeader'
import StatsGrid from '../../components/molecules/StatsGrid'
import ViewToggle from '../../components/molecules/ViewToggle'
import StandardPage from '../../templates/StandardPage'
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')

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

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)')
    const syncView = () => {
      if (media.matches) {
        setViewMode('grid')
      }
    }
    syncView()
    media.addEventListener('change', syncView)
    return () => media.removeEventListener('change', syncView)
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

  const filteredPlans = plans.filter((plan) => {
    const term = search.trim().toLowerCase()
    const featureNames = (plan.features || []).map((feature) => feature.name).join(' ')
    const matchesSearch = term
      ? `${plan.name} ${plan.code} ${plan.description || ''} ${plan.price} ${plan.currency} ${featureNames}`
          .toLowerCase()
          .includes(term)
      : true

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
          ? plan.active
          : !plan.active

    return matchesSearch && matchesStatus
  })

  const totalPlans = plans.length
  const activePlans = plans.filter((plan) => plan.active).length

  return (
    <StandardPage
      className="plans-page"
      title="Plans & fonctionnalites"
      badge="BILLING"
      subtitle="Gerez les plans d'abonnement et les features premium."
      actions={(
        <div className="plans-hero-actions">
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'grid', label: 'Grid view', icon: <FaThLarge />, ariaLabel: 'Grid view' },
              { value: 'list', label: 'List view', icon: <FaList />, ariaLabel: 'List view' },
            ]}
          />
          <Button type="button" className="plans-add-button" onClick={openCreate}>
            Ajouter un plan
          </Button>
        </div>
      )}
    >

      <StatsGrid
        items={[
          { key: 'total', label: 'Total', value: totalPlans },
          { key: 'active', label: 'Actifs', value: activePlans },
        ]}
        className="plans-stats"
        cardClassName="plans-stat-card"
        labelClassName="plans-stat-label"
        valueClassName="plans-stat-value"
      />

      <FilterBar className="plans-filters">
        <SearchInput
          className="plans-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un plan..."
        />
        <div className="filter-group plans-filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Statut</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </FilterBar>

      {error ? <div className="plans-error">{error}</div> : null}

      <section className="plans-list">
        <SectionHeader title="Liste des plans" loading={loading} />
        <CardGrid className="plans-cards" list={viewMode === 'list'} size="lg">
          {filteredPlans.length === 0 ? (
            <EmptyState>Aucun plan trouve.</EmptyState>
          ) : (
            filteredPlans.map((plan) => (
              <article key={plan.id} className="plan-card">
                <div className="plan-card-top">
                  <div className="plan-card-icon" aria-hidden="true">
                    <FaCrown />
                  </div>
                  <span className={`plan-card-status ${plan.active ? 'active' : 'inactive'}`}>
                    {plan.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="plan-card-title">
                  <div className="plan-card-name">{plan.name}</div>
                  {plan.standard ? <span className="plan-card-badge">Standard</span> : null}
                </div>
                <div className="plan-card-code">{plan.code}</div>
                <div className="plan-card-price">
                  {plan.price} {plan.currency} / {plan.billingCycle?.toLowerCase()}
                </div>
                <div className="plan-card-desc">{plan.description || '---'}</div>
                <div className="plan-card-features">
                  {(plan.features || []).map((feature) => (
                    <span key={feature.id} className="plan-feature-chip">{feature.name}</span>
                  ))}
                  {(plan.features || []).length === 0 ? (
                    <span className="plan-feature-empty">Aucune feature</span>
                  ) : null}
                </div>
                <div className="plan-card-actions">
                  <Button variant="secondary" onClick={() => openEdit(plan)}>Editer</Button>
                  <Button variant={plan.active ? 'ghost' : 'primary'} onClick={() => toggleActive(plan)}>
                    {plan.active ? 'Desactiver' : 'Activer'}
                  </Button>
                </div>
              </article>
            ))
          )}
        </CardGrid>
      </section>

      {modalOpen ? (
        <div className="plans-modal">
          <div className="plans-modal-content">
            <div className="plans-modal-header">
              <h3>{editingId ? 'Modifier le plan' : 'Nouveau plan'}</h3>
              <button type="button" className="plans-close" onClick={() => setModalOpen(false)}>x</button>
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
                <div className="plans-label">Fonctionnalites incluses</div>
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
                  {features.length === 0 ? <div className="plans-modal-empty">Pas de features configurees</div> : null}
                </div>
              </div>
            </div>

            <div className="plans-modal-actions">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button variant="primary" disabled={saving} onClick={savePlan}>
                {saving ? 'Sauvegarde...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </StandardPage>
  )
}

