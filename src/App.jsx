import { useEffect, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'digimart.auth'
const REGISTER_KEY = 'digimart.register'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [registerStep, setRegisterStep] = useState(1)
  const [newTenantName, setNewTenantName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [ownerFirstName, setOwnerFirstName] = useState('')
  const [ownerLastName, setOwnerLastName] = useState('')
  const [registeredTenantId, setRegisteredTenantId] = useState(null)
  const [registeredSubdomain, setRegisteredSubdomain] = useState('')
  const [token, setToken] = useState('')
  const [roles, setRoles] = useState([])
  const [userName, setUserName] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw)
      setToken(saved.token || '')
      setRoles(saved.roles || [])
      setUserName(saved.userName || '')
      setTenantName(saved.tenantName || '')
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    const raw = localStorage.getItem(REGISTER_KEY)
    if (!raw) return
    try {
      const saved = JSON.parse(raw)
      if (saved.tenantId) {
        setRegisteredTenantId(saved.tenantId)
      }
      if (saved.subdomain) {
        setRegisteredSubdomain(saved.subdomain)
      }
      if (saved.tenantName) {
        setNewTenantName(saved.tenantName)
      }
      if (saved.contactEmail) {
        setContactEmail(saved.contactEmail)
      }
      if (saved.contactPhone) {
        setContactPhone(saved.contactPhone)
      }
    } catch {
      localStorage.removeItem(REGISTER_KEY)
    }
  }, [])

  const saveSession = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const clearSession = () => {
    setToken('')
    setRoles([])
    setUserName('')
    setTenantName('')
    localStorage.removeItem(STORAGE_KEY)
  }

  const login = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const text = await res.text()
        let message = text
        try {
          const parsed = JSON.parse(text)
          message = parsed.message || parsed.error || text
        } catch {
          // keep raw text
        }
        throw new Error(message || 'Login failed')
      }
      const data = await res.json()
      const nextToken = data.token
      const nextRoles = data.roles || []

      const userRes = await fetch(`/api/users/${data.userId}`, {
        headers: { Authorization: `Bearer ${nextToken}` },
      })
      const userData = userRes.ok ? await userRes.json() : null
      const nextUserName = userData
        ? `${userData.firstName} ${userData.lastName}`
        : 'User'

      let nextTenantName = `Tenant #${data.tenantId}`
      const tenantRes = await fetch(`/api/tenants/${data.tenantId}`, {
        headers: { Authorization: `Bearer ${nextToken}` },
      })
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json()
        nextTenantName = tenantData.name
      }

      setToken(nextToken)
      setRoles(nextRoles)
      setUserName(nextUserName)
      setTenantName(nextTenantName)
      saveSession({
        token: nextToken,
        roles: nextRoles,
        userName: nextUserName,
        tenantName: nextTenantName,
      })
      setMode('login')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const registerTenant = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (registerStep === 1) {
        const res = await fetch('/api/auth/register-tenant/step1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantName: newTenantName,
            contactEmail,
            contactPhone,
            status: 'ACTIVE',
            defaultLocale: 'FR',
          }),
        })
        if (!res.ok) {
          const text = await res.text()
          console.error('Register step1 error', res.status, text)
          let message = text
          try {
            const parsed = JSON.parse(text)
            if (parsed.errors && typeof parsed.errors === 'object') {
              message = Object.entries(parsed.errors)
                .map(([field, msg]) => `${field}: ${msg}`)
                .join(', ')
            } else {
              message =
                parsed.message || parsed.error || parsed.detail || text
            }
          } catch {
            // keep raw text
          }
          throw new Error(message || 'Registration failed')
        }
        const data = await res.json()
        setRegisteredTenantId(data.tenantId)
        setRegisteredSubdomain(data.subdomain)
        setRegisterStep(2)
        localStorage.setItem(
          REGISTER_KEY,
          JSON.stringify({
            tenantId: data.tenantId,
            subdomain: data.subdomain,
            tenantName: newTenantName,
            contactEmail,
            contactPhone,
          }),
        )
        return
      }

      if (!registeredTenantId) {
        throw new Error('Tenant ID is missing. Please validate tenant first.')
      }

      const res = await fetch('/api/auth/register-tenant/step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: registeredTenantId,
          ownerEmail: email,
          ownerPassword: password,
          ownerFirstName,
          ownerLastName,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        console.error('Register step2 error', res.status, text)
        let message = text
        try {
          const parsed = JSON.parse(text)
          if (parsed.errors && typeof parsed.errors === 'object') {
            message = Object.entries(parsed.errors)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join(', ')
          } else {
            message =
              parsed.message ||
              parsed.error ||
              parsed.detail ||
              text
          }
        } catch {
          // keep raw text
        }
        throw new Error(message || 'Registration failed')
      }
      const data = await res.json()
      const nextToken = data.token
      const nextRoles = data.roles || []

      const userRes = await fetch(`/api/users/${data.userId}`, {
        headers: { Authorization: `Bearer ${nextToken}` },
      })
      const userData = userRes.ok ? await userRes.json() : null
      const nextUserName = userData
        ? `${userData.firstName} ${userData.lastName}`
        : 'User'

      let nextTenantName = `Tenant #${data.tenantId}`
      const tenantRes = await fetch(`/api/tenants/${data.tenantId}`, {
        headers: { Authorization: `Bearer ${nextToken}` },
      })
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json()
        nextTenantName = tenantData.name
      }

      setToken(nextToken)
      setRoles(nextRoles)
      setUserName(nextUserName)
      setTenantName(nextTenantName)
      saveSession({
        token: nextToken,
        roles: nextRoles,
        userName: nextUserName,
        tenantName: nextTenantName,
      })
      setMode('login')
      setRegisterStep(1)
      setRegisteredTenantId(null)
      setRegisteredSubdomain('')
      localStorage.removeItem(REGISTER_KEY)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const isSuperAdmin = roles.includes('SUPER_ADMIN')

  if (token) {
    return (
      <div className="app">
        <header className="topbar">
          <h1>{isSuperAdmin ? 'Admin Dashboard' : 'Tenant Dashboard'}</h1>
          <button className="secondary" onClick={clearSession}>
            Logout
          </button>
        </header>
        <p className="subtitle">
          Hi Mr {userName} - {isSuperAdmin ? 'Platform Admin' : tenantName}
        </p>
        <div className="panel">
          <p>Dashboard content will be built later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <h1>{mode === 'register' ? 'Create Your Store' : 'Digimart Login'}</h1>
      <p>
        {mode === 'register'
          ? 'Create a tenant and its first owner account.'
          : 'Sign in to access your dashboard.'}
      </p>

      <form
        onSubmit={mode === 'register' ? registerTenant : login}
        className="form"
      >
        {mode === 'register' && registerStep === 1 ? (
          <>
            <label className="field">
              <span>Tenant Name</span>
              <input
                type="text"
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Subdomain (auto)</span>
              <input
                type="text"
                value={
                  registeredSubdomain
                    ? `${registeredSubdomain}.digimart.tn`
                    : newTenantName
                      ? `${newTenantName
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-+/, '')
                          .replace(/-+$/, '')}.digimart.tn`
                      : ''
                }
                readOnly
              />
            </label>

            <label className="field">
              <span>Contact Email</span>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Contact Phone</span>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
              />
            </label>
          </>
        ) : null}

        {mode === 'register' && registerStep === 2 ? (
          <>
            <label className="field">
              <span>Owner First Name</span>
              <input
                type="text"
                value={ownerFirstName}
                onChange={(e) => setOwnerFirstName(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Owner Last Name</span>
              <input
                type="text"
                value={ownerLastName}
                onChange={(e) => setOwnerLastName(e.target.value)}
                required
              />
            </label>
          </>
        ) : null}

        {mode === 'login' || registerStep === 2 ? (
          <>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
          </>
        ) : null}

        {error ? <p className="error">{error}</p> : null}

        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading
              ? mode === 'register'
                ? registerStep === 1
                  ? 'Validating...'
                  : 'Creating...'
                : 'Signing in...'
              : mode === 'register'
                ? registerStep === 1
                  ? 'Validate tenant'
                  : 'Create Store'
                : 'Login'}
          </button>
          {mode === 'register' ? (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setMode('login')
                setRegisterStep(1)
                setRegisteredTenantId(null)
                setRegisteredSubdomain('')
                localStorage.removeItem(REGISTER_KEY)
              }}
            >
              Back to login
            </button>
          ) : (
            <>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setMode('register')
                  setRegisterStep(1)
                }}
              >
                Create your store
              </button>
              <button type="button" className="secondary">
                Join a store
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}

export default App
