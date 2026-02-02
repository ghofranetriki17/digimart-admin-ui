import { useState } from 'react'
import './App.css'

function App() {
  const [token, setToken] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchTenants = async () => {
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/tenants', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      const text = await res.text()
      setResult(`${res.status} ${res.statusText}\n${text}`)
    } catch (err) {
      setResult(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>NexaShop Frontend</h1>
      <p>Vite proxy is configured for /api → http://localhost:8080</p>

      <label className="field">
        <span>Bearer token (optional)</span>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste token here"
        />
      </label>

      <button onClick={fetchTenants} disabled={loading}>
        {loading ? 'Loading...' : 'Test GET /api/tenants'}
      </button>

      <pre className="result">{result}</pre>
    </div>
  )
}

export default App
