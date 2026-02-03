import { useEffect, useState } from 'react'
import AdminLayout from './layouts/AdminLayout'
import TenantLayout from './layouts/TenantLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import StoresPage from './pages/stores/StoresPage'
import UsersPage from './pages/users/UsersPage'

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
  const [tenantId, setTenantId] = useState(null)
  const [userId, setUserId] = useState(null)
  const [tenantPage, setTenantPage] = useState('dashboard')
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
      setTenantId(saved.tenantId || null)
      setUserId(saved.userId || null)
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
    setTenantId(null)
    setUserId(null)
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
      const nextTenantId = data.tenantId
      const nextUserId = data.userId

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
      setTenantId(nextTenantId)
      setUserId(nextUserId)
      saveSession({
        token: nextToken,
        roles: nextRoles,
        userName: nextUserName,
        tenantName: nextTenantName,
        tenantId: nextTenantId,
        userId: nextUserId,
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
      const nextTenantId = data.tenantId
      const nextUserId = data.userId

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
      setTenantId(nextTenantId)
      setUserId(nextUserId)
      saveSession({
        token: nextToken,
        roles: nextRoles,
        userName: nextUserName,
        tenantName: nextTenantName,
        tenantId: nextTenantId,
        userId: nextUserId,
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
    if (isSuperAdmin) {
      return (
        <AdminLayout title="Admin Dashboard" onLogout={clearSession}>
          <DashboardPage
            userName={userName}
            tenantName={tenantName}
            isSuperAdmin={isSuperAdmin}
          />
        </AdminLayout>
      )
    }

    return (
      <TenantLayout
        title="Seller Dashboard"
        tenantName={tenantName}
        userName={userName}
        onLogout={clearSession}
        onSelect={(key) => setTenantPage(key)}
        activeKey={tenantPage}
      >
        {tenantPage === 'stores' ? (
          <StoresPage token={token} tenantId={tenantId} />
        ) : tenantPage === 'users' ? (
          <UsersPage />
        ) : (
          <DashboardPage
            userName={userName}
            tenantName={tenantName}
            isSuperAdmin={isSuperAdmin}
          />
        )}
      </TenantLayout>
    )
  }

  return (
    <LoginPage
      mode={mode}
      registerStep={registerStep}
      newTenantName={newTenantName}
      contactEmail={contactEmail}
      contactPhone={contactPhone}
      ownerFirstName={ownerFirstName}
      ownerLastName={ownerLastName}
      email={email}
      password={password}
      registeredSubdomain={registeredSubdomain}
      error={error}
      loading={loading}
      onChange={(field, value) => {
        if (field === 'newTenantName') setNewTenantName(value)
        if (field === 'contactEmail') setContactEmail(value)
        if (field === 'contactPhone') setContactPhone(value)
        if (field === 'ownerFirstName') setOwnerFirstName(value)
        if (field === 'ownerLastName') setOwnerLastName(value)
        if (field === 'email') setEmail(value)
        if (field === 'password') setPassword(value)
      }}
      onSubmit={mode === 'register' ? registerTenant : login}
      onSwitchMode={() => {
        setMode('register')
        setRegisterStep(1)
      }}
      onBackToLogin={() => {
        setMode('login')
        setRegisterStep(1)
        setRegisteredTenantId(null)
        setRegisteredSubdomain('')
        localStorage.removeItem(REGISTER_KEY)
      }}
    />
  )
}

export default App
