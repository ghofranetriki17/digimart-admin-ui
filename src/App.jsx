import { useEffect, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'digimart.auth'

function App() {
  const [tenantId, setTenantId] = useState('1')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        body: JSON.stringify({
          tenantId: Number(tenantId),
          email,
          password,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Login failed')
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
    } catch (err) {
      setError(err.message || 'Login failed')
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
      <h1>Digimart Login</h1>
      <p>Sign in to access your dashboard.</p>

      <form onSubmit={login} className="form">
        <label className="field">
          <span>Tenant ID</span>
          <input
            type="number"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            min="1"
            required
          />
        </label>

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

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}

export default App
