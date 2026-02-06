import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/atoms/Button'
import EmptyState from '../../components/atoms/EmptyState'
import ConfirmDialog from '../../components/atoms/ConfirmDialog'
import Modal from '../../components/atoms/Modal'
import SearchInput from '../../components/atoms/SearchInput'
import TextInput from '../../components/atoms/TextInput'
import CardGrid from '../../components/molecules/CardGrid'
import FilterBar from '../../components/molecules/FilterBar'
import SectionHeader from '../../components/molecules/SectionHeader'
import ViewToggle from '../../components/molecules/ViewToggle'
import StoreCard from '../../components/molecules/StoreCard'
import StandardPage from '../../templates/StandardPage'
import { FaList, FaThLarge } from 'react-icons/fa'
import './StoresPage.css'

const emptyForm = {
  name: '',
  code: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  phone: '',
  email: '',
  latitude: '',
  longitude: '',
}

export default function StoresPage({ token, tenantId }) {
  const [stores, setStores] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState('')
  const resolvedTenantId = tenantId
    || (() => {
      try {
        const raw = localStorage.getItem('digimart.auth')
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed.tenantId || null
      } catch {
        return null
      }
    })()

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token],
  )

  const loadStores = async () => {
    if (!resolvedTenantId || !token) return
    setListLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/stores?tenantId=${resolvedTenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      const data = await res.json()
      setStores(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load stores')
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [resolvedTenantId, token]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setModalOpen(false)
  }

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

  const buildPayload = () => {
    const payload = {
      code: form.code || null,
      name: form.name,
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
      country: form.country,
      phone: form.phone || null,
      email: form.email || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    }

    if (!editingId) {
      payload.code = form.code
    }

    return payload
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (!token) {
        throw new Error('Session expiree. Veuillez vous reconnecter.')
      }
      if (!resolvedTenantId) {
        throw new Error('Tenant ID is missing. Please login again.')
      }
      const payload = buildPayload()
      const url = editingId ? `/api/stores/${editingId}` : '/api/stores'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      await loadStores()
      resetForm()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (store) => {
    setEditingId(store.id)
    setForm({
      name: store.name || '',
      code: store.code || '',
      address: store.address || '',
      city: store.city || '',
      postalCode: store.postalCode || '',
      country: store.country || '',
      phone: store.phone || '',
      email: store.email || '',
      latitude: store.latitude ?? '',
      longitude: store.longitude ?? '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (store) => {
    try {
      if (!token) {
        throw new Error('Session expiree. Veuillez vous reconnecter.')
      }
      const res = await fetch(`/api/stores/${store.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      await loadStores()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const handleToggleActive = async (store) => {
    try {
      if (!token) {
        throw new Error('Session expiree. Veuillez vous reconnecter.')
      }
      const action = store.active ? 'deactivate' : 'activate'
      const res = await fetch(`/api/stores/${store.id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      await loadStores()
    } catch (err) {
      setError(err.message || 'Update failed')
    }
  }

  const cities = Array.from(
    new Set(stores.map((store) => store.city).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b))

  const filteredStores = stores.filter((store) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = term
      ? `${store.name} ${store.code} ${store.address} ${store.city} ${store.postalCode}`
          .toLowerCase()
          .includes(term)
      : true

    const matchesCity =
      cityFilter === 'all' ? true : store.city === cityFilter

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
          ? store.active
          : !store.active

    return matchesSearch && matchesCity && matchesStatus
  })

  return (
    <StandardPage
      className="stores-page"
      title="Magasins & Points de Vente"
      badge="MULTI-STORE"
      subtitle="Gerez vos points de vente physiques, entrepots et boutiques."
      actions={(
        <div className="stores-hero-actions">
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'grid', label: 'Grid view', icon: <FaThLarge />, ariaLabel: 'Grid view' },
              { value: 'list', label: 'List view', icon: <FaList />, ariaLabel: 'List view' },
            ]}
          />
          <Button type="button" className="stores-add-button" onClick={() => setModalOpen(true)}>
            Ajouter un magasin
          </Button>
        </div>
      )}
    >

      <FilterBar className="stores-filters">
        <SearchInput
          className="stores-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, ville, code..."
        />
        <div className="filter-group stores-filter-group">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          >
            <option value="all">Ville</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Statut</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </FilterBar>

      <Modal
        open={modalOpen}
        title={editingId ? 'Modifier le magasin' : 'Ajouter un magasin'}
        onClose={resetForm}
      >
        <form onSubmit={handleSubmit} className="stores-grid">
          <TextInput
            label="Nom"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
          <TextInput
            label="Code"
            value={form.code}
            onChange={(e) => handleChange('code', e.target.value)}
            required={!editingId}
          />
          <TextInput
            label="Adresse"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            required
          />
          <TextInput
            label="Ville"
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            required
          />
          <TextInput
            label="Code postal"
            value={form.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            required
          />
          <TextInput
            label="Pays"
            value={form.country}
            onChange={(e) => handleChange('country', e.target.value)}
            required
          />
          <TextInput
            label="Telephone"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
          <TextInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
          <TextInput
            label="Latitude"
            value={form.latitude}
            onChange={(e) => handleChange('latitude', e.target.value)}
          />
          <TextInput
            label="Longitude"
            value={form.longitude}
            onChange={(e) => handleChange('longitude', e.target.value)}
          />
          <div className="stores-form-actions">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update store' : 'Create store'}
            </Button>
            <Button variant="secondary" type="button" onClick={resetForm}>
              Annuler
            </Button>
          </div>
        </form>
        {error ? <p className="stores-error">{error}</p> : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Supprimer le magasin"
        description={
          deleteTarget
            ? `Voulez-vous supprimer "${deleteTarget.name}" ?`
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

      <section className="stores-list">
        <SectionHeader title="Liste des magasins" loading={listLoading} />
        <CardGrid className="stores-cards" list={viewMode === 'list'} size="lg">
          {filteredStores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onEdit={handleEdit}
              onDelete={(item) => setDeleteTarget(item)}
              onToggleActive={handleToggleActive}
            />
          ))}
          {filteredStores.length === 0 ? (
            <EmptyState className="stores-empty">Aucun magasin trouve.</EmptyState>
          ) : null}
        </CardGrid>
      </section>
    </StandardPage>
  )
}



