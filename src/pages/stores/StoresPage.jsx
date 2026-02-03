import { useEffect, useMemo, useState } from 'react'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Modal from '../../components/ui/Modal'
import TextInput from '../../components/ui/TextInput'
import StoreCard from '../../components/stores/StoreCard'
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
  }, [resolvedTenantId, token])

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
      const saved = await res.json()

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
    <div className="stores-page">
      <header className="stores-header">
        <div className="stores-hero">
          <div className="stores-hero-title">
            <h2>Magasins & Points de Vente</h2>
            <span className="stores-hero-badge">MULTI-STORE</span>
          </div>
          <p>Gerez vos points de vente physiques, entrepots et boutiques.</p>
        </div>
        <div className="stores-hero-actions">
          <button
            type="button"
            className={`stores-view-button ${viewMode === 'grid' ? 'active' : ''}`}
            aria-label="Grid view"
            onClick={() => setViewMode('grid')}
          >
            <FaThLarge />
          </button>
          <button
            type="button"
            className={`stores-view-button ${viewMode === 'list' ? 'active' : ''}`}
            aria-label="List view"
            onClick={() => setViewMode('list')}
          >
            <FaList />
          </button>
          <Button type="button" className="stores-add-button" onClick={() => setModalOpen(true)}>
            Ajouter un magasin
          </Button>
        </div>
      </header>

      <div className="stores-filters">
        <div className="stores-search">
          <input
            type="search"
            placeholder="Rechercher par nom, ville, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="stores-filter-group">
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
      </div>

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
        <div className="stores-list-header">
          <h3>Liste des magasins</h3>
          {listLoading ? <span className="stores-loading">Loading...</span> : null}
        </div>
        <div className={`stores-cards ${viewMode === 'list' ? 'list' : ''}`}>
          {filteredStores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onEdit={handleEdit}
              onDelete={(item) => setDeleteTarget(item)}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
