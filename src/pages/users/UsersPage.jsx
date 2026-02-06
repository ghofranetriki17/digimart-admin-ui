import { useEffect, useMemo, useState } from 'react'
import { FaList, FaThLarge, FaUserPlus } from 'react-icons/fa'
import Button from '../../components/atoms/Button'
import EmptyState from '../../components/atoms/EmptyState'
import Modal from '../../components/atoms/Modal'
import SearchInput from '../../components/atoms/SearchInput'
import TextInput from '../../components/atoms/TextInput'
import CardGrid from '../../components/molecules/CardGrid'
import FilterBar from '../../components/molecules/FilterBar'
import StatsGrid from '../../components/molecules/StatsGrid'
import ViewToggle from '../../components/molecules/ViewToggle'
import UserCard from '../../components/molecules/UserCard'
import StandardPage from '../../templates/StandardPage'
import './UsersPage.css'

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  imageUrl: '',
  enabled: true,
}

export default function UsersPage({ token, tenantId }) {
  const [users, setUsers] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [roleManagerOpen, setRoleManagerOpen] = useState(false)
  const [roleTarget, setRoleTarget] = useState(null)
  const [roleSelection, setRoleSelection] = useState([])
  const [availableRoles, setAvailableRoles] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [rolePermSelection, setRolePermSelection] = useState([])
  const [cloneTemplateId, setCloneTemplateId] = useState('')
  const [cloneCode, setCloneCode] = useState('')
  const [cloneLabel, setCloneLabel] = useState('')
  const [templateCode, setTemplateCode] = useState('')
  const [templateLabel, setTemplateLabel] = useState('')
  const [selectedRoleLabel, setSelectedRoleLabel] = useState('')
  const [selectedRoleTenantId, setSelectedRoleTenantId] = useState(null)
  const [roleManagerTab, setRoleManagerTab] = useState('vendor')
  const [viewMode, setViewMode] = useState('grid')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [permSearch, setPermSearch] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const isPlatformAdmin = tenantId === 1
  const canEditSelected = Boolean(selectedRoleId)
  const isTemplateSelected = selectedRoleTenantId === 0
  const vendorReadOnly = roleManagerTab === 'vendor' && isTemplateSelected

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token],
  )

  const parseError = async (res) => {
    const text = await res.text()
    if (!text) {
      return `HTTP ${res.status} ${res.statusText || ''}`.trim()
    }
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

  const loadUsers = async () => {
    if (!token || !tenantId) return
    setError('')
    try {
      const res = await fetch(`/api/users?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      const data = await res.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load users')
    }
  }

  const loadRoles = async () => {
    if (!token || !tenantId) return
    try {
      const res = await fetch(`/api/roles?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setRoles(list)
      setAvailableRoles(list.filter((role) => role.tenantId === tenantId))
      
      // Mettre a jour les permissions du role selectionne apres le rechargement
      if (selectedRoleId) {
        const updatedRole = list.find(r => r.id === selectedRoleId)
        if (updatedRole) {
          setRolePermSelection(updatedRole.permissions || [])
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load roles')
    }
  }

  const loadPermissions = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/permissions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      const data = await res.json()
      setPermissions(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load permissions')
    }
  }

  useEffect(() => {
    loadUsers()
    loadRoles()
    loadPermissions()
  }, [token, tenantId]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const openEdit = (user) => {
    setEditingId(user.id)
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      imageUrl: user.imageUrl || '',
      enabled: user.enabled,
    })
    setModalOpen(true)
  }

  const openRoleGrid = (user) => {
    setRoleTarget(user)
    setRoleSelection(user.roles || [])
    setRoleModalOpen(true)
  }

  const openRoleManager = () => {
    setRoleManagerOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const url = editingId ? `/api/users/${editingId}` : '/api/users'
      const method = editingId ? 'PUT' : 'POST'
      const payload = editingId
        ? {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            imageUrl: form.imageUrl,
            enabled: form.enabled,
          }
        : {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
            phone: form.phone,
            imageUrl: form.imageUrl,
            enabled: form.enabled,
          }
      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      await loadUsers()
      setModalOpen(false)
      setEditingId(null)
      setForm(emptyForm)
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const saveRoles = async () => {
    if (!roleTarget) return
    setError('')
    try {
      const res = await fetch(`/api/users/${roleTarget.id}/roles`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ roles: roleSelection }),
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      await loadUsers()
      setRoleModalOpen(false)
      setRoleTarget(null)
    } catch (err) {
      setError(err.message || 'Role update failed')
    }
  }

  const selectRoleForPermissions = (roleId) => {
    const role = roles.find((item) => item.id === roleId)
    setSelectedRoleId(roleId)
    const nextPermissions = role?.permissions || []
    setRolePermSelection(nextPermissions)
    setSelectedRoleLabel(role?.label || '')
    setSelectedRoleTenantId(role?.tenantId ?? null)
  }

  const applyRolePermissions = async (nextPermissions) => {
    if (!selectedRoleId) {
      setError('Selectionnez un role a modifier.')
      return false
    }
    setError('')
    try {
      const res = await fetch(`/api/roles/${selectedRoleId}/permissions`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ permissionCodes: nextPermissions }),
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      return true
    } catch (err) {
      setError(err.message || 'Permissions update failed')
      return false
    }
  }

  const saveRoleLabel = async () => {
    if (!selectedRoleId) {
      setError('Selectionnez un role a modifier.')
      return
    }
    if (!selectedRoleLabel.trim()) {
      setError('Le label est requis.')
      return
    }
    setError('')
    try {
      const res = await fetch(`/api/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ label: selectedRoleLabel }),
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      await loadRoles()
    } catch (err) {
      setError(err.message || 'Update label failed')
    }
  }

  const createTemplate = async () => {
    if (!templateCode || !templateLabel) {
      setError('Code et label sont requis pour le template.')
      return
    }
    setError('')
    try {
      const res = await fetch('/api/roles/templates', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: templateCode,
          label: templateLabel,
        }),
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      await loadRoles()
      setTemplateCode('')
      setTemplateLabel('')
    } catch (err) {
      setError(err.message || 'Template creation failed')
    }
  }

  const cloneRole = async () => {
    if (!cloneTemplateId || !cloneCode || !cloneLabel) {
      setError('Template, code et label sont requis')
      return
    }
    setError('')
    try {
      const res = await fetch('/api/roles/clone', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          templateRoleId: Number(cloneTemplateId),
          code: cloneCode,
          label: cloneLabel,
        }),
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      const data = await res.json()
      await loadRoles()
      if (data?.id) {
        setSelectedRoleId(data.id)
        setSelectedRoleLabel(data.label || '')
        setSelectedRoleTenantId(data.tenantId ?? null)
        setRolePermSelection(data.permissions || [])
      }
      setCloneTemplateId('')
      setCloneCode('')
      setCloneLabel('')
    } catch (err) {
      setError(err.message || 'Role clone failed')
    }
  }

  const createTenantRole = async () => {
    if (!cloneCode || !cloneLabel) {
      setError('Code et label sont requis pour le role.')
      return
    }
    setError('')
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: cloneCode,
          label: cloneLabel,
        }),
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      const data = await res.json()
      await loadRoles()
      if (data?.id) {
        setSelectedRoleId(data.id)
        setSelectedRoleLabel(data.label || '')
        setSelectedRoleTenantId(data.tenantId ?? null)
        setRolePermSelection(data.permissions || [])
      }
      setCloneTemplateId('')
      setCloneCode('')
      setCloneLabel('')
    } catch (err) {
      setError(err.message || 'Role creation failed')
    }
  }

  const handleDeleteRole = async (roleId) => {
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        headers,
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      await loadRoles()
      setSelectedRoleId(null)
      setSelectedRoleLabel('')
      setSelectedRoleTenantId(null)
      setRolePermSelection([])
    } catch (err) {
      setError(err.message || 'Role delete failed')
    }
  }

  const filteredUsers = users.filter((user) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = term
      ? `${user.firstName} ${user.lastName} ${user.email}`
          .toLowerCase()
          .includes(term)
      : true

    const roles = user.roles || []
    const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')
    const isOwner = roles.includes('OWNER')
    const roleLabel = isOwner ? 'OWNER' : isAdmin ? 'ADMIN' : 'USER'

    const matchesRole =
      roleFilter === 'all'
        ? true
        : roleFilter === 'owner'
          ? roleLabel === 'OWNER'
          : roleFilter === 'admin'
            ? roleLabel === 'ADMIN'
            : roleLabel === 'USER'

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
          ? user.enabled
          : !user.enabled

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalCount = users.length
  const activeCount = users.filter((user) => user.enabled).length
  const adminCount = users.filter((user) => {
    const roles = user.roles || []
    return roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')
  }).length

  const roleOptions = availableRoles.length
    ? availableRoles.map((role) => role.code)
    : []

  const templateRoles = roles.filter((role) => role.tenantId === 0)
  const tenantRoles = roles.filter((role) => role.tenantId === tenantId)

  const addPermission = async (code) => {
    if (!canEditSelected || isUpdating) return
    
    // Construire la nouvelle liste de permissions
    const next = rolePermSelection.includes(code) 
      ? rolePermSelection 
      : [...rolePermSelection, code]
    
    setIsUpdating(true)
    const ok = await applyRolePermissions(next)
    
    if (ok) {
      // Si succes, recharger pour synchroniser
      await loadRoles()
    } else {
      // Si echec, restaurer l'etat precedent
      setRolePermSelection(rolePermSelection)
    }
    
    setIsUpdating(false)
  }

  const removePermission = async (code) => {
    if (!canEditSelected || isUpdating) return
    
    // Construire la nouvelle liste de permissions
    const next = rolePermSelection.filter((item) => item !== code)
    
    setIsUpdating(true)
    const ok = await applyRolePermissions(next)
    
    if (ok) {
      // Si succes, recharger pour synchroniser
      await loadRoles()
    } else {
      // Si echec, restaurer l'etat precedent
      setRolePermSelection(rolePermSelection)
    }
    
    setIsUpdating(false)
  }

  return (
    <StandardPage
      className="users-page"
      title="Gestion des Utilisateurs"
      badge="TEAM ACCESS"
      subtitle="Gerez les acces de votre equipe, roles et permissions, sans complexite."
      actions={(
        <div className="users-hero-actions">
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'grid', label: 'Vue grille', icon: <FaThLarge />, ariaLabel: 'Vue grille' },
              { value: 'list', label: 'Vue liste', icon: <FaList />, ariaLabel: 'Vue liste' },
            ]}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={openRoleManager}
            className="users-role-button"
          >
            Roles & permissions
          </Button>
          <Button type="button" onClick={openCreate} className="users-add-button">
            <FaUserPlus /> Ajouter un membre
          </Button>
        </div>
      )}
    >

      <StatsGrid
        items={[
          { key: 'total', label: 'Total', value: totalCount },
          { key: 'active', label: 'Actifs', value: activeCount },
          { key: 'admins', label: 'Admins', value: adminCount },
        ]}
        className="users-stats"
        cardClassName="users-stat-card"
        labelClassName="users-stat-label"
        valueClassName="users-stat-value"
      />

      <FilterBar className="users-filters">
        <SearchInput
          className="users-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email..."
        />
        <div className="filter-group users-filter-group">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">Role: Tous</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Statut: Tous</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </FilterBar>

      {error ? <p className="users-error">{error}</p> : null}

      <CardGrid className="users-cards" list={viewMode === 'list'} size="md">
        {filteredUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={openEdit}
            onManageRoles={openRoleGrid}
          />
        ))}
        {filteredUsers.length === 0 ? (
          <EmptyState className="users-empty">Aucun utilisateur trouve.</EmptyState>
        ) : null}
      </CardGrid>

      <Modal
        open={modalOpen}
        title={editingId ? 'Modifier utilisateur' : 'Ajouter un utilisateur'}
        onClose={() => setModalOpen(false)}
      >
        <form className="users-form-modern" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group floating">
              <input
                type="text"
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                required
                className="form-input"
                placeholder=" "
              />
              <label htmlFor="firstName" className="form-label">Prenom *</label>
            </div>

            <div className="form-group floating">
              <input
                type="text"
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                required
                className="form-input"
                placeholder=" "
              />
              <label htmlFor="lastName" className="form-label">Nom *</label>
            </div>

            {!editingId ? (
              <>
                <div className="form-group floating">
                  <input
                    type="email"
                    id="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    className="form-input"
                    placeholder=" "
                  />
                  <label htmlFor="email" className="form-label">Email *</label>
                </div>

                <div className="form-group floating">
                  <input
                    type="password"
                    id="password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                    className="form-input"
                    placeholder=" "
                  />
                  <label htmlFor="password" className="form-label">Mot de passe *</label>
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label="Afficher ou masquer le mot de passe"
                    onClick={() => {
                      const input = document.getElementById('password')
                      if (input) {
                        input.type = input.type === 'password' ? 'text' : 'password'
                      }
                    }}
                  >
                    Afficher
                  </button>
                </div>
              </>
            ) : null}

            <div className="form-group floating">
              <input
                type="tel"
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="form-input"
                placeholder=" "
              />
              <label htmlFor="phone" className="form-label">Telephone</label>
            </div>

            <div className="form-group floating">
              <input
                type="url"
                id="imageUrl"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                className="form-input"
                placeholder=" "
              />
              <label htmlFor="imageUrl" className="form-label">URL de l'image</label>
            </div>
          </div>

          <div className="form-switch">
            <label className="switch">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="switch-input"
              />
              <span className="switch-slider" />
              <span className="switch-label">Compte actif</span>
            </label>
            <span className="form-hint">L'utilisateur peut se connecter</span>
          </div>

          <div className="form-actions">
            <Button type="submit" disabled={loading} className="primary-button">
              {loading ? 'Enregistrement...' : editingId ? 'Mettre a jour' : 'Creer'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
              className="secondary-button"
            >
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={roleModalOpen}
        title="Permissions & Roles"
        onClose={() => setRoleModalOpen(false)}
      >
        <p className="users-hint">
          Choisissez les roles que cet utilisateur peut avoir. Les roles sont des groupes
          de permissions.
        </p>
        {roleTarget ? (
          <div className="users-roles">
            <div className="users-roles-header">
              <div>
                <div className="users-role-user">
                  {roleTarget.firstName} {roleTarget.lastName}
                </div>
                <div className="users-role-email">{roleTarget.email}</div>
              </div>
              <Button type="button" onClick={saveRoles}>
                Enregistrer
              </Button>
            </div>
            <div className="users-roles-grid">
              {roleOptions.map((role) => (
                <label key={role} className="users-role-card">
                  <input
                    type="checkbox"
                    checked={roleSelection.includes(role)}
                    onChange={(e) => {
                      setRoleSelection((prev) =>
                        e.target.checked
                          ? [...prev, role]
                          : prev.filter((item) => item !== role),
                      )
                    }}
                  />
                  <span>{role}</span>
                </label>
              ))}
              {roleOptions.length === 0 ? (
                <div className="users-role-empty">
                  Aucun role disponible. Clonez un role template d'abord.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={roleManagerOpen}
        title="Gestion des roles"
        onClose={() => setRoleManagerOpen(false)}
      >
        <div className="users-role-manager">
          <div className="users-role-banner">
            <div>
              <div className="users-role-banner-title">Espace roles vendeur</div>
              <p className="users-hint">
                Flux simple en 3 etapes : choisir un template, creer un role, puis ajuster les permissions.
              </p>
            </div>
            <div className="users-role-legend">
              <span>Template</span>
              <span>Role du tenant</span>
            </div>
          </div>

          <div className="users-role-tabs">
            <button
              type="button"
              className={`users-role-tab ${roleManagerTab === 'vendor' ? 'active' : ''}`}
              onClick={() => setRoleManagerTab('vendor')}
            >
              Espace vendeur
            </button>
            {isPlatformAdmin ? (
              <button
                type="button"
                className={`users-role-tab ${roleManagerTab === 'templates' ? 'active' : ''}`}
                onClick={() => setRoleManagerTab('templates')}
              >
                Espace templates
              </button>
            ) : null}
          </div>

          {roleManagerTab === 'vendor' ? (
            <div className="users-role-flow">
              <div className="users-role-step-card">
                <div className="users-role-step">1</div>
                <div className="users-role-step-content">
                  <h4>Choisir un template</h4>
                  <p className="users-hint">Le role sera clone avec les permissions du template.</p>
                  <select
                    value={cloneTemplateId}
                    onChange={(e) => {
                      setCloneTemplateId(e.target.value)
                      const selected = Number(e.target.value)
                      if (selected) {
                        selectRoleForPermissions(selected)
                      }
                    }}
                  >
                    <option value="">Choisir un template</option>
                    {templateRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <div className="users-role-grid">
                    {templateRoles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        className={`users-role-tile template ${
                          selectedRoleId === role.id ? 'active' : ''
                        }`}
                        onClick={() => {
                          setCloneTemplateId(String(role.id))
                          selectRoleForPermissions(role.id)
                        }}
                      >
                        <span>{role.label}</span>
                        <span className="users-role-badge">Template</span>
                        <small>{role.permissions?.length || 0} permissions</small>
                      </button>
                    ))}
                    {templateRoles.length === 0 ? (
                      <div className="users-role-empty">
                        Aucun template disponible. Contactez l'admin plateforme.
                      </div>
                    ) : null}
                  </div>
                  <p className="users-hint users-template-hint">
                    Templates en lecture seule. Cloner pour modifier.
                  </p>
                </div>
              </div>

              <div className="users-role-step-card">
                <div className="users-role-step">2</div>
                <div className="users-role-step-content">
                  <h4>Creer le role du tenant</h4>
                  <div className="form-grid compact">
                    <div className="form-group floating">
                      <input
                        type="text"
                        value={cloneCode}
                        onChange={(e) => setCloneCode(e.target.value)}
                        className="form-input"
                        placeholder=" "
                      />
                      <label className="form-label">Code du role</label>
                    </div>
                    <div className="form-group floating">
                      <input
                        type="text"
                        value={cloneLabel}
                        onChange={(e) => setCloneLabel(e.target.value)}
                        className="form-input"
                        placeholder=" "
                      />
                      <label className="form-label">Label du role</label>
                    </div>
                  </div>
                  <div className="users-role-actions">
                    <Button type="button" onClick={cloneRole} className="primary-button">
                      Cloner ce template
                    </Button>
                    <Button type="button" variant="secondary" onClick={createTenantRole}>
                      Creer un role vide
                    </Button>
                  </div>
                </div>
              </div>

              <div className="users-role-step-card wide">
                <div className="users-role-step">3</div>
                <div className="users-role-step-content">
                  <div className="users-role-step-header">
                    <h4>Roles du tenant</h4>
                    <span className="users-role-chip">
                      Selection : {selectedRoleLabel || 'Aucun'}
                    </span>
                  </div>
                  <div className="users-role-grid">
                    {tenantRoles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        className={`users-role-tile ${
                          selectedRoleId === role.id ? 'active' : ''
                        }`}
                        onClick={() => selectRoleForPermissions(role.id)}
                      >
                        <span>{role.label}</span>
                        <small>{role.permissions?.length || 0} permissions</small>
                      </button>
                    ))}
                    {tenantRoles.length === 0 ? (
                      <div className="users-role-empty">
                        Aucun role du tenant. Clonez un template ou creez un role vide.
                      </div>
                    ) : null}
                  </div>
                  {selectedRoleTenantId === tenantId ? (
                    <div className="users-role-actions">
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => {
                          if (!selectedRoleId) {
                            setError('Selectionnez un role pour supprimer.')
                            return
                          }
                          if (window.confirm('Supprimer ce role ?')) {
                            handleDeleteRole(selectedRoleId)
                          }
                        }}
                      >
                        Supprimer le role selectionne
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {isPlatformAdmin && roleManagerTab === 'templates' ? (
            <div className="users-role-section">
              <div className="users-role-section-header">
                <h4>Espace admin plateforme (templates)</h4>
                <p className="users-hint">
                  Cree et modifie les templates globaux (tenantId=0). Ces
                  templates servent de base aux vendeurs.
                </p>
              </div>
              <div className="users-role-panel">
                <h4>Creer un template</h4>
                <div className="form-group floating compact">
                  <input
                    type="text"
                    value={templateCode}
                    onChange={(e) => setTemplateCode(e.target.value)}
                    className="form-input"
                    placeholder=" "
                  />
                  <label className="form-label">Code *</label>
                </div>
                <div className="form-group floating compact">
                  <input
                    type="text"
                    value={templateLabel}
                    onChange={(e) => setTemplateLabel(e.target.value)}
                    className="form-input"
                    placeholder=" "
                  />
                  <label className="form-label">Label *</label>
                </div>
                <Button type="button" onClick={createTemplate} className="primary-button">
                  Creer template
                </Button>
              </div>
              <div className="users-role-panel">
                <h4>Templates</h4>
                <div className="users-role-list">
                  {templateRoles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      className={`users-role-item template ${
                        selectedRoleId === role.id ? 'active' : ''
                      }`}
                      onClick={() => selectRoleForPermissions(role.id)}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="users-role-panel wide">
            <div className="users-role-panel-header">
              <div>
                <h4>Permissions du role selectionne</h4>
                <div className="users-role-subtitle">
                  {selectedRoleLabel || 'Aucun role selectionne'}
                </div>
              </div>
              <span className="users-role-chip">Auto-sauvegarde</span>
            </div>
            {vendorReadOnly ? (
              <div className="users-template-notice">
                <span className="users-role-badge">Template</span>
                <span>Cloner pour modifier ce role.</span>
              </div>
            ) : null}
            {!canEditSelected ? (
              <p className="users-hint">
                Selectionnez un role pour modifier ses permissions.
              </p>
            ) : null}
            <div className="users-permissions-toolbar">
              <div className="users-permissions-search">
                <input
                  type="search"
                  placeholder="Rechercher une permission..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                />
              </div>
              <div className="users-permissions-actions" />
            </div>
            <div className="users-role-inline">
              <div className="form-group floating compact">
                <input
                  type="text"
                  value={selectedRoleLabel}
                  onChange={(e) => setSelectedRoleLabel(e.target.value)}
                  className="form-input"
                  placeholder=" "
                  readOnly={!canEditSelected}
                />
                <label className="form-label">Label du role</label>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={saveRoleLabel}
                disabled={!canEditSelected || vendorReadOnly}
                className="secondary-button"
              >
                Mettre a jour
              </Button>
            </div>
            <div className="users-permissions-toggle-list">
              {permissions.length === 0 ? (
                <div className="users-role-empty">Aucune permission disponible.</div>
              ) : (
                permissions
                  .filter((permission) => {
                    const term = permSearch.trim().toLowerCase()
                    if (!term) return true
                    const label = permission.label || ''
                    return (
                      String(permission.code).toLowerCase().includes(term)
                      || String(label).toLowerCase().includes(term)
                    )
                  })
                  .sort((a, b) => String(a.code).localeCompare(String(b.code)))
                  .map((permission) => {
                    const checked = rolePermSelection.includes(permission.code)
                    return (
                      <label key={permission.code} className={`users-permission-toggle ${checked ? 'on' : ''}`}>
                        <div className="users-permission-info">
                          <div className="users-permission-label">
                            {permission.label || permission.code}
                          </div>
                          <div className="users-permission-code">{permission.code}</div>
                        </div>
                        <span className="toggle-pill">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canEditSelected || isUpdating || vendorReadOnly}
                            onChange={(e) => {
                              if (e.target.checked) {
                                addPermission(permission.code)
                              } else {
                                removePermission(permission.code)
                              }
                            }}
                          />
                          <span className="toggle-track" />
                          <span className="toggle-thumb" />
                        </span>
                      </label>
                    )
                  })
              )}
            </div>
          </div>
        </div>
      </Modal>
    </StandardPage>
  )
}

