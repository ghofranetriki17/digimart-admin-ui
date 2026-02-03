import { useEffect, useMemo, useState } from 'react'
import { FaList, FaThLarge, FaUserPlus } from 'react-icons/fa'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import TextInput from '../../components/ui/TextInput'
import UserCard from '../../components/users/UserCard'
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
  const [viewMode, setViewMode] = useState('grid')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token],
  )

  const parseError = async (res) => {
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
  }, [token, tenantId])

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
    setRolePermSelection(role?.permissions || [])
  }

  const saveRolePermissions = async () => {
    if (!selectedRoleId) {
      setError('Selectionnez un role du tenant.')
      return
    }
    setError('')
    try {
      const res = await fetch(`/api/roles/${selectedRoleId}/permissions`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ permissionCodes: rolePermSelection }),
      })
      if (!res.ok) {
        throw new Error(await parseError(res))
      }
      await loadRoles()
    } catch (err) {
      setError(err.message || 'Permissions update failed')
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
      await loadRoles()
      setCloneTemplateId('')
      setCloneCode('')
      setCloneLabel('')
    } catch (err) {
      setError(err.message || 'Role clone failed')
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

  return (
    <div className="users-page">
      <header className="users-hero">
        <div className="users-hero-title">
          <h2>Gestion des Utilisateurs</h2>
          <span className="users-hero-badge">TEAM ACCESS</span>
        </div>
        <p>Gerez les acces de votre equipe, roles et permissions.</p>
        <div className="users-hero-actions">
          <div className="users-view-toggle">
            <button
              type="button"
              className={`users-view-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Vue grille"
            >
              <FaThLarge />
            </button>
            <button
              type="button"
              className={`users-view-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="Vue liste"
            >
              <FaList />
            </button>
          </div>
          <Button type="button" variant="secondary" onClick={openRoleManager} className="users-role-button">
            Gerer les roles
          </Button>
          <Button type="button" onClick={openCreate} className="users-add-button">
            <FaUserPlus /> Ajouter un utilisateur
          </Button>
        </div>
      </header>

      <div className="users-stats">
        <div className="users-stat-card">
          <div className="users-stat-label">Total</div>
          <div className="users-stat-value">{totalCount}</div>
        </div>
        <div className="users-stat-card">
          <div className="users-stat-label">Actifs</div>
          <div className="users-stat-value">{activeCount}</div>
        </div>
        <div className="users-stat-card">
          <div className="users-stat-label">Admins</div>
          <div className="users-stat-value">{adminCount}</div>
        </div>
      </div>

      <div className="users-filters">
        <div className="users-search">
          <input
            type="search"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="users-filter-group">
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
      </div>

      {error ? <p className="users-error">{error}</p> : null}

      <div className={`users-cards ${viewMode === 'list' ? 'list' : ''}`}>
        {filteredUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onEdit={openEdit}
            onManageRoles={openRoleGrid}
          />
        ))}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? 'Modifier utilisateur' : 'Ajouter un utilisateur'}
        onClose={() => setModalOpen(false)}
      >
        <form className="users-form" onSubmit={handleSubmit}>
          <TextInput
            label="Prenom"
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            required
          />
          <TextInput
            label="Nom"
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            required
          />
          {!editingId ? (
            <>
              <TextInput
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <TextInput
                label="Mot de passe"
                type="password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
            </>
          ) : null}
          <TextInput
            label="Telephone"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
          <TextInput
            label="Image URL"
            value={form.imageUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
          />
          <label className="users-toggle">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
            />
            Compte actif
          </label>
          <div className="users-form-actions">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Mettre a jour' : 'Creer'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
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
          <div className="users-role-panel">
            <h4>Templates</h4>
            <select
              value={cloneTemplateId}
              onChange={(e) => setCloneTemplateId(e.target.value)}
            >
              <option value="">Choisir un template</option>
              {templateRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
            <TextInput
              label="Code"
              value={cloneCode}
              onChange={(e) => setCloneCode(e.target.value)}
            />
            <TextInput
              label="Label"
              value={cloneLabel}
              onChange={(e) => setCloneLabel(e.target.value)}
            />
            <Button type="button" onClick={cloneRole}>
              Cloner
            </Button>
          </div>

          <div className="users-role-panel">
            <h4>Roles du tenant</h4>
            <div className="users-role-list">
              {tenantRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={`users-role-item ${
                    selectedRoleId === role.id ? 'active' : ''
                  }`}
                  onClick={() => selectRoleForPermissions(role.id)}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <div className="users-role-panel wide">
            <div className="users-role-panel-header">
              <h4>Permissions</h4>
              <Button type="button" onClick={saveRolePermissions}>
                Enregistrer
              </Button>
            </div>
            <div className="users-roles-grid">
              {permissions.map((permission) => (
                <label key={permission.id} className="users-role-card">
                  <input
                    type="checkbox"
                    checked={rolePermSelection.includes(permission.code)}
                    onChange={(e) => {
                      setRolePermSelection((prev) =>
                        e.target.checked
                          ? [...prev, permission.code]
                          : prev.filter((item) => item !== permission.code),
                      )
                    }}
                  />
                  <span>{permission.code}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
