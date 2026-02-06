import { useEffect, useMemo, useState } from 'react'
import { FaEdit, FaEye, FaLayerGroup, FaList, FaThLarge, FaTrash } from 'react-icons/fa'
import Button from '../../components/atoms/Button'
import ConfirmDialog from '../../components/atoms/ConfirmDialog'
import EmptyState from '../../components/atoms/EmptyState'
import Modal from '../../components/atoms/Modal'
import SearchInput from '../../components/atoms/SearchInput'
import TextInput from '../../components/atoms/TextInput'
import CardGrid from '../../components/molecules/CardGrid'
import FilterBar from '../../components/molecules/FilterBar'
import SectionHeader from '../../components/molecules/SectionHeader'
import StatsGrid from '../../components/molecules/StatsGrid'
import ViewToggle from '../../components/molecules/ViewToggle'
import StandardPage from '../../templates/StandardPage'
import './SectorsPage.css'

const emptyForm = {
  label: '',
  description: '',
  active: true,
}

export default function SectorsPage({ token }) {
  const [sectors, setSectors] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingSector, setEditingSector] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailSector, setDetailSector] = useState(null)
  const [detailTenants, setDetailTenants] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState('')

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token],
  )

  const parseError = async (res) => {
    if (res.status === 403) {
      return 'Acces refuse: OWNER ou ADMIN requis.'
    }
    const text = await res.text()
    try {
      const parsed = JSON.parse(text)
      if (parsed.errors && typeof parsed.errors === 'object') {
        return Object.entries(parsed.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ')
      }
      return parsed.message || parsed.error || parsed.detail || text
    } catch {
      return text
    }
  }

  const loadSectors = async () => {
    if (!token) return
    setListLoading(true)
    setError('')
    try {
      const res = await fetch('/api/activity-sectors?includeInactive=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      const data = await res.json()
      setSectors(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load sectors')
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    loadSectors()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingSector(null)
    setModalOpen(false)
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingSector(null)
    setModalOpen(true)
  }

  const handleEdit = (sector) => {
    setEditingSector(sector)
    setForm({
      label: sector.label || '',
      description: sector.description || '',
      active: sector.active ?? true,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.label.trim() || !form.description.trim()) {
      setError('Label et description sont requis.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const isEditing = Boolean(editingSector)
      const url = isEditing
        ? `/api/activity-sectors/${editingSector.id}`
        : '/api/activity-sectors'
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          label: form.label.trim(),
          description: form.description.trim(),
          active: form.active,
        }),
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      await loadSectors()
      resetForm()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sector) => {
    try {
      const res = await fetch(`/api/activity-sectors/${sector.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      await loadSectors()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const openDetails = async (sector) => {
    setDetailSector(sector)
    setDetailTenants([])
    setDetailOpen(true)
    setDetailLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/activity-sectors/${sector.id}/tenants`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      const data = await res.json()
      setDetailTenants(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load tenants')
    } finally {
      setDetailLoading(false)
    }
  }

  const filteredSectors = sectors.filter((sector) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = term
      ? `${sector.label} ${sector.description}`
          .toLowerCase()
          .includes(term)
      : true

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
          ? sector.active
          : !sector.active

    return matchesSearch && matchesStatus
  })

  const total = sectors.length
  const activeCount = sectors.filter((sector) => sector.active).length
  const totalTenants = sectors.reduce((sum, sector) => sum + (sector.tenantCount || 0), 0)

  return (
    <StandardPage
      className="sectors-page"
      title="Secteurs d'activite"
      badge="CATALOGUE"
      subtitle="Classez vos tenants par secteur pour mieux piloter les permissions."
      actions={(
        <div className="sectors-hero-actions">
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'grid', label: 'Grid view', icon: <FaThLarge />, ariaLabel: 'Grid view' },
              { value: 'list', label: 'List view', icon: <FaList />, ariaLabel: 'List view' },
            ]}
          />
          <Button type="button" className="sectors-add-button" onClick={openCreate}>
            Ajouter un secteur
          </Button>
        </div>
      )}
    >

      <StatsGrid
        items={[
          { key: 'total', label: 'Total', value: total },
          { key: 'active', label: 'Actifs', value: activeCount },
          { key: 'tenants', label: 'Tenants lies', value: totalTenants },
        ]}
        className="sectors-stats"
        cardClassName="sectors-stat-card"
        labelClassName="sectors-stat-label"
        valueClassName="sectors-stat-value"
      />

      <FilterBar className="sectors-filters">
        <SearchInput
          className="sectors-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un secteur..."
        />
        <div className="filter-group sectors-filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Statut</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </FilterBar>

      {error ? <p className="sectors-error">{error}</p> : null}

      <section className="sectors-list">
        <SectionHeader title="Liste des secteurs" loading={listLoading} />
        <CardGrid className="sectors-cards" list={viewMode === 'list'} size="lg">
          {filteredSectors.length === 0 ? (
            <EmptyState>Aucun secteur trouve.</EmptyState>
          ) : (
            filteredSectors.map((sector) => (
              <article key={sector.id} className="sector-card">
                <div className="sector-card-top">
                  <div className="sector-card-icon" aria-hidden="true">
                    <FaLayerGroup />
                  </div>
                  <span className={`sector-card-status ${sector.active ? 'active' : 'inactive'}`}>
                    {sector.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="sector-card-title">
                  <div className="sector-card-name">{sector.label}</div>
                  <span className="sector-card-count">
                    {sector.tenantCount || 0} tenants
                  </span>
                </div>
                <div className="sector-card-desc">{sector.description || '---'}</div>
                <div className="sector-card-meta">
                  <span>Cree: {formatDate(sector.createdAt)}</span>
                  <span>Maj: {formatDate(sector.updatedAt)}</span>
                </div>
                <div className="sector-card-actions">
                  <button
                    type="button"
                    className="sector-card-action"
                    onClick={() => openDetails(sector)}
                    aria-label="Voir details"
                  >
                    <FaEye />
                  </button>
                  <button
                    type="button"
                    className="sector-card-action"
                    onClick={() => handleEdit(sector)}
                    aria-label="Modifier"
                  >
                    <FaEdit />
                  </button>
                  <button
                    type="button"
                    className="sector-card-action danger"
                    onClick={() => setDeleteTarget(sector)}
                    aria-label="Supprimer"
                  >
                    <FaTrash />
                  </button>
                </div>
              </article>
            ))
          )}
        </CardGrid>
      </section>

      <Modal
        open={modalOpen}
        title={editingSector ? 'Modifier le secteur' : 'Ajouter un secteur'}
        onClose={resetForm}
      >
        <form className="sectors-form" onSubmit={handleSubmit}>
          <TextInput
            label="Label"
            value={form.label}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
            required
          />
          <label className="ui-field">
            <span className="ui-field-label">Description</span>
            <textarea
              className="ui-input sectors-textarea"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
          </label>
          <label className="sectors-switch">
            <span>Actif</span>
            <div className="sectors-toggle">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              />
              <span className="sectors-toggle-track" />
              <span className="sectors-toggle-thumb" />
            </div>
          </label>
          <div className="sectors-form-actions">
            <Button type="submit" disabled={loading}>
              {loading ? 'En cours...' : editingSector ? 'Mettre a jour' : 'Ajouter'}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={detailOpen}
        title="Details du secteur"
        onClose={() => {
          setDetailOpen(false)
          setDetailSector(null)
          setDetailTenants([])
        }}
      >
        <div className="sectors-detail">
          <div className="sectors-detail-header">
            <div>
              <div className="sectors-detail-title">{detailSector?.label}</div>
              <div className="sectors-detail-subtitle">{detailSector?.description || '---'}</div>
            </div>
            <span
              className={`sector-card-status ${detailSector?.active ? 'active' : 'inactive'}`}
            >
              {detailSector?.active ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <div className="sectors-detail-stats">
            <div>
              <span>Tenants attaches</span>
              <strong>{detailTenants.length}</strong>
            </div>
            <div>
              <span>Mise a jour</span>
              <strong>{formatDate(detailSector?.updatedAt)}</strong>
            </div>
          </div>

          <div className="sectors-detail-list">
            {detailLoading ? (
              <div className="sectors-detail-empty">Chargement...</div>
            ) : detailTenants.length === 0 ? (
              <div className="sectors-detail-empty">Aucun tenant rattache.</div>
            ) : (
              detailTenants.map((tenant) => {
                const isActive = tenant.status === 'ACTIVE'
                return (
                  <div key={tenant.id} className="sectors-detail-item">
                    <div>
                      <div className="sectors-detail-store">{tenant.name}</div>
                      <div className="sectors-detail-meta">
                        {tenant.subdomain ? `${tenant.subdomain} · ` : ''}
                        {tenant.defaultLocale || '---'}
                        {tenant.contactEmail ? ` · ${tenant.contactEmail}` : ''}
                      </div>
                      <div className="sectors-detail-sub">
                        {tenant.contactPhone || 'Telephone non renseigne'}
                      </div>
                    </div>
                    <span className={`sector-card-status ${isActive ? 'active' : 'inactive'}`}>
                      {tenant.status || 'INCONNU'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer le secteur"
        description={
          deleteTarget
            ? `Voulez-vous supprimer "${deleteTarget.label}" ?`
            : ''
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          await handleDelete(deleteTarget)
          setDeleteTarget(null)
        }}
      />
    </StandardPage>
  )
}

