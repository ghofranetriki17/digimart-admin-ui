import { useEffect, useMemo, useState } from 'react'
import {
  FaChevronLeft,
  FaEnvelope,
  FaLayerGroup,
  FaList,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaStore,
  FaThLarge,
  FaUserShield,
  FaUsers,
} from 'react-icons/fa'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Button from '../../components/atoms/Button'
import EmptyState from '../../components/atoms/EmptyState'
import Modal from '../../components/atoms/Modal'
import SearchInput from '../../components/atoms/SearchInput'
import TextInput from '../../components/atoms/TextInput'
import CardGrid from '../../components/molecules/CardGrid'
import FilterBar from '../../components/molecules/FilterBar'
import StatsGrid from '../../components/molecules/StatsGrid'
import ViewToggle from '../../components/molecules/ViewToggle'
import StandardPage from '../../templates/StandardPage'
import './AdminTenantsPage.css'

const markerIcon = new L.Icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const FALLBACK_CENTER = [34.8, 10.2]

export default function AdminTenantsPage({ token }) {
  const [tenants, setTenants] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subStatus, setSubStatus] = useState({}) // { [tenantId]: { planId, planName } }
  const [rowLoading, setRowLoading] = useState({})
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [statusFilter, setStatusFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const [selectedTenantId, setSelectedTenantId] = useState(null)
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [tenantDetails, setTenantDetails] = useState(null)
  const [tenantUsers, setTenantUsers] = useState([])
  const [showStaff, setShowStaff] = useState(true)
  const [tenantStores, setTenantStores] = useState([])
  const [tenantWallet, setTenantWallet] = useState(null)
  const [tenantTxns, setTenantTxns] = useState([])
  const [walletMode, setWalletMode] = useState('CREDIT')
  const [walletAmount, setWalletAmount] = useState('')
  const [walletReason, setWalletReason] = useState('')
  const [walletReference, setWalletReference] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletProcessing, setWalletProcessing] = useState(false)
  const [walletError, setWalletError] = useState('')
  const [storeDetailOpen, setStoreDetailOpen] = useState(false)
  const [storeDetail, setStoreDetail] = useState(null)
  const [storeMapExpanded, setStoreMapExpanded] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  const auth = { Authorization: `Bearer ${token}` }

  const statusFor = (tenant) => {
    const raw = String(tenant?.status || '').toLowerCase()
    if (['inactive', 'disabled', 'suspended'].includes(raw)) {
      return { label: 'Inactif', tone: 'inactive' }
    }
    if (raw === 'pending') {
      return { label: 'En attente', tone: 'pending' }
    }
    return { label: 'Actif', tone: 'active' }
  }

  const initialsFor = (name) => {
    if (!name) return 'TN'
    const parts = String(name).trim().split(' ')
    const first = parts[0]?.[0] || ''
    const second = parts[1]?.[0] || ''
    const initials = `${first}${second}`.trim()
    return initials ? initials.toUpperCase() : String(name).slice(0, 2).toUpperCase()
  }

  const roleLabel = (user) => {
    const roles = user?.roles || []
    if (roles.includes('OWNER')) return 'OWNER'
    if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) return 'ADMIN'
    return 'USER'
  }

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
      const safeTenants = Array.isArray(tenantsData) ? tenantsData : []
      setTenants(safeTenants)

      const plansData = pRes.ok ? await pRes.json() : []
      setPlans(Array.isArray(plansData) ? plansData : [])

      const statuses = {}
      await Promise.all(
        safeTenants.map(async (t) => {
          const subRes = await fetch(`/api/admin/tenants/${t.id}/subscriptions/current`, { headers: auth })
          if (subRes.ok) {
            const sub = await subRes.json()
            statuses[t.id] = {
              planId: sub.planId,
              planName: sub.planName || sub.planCode || 'Aucun',
            }
          } else {
            statuses[t.id] = null
          }
        }),
      )
      setSubStatus(statuses)
    } catch (err) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const loadTenantDetails = async (tenantId) => {
    if (!tenantId) return
    setDetailLoading(true)
    setDetailError('')
    try {
      const [tenantRes, usersRes, storesRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}`, { headers: auth }),
        fetch(`/api/users?tenantId=${tenantId}`, { headers: auth }),
        fetch(`/api/stores?tenantId=${tenantId}`, { headers: auth }),
      ])

      const tenantData = tenantRes.ok ? await tenantRes.json() : null
      const usersData = usersRes.ok ? await usersRes.json() : []
      const storesData = storesRes.ok ? await storesRes.json() : []

      if (tenantRes.ok) {
        setTenantDetails(tenantData)
      }
      setTenantUsers(Array.isArray(usersData) ? usersData : [])
      setTenantStores(Array.isArray(storesData) ? storesData : [])

      if (!tenantRes.ok && !usersRes.ok && !storesRes.ok) {
        setDetailError('Impossible de charger les details du tenant')
      }

      await loadTenantWallet(tenantId)
    } catch (err) {
      setDetailError(err.message || 'Impossible de charger les details du tenant')
    } finally {
      setDetailLoading(false)
    }
  }

  const loadTenantWallet = async (tenantId) => {
    if (!tenantId) return
    setWalletLoading(true)
    setWalletError('')
    try {
      const walletRes = await fetch(`/api/tenants/${tenantId}/wallet`, { headers: auth })
      if (!walletRes.ok) {
        throw new Error('Wallet introuvable')
      }
      const walletData = await walletRes.json()
      setTenantWallet(walletData)
      const txRes = await fetch(`/api/tenants/${tenantId}/wallet/transactions`, { headers: auth })
      const txData = txRes.ok ? await txRes.json() : []
      setTenantTxns(Array.isArray(txData) ? txData : [])
    } catch (err) {
      setTenantWallet(null)
      setTenantTxns([])
      setWalletError(err.message || 'Impossible de charger le wallet')
    } finally {
      setWalletLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const syncView = () => {
      if (media.matches) {
        setViewMode('grid')
      }
    }
    syncView()
    media.addEventListener('change', syncView)
    return () => media.removeEventListener('change', syncView)
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
      if (selectedTenantId === tenantId) {
        await loadTenantDetails(tenantId)
      }
    } finally {
      setRowLoading((prev) => ({ ...prev, [tenantId]: false }))
    }
  }

  const openDetails = (tenant) => {
    setSelectedTenantId(tenant.id)
    setSelectedTenant(tenant)
    setTenantDetails(null)
    setTenantUsers([])
    setTenantStores([])
    loadTenantDetails(tenant.id)
  }

  const closeDetails = () => {
    setSelectedTenantId(null)
    setSelectedTenant(null)
    setTenantDetails(null)
    setTenantUsers([])
    setTenantStores([])
    setDetailError('')
    setTenantWallet(null)
    setTenantTxns([])
    setWalletError('')
    setWalletAmount('')
    setWalletReason('')
    setWalletReference('')
    setWalletMode('CREDIT')
    setShowStaff(true)
  }

  const openStoreDetails = (store) => {
    setStoreDetail(store)
    setStoreDetailOpen(true)
    setStoreMapExpanded(false)
  }

  const submitWalletAdjustment = async () => {
    if (!selectedTenantId) return
    if (!walletAmount) {
      setWalletError('Montant requis')
      return
    }
    setWalletProcessing(true)
    setWalletError('')
    try {
      const endpoint = walletMode === 'DEBIT' ? 'debit' : 'credit'
      const res = await fetch(`/api/tenants/${selectedTenantId}/wallet/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({
          amount: parseFloat(walletAmount || '0'),
          reason: walletReason,
          reference: walletReference,
        }),
      })
      if (!res.ok) throw new Error('Operation impossible')
      setWalletAmount('')
      setWalletReason('')
      setWalletReference('')
      await loadTenantWallet(selectedTenantId)
    } catch (err) {
      setWalletError(err.message || 'Operation impossible')
    } finally {
      setWalletProcessing(false)
    }
  }

  const closeStoreDetails = () => {
    setStoreDetailOpen(false)
    setStoreDetail(null)
    setStoreMapExpanded(false)
  }

  const filteredTenants = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tenants.filter((tenant) => {
      const matchesSearch = term
        ? `${tenant.name || ''} ${tenant.subdomain || ''}`
            .toLowerCase()
            .includes(term)
        : true

      const status = statusFor(tenant).tone
      const matchesStatus =
        statusFilter === 'all' ? true : status === statusFilter

      const currentPlanId = subStatus[tenant.id]?.planId
      const matchesPlan =
        planFilter === 'all'
          ? true
          : Number(planFilter) === Number(currentPlanId)

      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [tenants, search, statusFilter, planFilter, subStatus])

  const totalCount = tenants.length
  const activeCount = tenants.filter((tenant) => statusFor(tenant).tone === 'active').length
  const withPlanCount = tenants.filter((tenant) => subStatus[tenant.id]).length
  const withoutPlanCount = totalCount - withPlanCount

  const summaryTenant = tenantDetails || selectedTenant || {}
  const currentPlan = selectedTenantId ? subStatus[selectedTenantId] : null
  const usersActiveCount = tenantUsers.filter((user) => user.enabled).length
  const owners = tenantUsers.filter((user) => roleLabel(user) === 'OWNER')
  const staffMembers = tenantUsers.filter((user) => roleLabel(user) !== 'OWNER')
  const storesWithCoords = useMemo(
    () =>
      tenantStores.filter((store) => {
        const lat = Number(store.latitude)
        const lng = Number(store.longitude)
        return Number.isFinite(lat) && Number.isFinite(lng)
      }),
    [tenantStores],
  )
  const mapCenter = useMemo(() => {
    if (storesWithCoords.length === 0) return FALLBACK_CENTER
    const sum = storesWithCoords.reduce(
      (acc, store) => {
        const lat = Number(store.latitude)
        const lng = Number(store.longitude)
        return { lat: acc.lat + lat, lng: acc.lng + lng }
      },
      { lat: 0, lng: 0 },
    )
    return [sum.lat / storesWithCoords.length, sum.lng / storesWithCoords.length]
  }, [storesWithCoords])
  const mapBounds = useMemo(() => {
    if (storesWithCoords.length === 0) return null
    return L.latLngBounds(
      storesWithCoords.map((store) => [
        Number(store.latitude),
        Number(store.longitude),
      ]),
    )
  }, [storesWithCoords])
  const primaryStore = storesWithCoords[0]
  const directionsUrl = primaryStore
    ? `https://www.google.com/maps/dir/?api=1&destination=${Number(primaryStore.latitude)},${Number(primaryStore.longitude)}`
    : ''
  const storeHasCoords = storeDetail
    ? Number.isFinite(Number(storeDetail.latitude))
      && Number.isFinite(Number(storeDetail.longitude))
    : false
  const storeDirectionsUrl = storeHasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${Number(storeDetail.latitude)},${Number(storeDetail.longitude)}`
    : ''

  return (
    <StandardPage
      className="admin-tenants-page"
      title="Tenants & abonnements"
      badge="SUPER ADMIN"
      subtitle="Gerez les tenants, leurs abonnements et accedez aux details en un clic."
      actions={(
        !selectedTenantId ? (
          <div className="admin-tenants-hero-actions">
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              options={[
                { value: 'grid', label: 'Vue grille', icon: <FaThLarge />, ariaLabel: 'Vue grille' },
                { value: 'list', label: 'Vue liste', icon: <FaList />, ariaLabel: 'Vue liste' },
              ]}
            />
          </div>
        ) : null
      )}
    >

      {loading ? <div className="admin-tenants-status">Chargement...</div> : null}
      {error ? <div className="admin-tenants-error">{error}</div> : null}

      {selectedTenantId ? (
        <section className="tenant-details">
          <button type="button" className="tenant-details-back" onClick={closeDetails}>
            <FaChevronLeft /> Retour aux tenants
          </button>

          <div className="tenant-details-hero">
            <div className="tenant-details-title">
              <div className="tenant-details-avatar">{initialsFor(summaryTenant.name)}</div>
              <div>
                <div className="tenant-details-name">{summaryTenant.name || 'Tenant'}</div>
                <div className="tenant-details-sub">{summaryTenant.subdomain || '---'}</div>
              </div>
            </div>
            <div className="tenant-details-tags">
              <span className={`tenant-card-status ${statusFor(summaryTenant).tone}`}>
                {statusFor(summaryTenant).label}
              </span>
              <span className="tenant-tag">Plan: {currentPlan?.planName || 'Aucun'}</span>
              {summaryTenant.defaultLocale ? (
                <span className="tenant-tag">Locale: {summaryTenant.defaultLocale}</span>
              ) : null}
            </div>
          </div>

          {detailLoading ? (
            <div className="admin-tenants-status">Chargement des details...</div>
          ) : null}
          {detailError ? <div className="admin-tenants-error">{detailError}</div> : null}

          <div className="tenant-details-metrics">
            <div className="metric-card">
              <span className="metric-icon">
                <FaUsers />
              </span>
              <div>
                <div className="metric-label">Utilisateurs</div>
                <div className="metric-value">{tenantUsers.length}</div>
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-icon">
                <FaUserShield />
              </span>
              <div>
                <div className="metric-label">Actifs</div>
                <div className="metric-value">{usersActiveCount}</div>
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-icon">
                <FaStore />
              </span>
              <div>
                <div className="metric-label">Magasins</div>
                <div className="metric-value">{tenantStores.length}</div>
              </div>
            </div>
            <div className="metric-card">
              <span className="metric-icon">$</span>
              <div>
                <div className="metric-label">Abonnement</div>
                <div className="metric-value">{currentPlan?.planName || 'Aucun'}</div>
              </div>
            </div>
          </div>

          <div className="tenant-details-panels">
            <div className="tenant-details-panel">
              <h4>Informations</h4>
              <div className="tenant-info-list">
                <div className="tenant-info-item">
                  <span className="tenant-info-icon">
                    <FaEnvelope />
                  </span>
                  <div>
                    <div className="tenant-info-label">Email</div>
                    <div className="tenant-info-value">
                      {summaryTenant.contactEmail || summaryTenant.email || 'Non renseigne'}
                    </div>
                  </div>
                </div>
                <div className="tenant-info-item">
                  <span className="tenant-info-icon">
                    <FaPhoneAlt />
                  </span>
                  <div>
                    <div className="tenant-info-label">Telephone</div>
                    <div className="tenant-info-value">
                      {summaryTenant.contactPhone || summaryTenant.phone || 'Non renseigne'}
                    </div>
                  </div>
                </div>
                <div className="tenant-info-item">
                  <span className="tenant-info-icon">
                    <FaLayerGroup />
                  </span>
                  <div>
                    <div className="tenant-info-label">Secteur</div>
                    <div className="tenant-info-value">
                      {summaryTenant.sectorLabel
                        || summaryTenant.sectorName
                        || (summaryTenant.sectorId ? `Secteur #${summaryTenant.sectorId}` : 'Non renseigne')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tenant-details-panel">
              <div className="tenant-details-panel-head">
                <h4>Abonnement</h4>
                <span className={`tenant-plan-pill ${currentPlan ? 'active' : 'inactive'}`}>
                  {currentPlan ? 'Plan actif' : 'Aucun plan'}
                </span>
              </div>
              <div className="tenant-current">
                <span className="tenant-label">Plan actuel</span>
                <strong>{currentPlan?.planName || 'Aucun'}</strong>
              </div>
              <div className="tenant-planlist">
                {plans.map((plan) => {
                  const isOn = currentPlan?.planId === plan.id
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      className={`tenant-toggle ${isOn ? 'on' : 'off'}`}
                      disabled={rowLoading[selectedTenantId]}
                      onClick={() => {
                        if (!isOn) activate(selectedTenantId, plan.id)
                      }}
                    >
                      <span className="toggle-dot" />
                      <span className="toggle-label">
                        {plan.name} ({plan.price} {plan.currency})
                      </span>
                    </button>
                  )
                })}
              </div>
              {rowLoading[selectedTenantId] ? (
                <div className="tenant-row-loading">Mise a jour...</div>
              ) : null}
            </div>
          </div>

          <div className="tenant-details-section">
            <div className="tenant-details-section-header">
              <h3>Utilisateurs</h3>
              <span className="tenant-details-section-count">{tenantUsers.length} total</span>
            </div>
            {owners.length === 0 ? (
              <div className="admin-tenants-empty">Aucun owner defini pour ce tenant.</div>
            ) : (
              <div className="tenant-users-grid">
                {owners.map((user) => (
                  <div key={user.id} className="tenant-user-card owner">
                    <div className="tenant-user-avatar">
                      {initialsFor(`${user.firstName || ''} ${user.lastName || ''}`)}
                    </div>
                    <div className="tenant-user-info">
                      <div className="tenant-user-name">
                        {user.firstName || 'User'} {user.lastName || ''}
                      </div>
                      <div className="tenant-user-email">{user.email || '---'}</div>
                    </div>
                    <span className={`tenant-user-role ${roleLabel(user).toLowerCase()}`}>
                      {roleLabel(user)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="tenant-staff">
              <button
                type="button"
                className="tenant-staff-toggle"
                onClick={() => setShowStaff((prev) => !prev)}
                aria-expanded={showStaff}
              >
                Equipe ({staffMembers.length})
                <span className={`tenant-staff-chevron ${showStaff ? 'open' : ''}`}>v</span>
              </button>
              {showStaff ? (
                <div className="tenant-users-grid">
                  {staffMembers.map((user) => (
                    <div key={user.id} className="tenant-user-card">
                      <div className="tenant-user-avatar">
                        {initialsFor(`${user.firstName || ''} ${user.lastName || ''}`)}
                      </div>
                      <div className="tenant-user-info">
                        <div className="tenant-user-name">
                          {user.firstName || 'User'} {user.lastName || ''}
                        </div>
                        <div className="tenant-user-email">{user.email || '---'}</div>
                      </div>
                      <span className={`tenant-user-role ${roleLabel(user).toLowerCase()}`}>
                        {roleLabel(user)}
                      </span>
                    </div>
                  ))}
                  {staffMembers.length === 0 ? (
                    <div className="admin-tenants-empty">Aucun membre d'equipe.</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="tenant-details-section">
            <div className="tenant-details-section-header">
              <h3>Magasins</h3>
              <span className="tenant-details-section-count">{tenantStores.length} total</span>
            </div>
            <div className="tenant-stores-layout">
              <div className="tenant-stores-list">
                <div className="tenant-stores-grid">
                  {tenantStores.map((store) => (
                    <div
                      key={store.id}
                      className="tenant-store-mini clickable"
                      role="button"
                      tabIndex={0}
                      aria-label={`Voir details magasin ${store.name || 'magasin'}`}
                      onClick={() => openStoreDetails(store)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openStoreDetails(store)
                        }
                      }}
                    >
                      <div className="tenant-store-mini-head">
                        <div className="tenant-store-mini-icon">
                          <FaStore />
                        </div>
                        <div className="tenant-store-mini-title">
                          <div className="tenant-store-mini-name">{store.name}</div>
                          <div className="tenant-store-mini-sub">{store.code}</div>
                        </div>
                        <span className={`tenant-card-status ${store.active ? 'active' : 'inactive'}`}>
                          {store.active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="tenant-store-mini-body">
                        <div className="tenant-store-mini-row">
                          <FaMapMarkerAlt />
                          <span>{store.city || 'Ville non renseignee'}</span>
                        </div>
                        <div className="tenant-store-mini-row">
                          <FaPhoneAlt />
                          <span>{store.phone || '---'}</span>
                        </div>
                        <div className="tenant-store-mini-row">
                          <FaEnvelope />
                          <span>{store.email || '---'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {tenantStores.length === 0 ? (
                    <div className="admin-tenants-empty">Aucun magasin pour ce tenant.</div>
                  ) : null}
                </div>
              </div>
              <div className="tenant-stores-map">
                <div className="tenant-map-header">
                  <span>Carte des magasins</span>
                  <div className="tenant-map-actions">
                    <span className="tenant-map-count">
                      {storesWithCoords.length} geolocalise(s)
                    </span>
                    <a
                      className={`tenant-map-action ${primaryStore ? '' : 'disabled'}`}
                      href={directionsUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(event) => {
                        if (!primaryStore) {
                          event.preventDefault()
                          return
                        }
                        event.stopPropagation()
                      }}
                    >
                      Voir itineraire
                    </a>
                  </div>
                </div>
                {storesWithCoords.length > 0 ? (
                  <MapContainer
                    className="tenant-map-frame"
                    bounds={mapBounds}
                    boundsOptions={{ padding: [20, 20] }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {storesWithCoords.map((store) => (
                      <Marker
                        key={store.id}
                        position={[Number(store.latitude), Number(store.longitude)]}
                        icon={markerIcon}
                      >
                        <Popup>
                          <strong>{store.name}</strong>
                          <br />
                          {store.address || 'Adresse non renseignee'}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                ) : (
                  <MapContainer
                    className="tenant-map-frame"
                    center={mapCenter}
                    zoom={6}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </MapContainer>
                )}
                {storesWithCoords.length === 0 ? (
                  <div className="tenant-map-note">
                    Aucun magasin avec latitude/longitude. Carte par defaut.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="tenant-details-section">
            <div className="tenant-details-section-header">
              <h3>Wallet</h3>
              <span className="tenant-details-section-count">
                {tenantWallet?.currency || ''}
              </span>
            </div>
            {walletLoading ? (
              <div className="tenant-wallet-status">Chargement...</div>
            ) : null}
            {walletError ? (
              <div className="tenant-wallet-error">{walletError}</div>
            ) : null}
            {tenantWallet ? (
              <div className="tenant-wallet-summary">
                <div>
                  <div className="tenant-wallet-label">Solde</div>
                  <div className="tenant-wallet-amount">
                    {tenantWallet.balance} {tenantWallet.currency}
                  </div>
                </div>
                <div>
                  <div className="tenant-wallet-label">Statut</div>
                  <div
                    className={`tenant-wallet-pill status-${tenantWallet.status?.toLowerCase()}`}
                  >
                    {tenantWallet.status}
                  </div>
                </div>
                <div>
                  <div className="tenant-wallet-label">Derniere transaction</div>
                  <div>{tenantWallet.lastTransactionAt || '—'}</div>
                </div>
              </div>
            ) : null}

            <div className="tenant-wallet-actions">
              <label className="tenant-wallet-toggle">
                <input
                  type="radio"
                  name="walletMode"
                  value="CREDIT"
                  checked={walletMode === 'CREDIT'}
                  onChange={() => setWalletMode('CREDIT')}
                />
                Crediter
              </label>
              <label className="tenant-wallet-toggle">
                <input
                  type="radio"
                  name="walletMode"
                  value="DEBIT"
                  checked={walletMode === 'DEBIT'}
                  onChange={() => setWalletMode('DEBIT')}
                />
                Debiter
              </label>
            </div>

            <div className="tenant-wallet-form">
              <TextInput
                label="Montant"
                type="number"
                step="0.01"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
              />
              <TextInput
                label="Raison"
                value={walletReason}
                onChange={(e) => setWalletReason(e.target.value)}
              />
              <TextInput
                label="Reference"
                value={walletReference}
                onChange={(e) => setWalletReference(e.target.value)}
              />
              <Button
                variant="primary"
                disabled={walletProcessing}
                onClick={submitWalletAdjustment}
              >
                {walletProcessing
                  ? 'Traitement...'
                  : walletMode === 'DEBIT'
                    ? 'Debiter'
                    : 'Crediter'}
              </Button>
            </div>

            <div className="tenant-wallet-table">
              <div className="tenant-wallet-table-head">
                <div>Date</div>
                <div>Type</div>
                <div>Montant</div>
                <div>Avant</div>
                <div>Apres</div>
                <div>Raison</div>
                <div>Ref</div>
              </div>
              {tenantTxns.map((txn) => (
                <div key={txn.id} className="tenant-wallet-table-row">
                  <div>{txn.transactionDate}</div>
                  <div>{txn.type}</div>
                  <div>{txn.amount}</div>
                  <div>{txn.balanceBefore}</div>
                  <div>{txn.balanceAfter}</div>
                  <div>{txn.reason}</div>
                  <div>{txn.reference || '—'}</div>
                </div>
              ))}
              {tenantTxns.length === 0 ? (
                <div className="tenant-wallet-empty">Aucune transaction</div>
              ) : null}
            </div>
          </div>

          <Modal
            open={storeDetailOpen}
            title={storeDetail?.name || 'Details du magasin'}
            onClose={closeStoreDetails}
          >
            {storeDetail ? (
              <div className="store-detail">
                <div className="store-detail-header">
                  <div className="store-detail-icon">
                    <FaStore />
                  </div>
                  <div>
                    <div className="store-detail-name">{storeDetail.name}</div>
                    <div className="store-detail-code">{storeDetail.code || '---'}</div>
                  </div>
                  <span className={`tenant-card-status ${storeDetail.active ? 'active' : 'inactive'}`}>
                    {storeDetail.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="store-detail-grid">
                  <div className="store-detail-item">
                    <div className="store-detail-badge">
                      <span className="store-detail-icon">
                        <FaMapMarkerAlt />
                      </span>
                      <span>Adresse</span>
                    </div>
                    <div className="store-detail-value-chip">
                      {storeDetail.address || 'Non renseignee'}
                    </div>
                  </div>
                  <div className="store-detail-item">
                    <div className="store-detail-badge">
                      <span className="store-detail-icon">
                        <FaMapMarkerAlt />
                      </span>
                      <span>Ville</span>
                    </div>
                    <div className="store-detail-value-chip">
                      {storeDetail.city || 'Non renseignee'}
                    </div>
                  </div>
                  <div className="store-detail-item">
                    <div className="store-detail-badge">
                      <span className="store-detail-icon">#</span>
                      <span>Code postal</span>
                    </div>
                    <div className="store-detail-value-chip">
                      {storeDetail.postalCode || '---'}
                    </div>
                  </div>
                  <div className="store-detail-item">
                    <div className="store-detail-badge">
                      <span className="store-detail-icon">
                        <FaLayerGroup />
                      </span>
                      <span>Pays</span>
                    </div>
                    <div className="store-detail-value-chip">
                      {storeDetail.country || '---'}
                    </div>
                  </div>
                  <div className="store-detail-item">
                    <div className="store-detail-badge">
                      <span className="store-detail-icon">
                        <FaPhoneAlt />
                      </span>
                      <span>Telephone</span>
                    </div>
                    <div className="store-detail-value-chip">
                      {storeDetail.phone || '---'}
                    </div>
                  </div>
                  <div className="store-detail-item">
                    <div className="store-detail-badge">
                      <span className="store-detail-icon">
                        <FaEnvelope />
                      </span>
                      <span>Email</span>
                    </div>
                    <div className="store-detail-value-chip">
                      {storeDetail.email || '---'}
                    </div>
                  </div>
                  <div className="store-detail-item">
                    <div className="store-detail-badge">
                      <span className="store-detail-icon">Lat</span>
                      <span>Latitude</span>
                    </div>
                    <div className="store-detail-value-chip">
                      {storeDetail.latitude ?? '---'}
                    </div>
                  </div>
                  <div className="store-detail-item">
                    <div className="store-detail-badge">
                      <span className="store-detail-icon">Lng</span>
                      <span>Longitude</span>
                    </div>
                    <div className="store-detail-value-chip">
                      {storeDetail.longitude ?? '---'}
                    </div>
                  </div>
                </div>
                <div className={`store-detail-map ${storeMapExpanded ? 'expanded' : ''}`}>
                  <div className="store-detail-map-header">
                    <span>Localisation du magasin</span>
                    <div className="store-detail-map-actions">
                      <button
                        type="button"
                        className="store-detail-map-action"
                        onClick={() => setStoreMapExpanded((prev) => !prev)}
                      >
                        {storeMapExpanded ? 'Carte standard' : 'Voir grande carte'}
                      </button>
                      <a
                        className={`store-detail-map-action ${storeHasCoords ? '' : 'disabled'}`}
                        href={storeDirectionsUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => {
                          if (!storeHasCoords) {
                            event.preventDefault()
                          }
                        }}
                      >
                        Voir itineraire
                      </a>
                    </div>
                  </div>
                  {storeHasCoords ? (
                    <MapContainer
                      className="store-detail-map-frame"
                      center={[Number(storeDetail.latitude), Number(storeDetail.longitude)]}
                      zoom={13}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker
                        position={[Number(storeDetail.latitude), Number(storeDetail.longitude)]}
                        icon={markerIcon}
                      >
                        <Popup>
                          <strong>{storeDetail.name}</strong>
                          <br />
                          {storeDetail.address || 'Adresse non renseignee'}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <MapContainer
                      className="store-detail-map-frame"
                      center={FALLBACK_CENTER}
                      zoom={6}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                    </MapContainer>
                  )}
                  {!storeHasCoords ? (
                    <div className="store-detail-map-note">
                      Aucun magasin avec latitude/longitude. Carte par defaut.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </Modal>
        </section>
      ) : (
        <>
          <div className="admin-tenants-toolbar">
            <StatsGrid
              className="admin-tenants-stats"
              items={[
                { key: 'total', label: 'Tenants', value: totalCount },
                { key: 'active', label: 'Actifs', value: activeCount },
                { key: 'noplan', label: 'Sans plan', value: withoutPlanCount },
              ]}
              cardClassName="admin-stat-card"
              labelClassName="admin-stat-label"
              valueClassName="admin-stat-value"
            />
          </div>

          <FilterBar className="admin-tenants-filters">
            <SearchInput
              className="admin-tenants-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou sous-domaine..."
            />
            <div className="filter-group admin-tenants-filter-group">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Statut: Tous</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="pending">En attente</option>
              </select>
              <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                <option value="all">Plan: Tous</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={String(plan.id)}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
          </FilterBar>

          <CardGrid className="admin-tenants-grid" list={viewMode === 'list'} size="lg">
            {filteredTenants.map((tenant) => {
              const current = subStatus[tenant.id]
              const status = statusFor(tenant)
              const phone = tenant.contactPhone || tenant.phone
              const email = tenant.contactEmail || tenant.email
              return (
                <article
                  key={tenant.id}
                  className="tenant-store-card clickable"
                  role="button"
                  tabIndex={0}
                  aria-label={`Voir details ${tenant.name || 'tenant'}`}
                  onClick={() => openDetails(tenant)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openDetails(tenant)
                    }
                  }}
                >
                  <div className="tenant-store-card-top">
                    <div className="tenant-store-icon">{initialsFor(tenant.name)}</div>
                    <div className="tenant-store-top-badges">
                      <span className={`tenant-card-status ${status.tone}`}>{status.label}</span>
                      <span className="tenant-plan-badge compact">
                        {current?.planName || 'Aucun plan'}
                      </span>
                    </div>
                  </div>
                  <div className="tenant-store-card-title">
                    <div className="tenant-store-name">{tenant.name}</div>
                    <span className="tenant-store-sub">{tenant.subdomain || '---'}</span>
                  </div>
                  <div className="tenant-store-meta">
                    <div className="tenant-store-meta-item contact">
                      <div className="tenant-meta-content">
                        <div className="tenant-meta-inline">
                          {phone ? (
                            <a
                              className="tenant-meta-action"
                              href={`tel:${phone}`}
                              aria-label={`Appeler ${tenant.name || 'tenant'}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <FaPhoneAlt />
                            </a>
                          ) : (
                            <span className="tenant-meta-action disabled" aria-hidden="true">
                              <FaPhoneAlt />
                            </span>
                          )}
                          {email ? (
                            <a
                              className="tenant-meta-action"
                              href={`mailto:${email}`}
                              aria-label={`Envoyer un email a ${tenant.name || 'tenant'}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <FaEnvelope />
                            </a>
                          ) : (
                            <span className="tenant-meta-action disabled" aria-hidden="true">
                              <FaEnvelope />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}

            {tenants.length === 0 ? (
              <EmptyState className="admin-tenants-empty">Aucun tenant</EmptyState>
            ) : null}
            {tenants.length > 0 && filteredTenants.length === 0 ? (
              <EmptyState className="admin-tenants-empty">Aucun tenant pour cette recherche.</EmptyState>
            ) : null}
          </CardGrid>
        </>
      )}
    </StandardPage>
  )
}

