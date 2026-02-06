import { useEffect, useState } from 'react'
import StandardPage from '../../templates/StandardPage'
import Button from '../../components/atoms/Button'
import Modal from '../../components/atoms/Modal'
import './SubscriptionPage.css'

export default function SubscriptionPage({ token, tenantId }) {
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [historyExpanded, setHistoryExpanded] = useState(true)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

  const auth = { Authorization: `Bearer ${token}` }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [curRes, histRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}/subscriptions/current`, { headers: auth }),
        fetch(`/api/tenants/${tenantId}/subscriptions/history`, { headers: auth }),
      ])
      if (!curRes.ok) throw new Error('Aucun abonnement trouvÃ©')
      const curData = await curRes.json()
      setCurrent(curData)
      const histData = histRes.ok ? await histRes.json() : []
      setHistory(Array.isArray(histData) ? histData : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenantId) load()
  }, [tenantId]) // eslint-disable-line react-hooks/exhaustive-deps

  const renderHistoryList = () => (
    <div className="subscription-history-list">
      {history.map((h) => {
        const actionKey = String(h.action || '').toLowerCase().replace(/\s+/g, '-')
        return (
          <div key={h.id} className="subscription-history-item">
            <div className="subscription-history-main">
              <div className="subscription-history-date">{h.performedAt}</div>
              <div className={`subscription-history-action action-${actionKey}`}>
                {h.action || 'â€”'}
              </div>
            </div>
            <div className="subscription-history-meta">
              <div className="subscription-meta-group">
                <span className="subscription-meta-label">Ancien plan</span>
                <span className="subscription-meta-value">{h.oldPlanId || 'â€”'}</span>
              </div>
              <div className="subscription-meta-group">
                <span className="subscription-meta-label">Nouveau plan</span>
                <span className="subscription-meta-value">{h.newPlanId || 'â€”'}</span>
              </div>
              <div className="subscription-meta-group">
                <span className="subscription-meta-label">Par</span>
                <span className="subscription-meta-value">{h.performedBy || 'â€”'}</span>
              </div>
            </div>
          </div>
        )
      })}
      {history.length === 0 ? (
        <div className="subscription-empty">Pas dâ€™historique</div>
      ) : null}
    </div>
  )

  return (
    <StandardPage
      className="subscription-page"
      title="Abonnement du tenant"
      subtitle="Plan actif et historique."
      align="left"
    >

      {loading ? <div className="subscription-status">Chargementâ€¦</div> : null}
      {error ? <div className="subscription-error">{error}</div> : null}

      {current ? (
        <div className="subscription-current">
          <div>
            <div className="subscription-label">Plan actuel</div>
            <div className="subscription-plan">{current.planName || current.planCode}</div>
          </div>
          <div>
            <div className="subscription-label">Statut</div>
            <div className={`subscription-pill status-${current.status?.toLowerCase()}`}>
              {current.status}
            </div>
          </div>
          <div>
            <div className="subscription-label">Depuis</div>
            <div>{current.startDate || 'â€”'}</div>
          </div>
          <div>
            <div className="subscription-label">Prochaine Ã©chÃ©ance</div>
            <div>{current.nextBillingDate || 'â€”'}</div>
          </div>
        </div>
      ) : null}

      <div className="subscription-history">
        <div className="subscription-history-header">
          <div>
            <div className="subscription-section-title">Historique</div>
            <div className="subscription-section-subtitle">Derniers changements de plan.</div>
          </div>
          <div className="subscription-history-actions">
            <Button
              type="button"
              variant="secondary"
              className="subscription-history-action-btn"
              aria-expanded={historyExpanded}
              onClick={() => setHistoryExpanded((prev) => !prev)}
            >
              {historyExpanded ? 'Masquer' : 'Afficher'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="subscription-history-action-btn"
              disabled={history.length === 0}
              onClick={() => setHistoryModalOpen(true)}
            >
              Ouvrir popup
            </Button>
            <div className="subscription-count">{history.length} entrees</div>
          </div>
        </div>
        {historyExpanded ? (
          renderHistoryList()
        ) : (
          <div className="subscription-history-collapsed">Historique masque.</div>
        )}
      </div>
      <Modal
        open={historyModalOpen}
        title="Historique des abonnements"
        onClose={() => setHistoryModalOpen(false)}
      >
        <div className="subscription-history-modal">{renderHistoryList()}</div>
      </Modal>
    </StandardPage>
  )
}

