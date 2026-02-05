import { useEffect, useState } from 'react'
import TextInput from '../../components/ui/TextInput'
import Button from '../../components/ui/Button'
import './PlatformConfigPage.css'

export default function PlatformConfigPage({ token }) {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadConfigs = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/platform-config', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error('Impossible de charger la configuration')
        const data = await res.json()
        setConfigs(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadConfigs()
  }, [token])

  const updateValue = (key, value) => {
    setConfigs((prev) =>
      prev.map((item) => (item.configKey === key ? { ...item, configValue: value } : item)),
    )
  }

  const save = async (cfg) => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/platform-config/${cfg.configKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          configValue: cfg.configValue,
          description: cfg.description || '',
        }),
      })
      if (!res.ok) throw new Error('Sauvegarde impossible')
      setSuccess('Configuration mise à jour')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="platform-config-page">
      <header className="billing-hero">
        <div className="billing-hero-title">
          <h2>Billing config</h2>
          <span className="billing-hero-badge">BILLING</span>
        </div>
        <p>Commission, solde initial, seuil d’alerte et devise par défaut.</p>
      </header>

      {loading ? <div className="billing-status">Chargement…</div> : null}
      {error ? <div className="billing-error">{error}</div> : null}
      {success ? <div className="billing-success">{success}</div> : null}

      <div className="billing-grid">
        {configs.map((cfg) => (
          <div key={cfg.configKey} className="billing-config-row">
            <div className="billing-config-meta">
              <div className="billing-config-key">{cfg.configKey}</div>
              <div className="billing-config-desc">{cfg.description}</div>
            </div>
            <div className="billing-config-inputs">
              <TextInput
                label="Valeur"
                value={cfg.configValue || ''}
                onChange={(e) => updateValue(cfg.configKey, e.target.value)}
              />
              <Button
                variant="primary"
                disabled={saving}
                onClick={() => save(cfg)}
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
