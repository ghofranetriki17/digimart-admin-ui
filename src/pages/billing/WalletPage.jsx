import { useEffect, useState } from 'react'
import StandardPage from '../../templates/StandardPage'
import './WalletPage.css'

export default function WalletPage({ token, tenantId }) {
  const [wallet, setWallet] = useState(null)
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const auth = { Authorization: `Bearer ${token}` }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/tenants/${tenantId}/wallet`, { headers: auth })
      if (!res.ok) throw new Error('Wallet introuvable')
      const data = await res.json()
      setWallet(data)
      const txRes = await fetch(`/api/tenants/${tenantId}/wallet/transactions`, { headers: auth })
      const txData = txRes.ok ? await txRes.json() : []
      setTxns(Array.isArray(txData) ? txData : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tenantId) load()
  }, [tenantId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <StandardPage
      className="wallet-page"
      title="Wallet du tenant"
      subtitle="Solde, statut et historique des mouvements."
      align="left"
    >

      {loading ? <div className="wallet-status">Chargementâ€¦</div> : null}
      {error ? <div className="wallet-error">{error}</div> : null}

      {wallet ? (
        <div className="wallet-summary">
          <div>
            <div className="wallet-label">Solde</div>
            <div className="wallet-amount">
              {wallet.balance} {wallet.currency}
            </div>
          </div>
          <div>
            <div className="wallet-label">Statut</div>
            <div className={`wallet-status-pill status-${wallet.status?.toLowerCase()}`}>
              {wallet.status}
            </div>
          </div>
          <div>
            <div className="wallet-label">DerniÃ¨re transaction</div>
            <div>{wallet.lastTransactionAt || 'â€”'}</div>
          </div>
        </div>
      ) : null}

      <div className="wallet-history">
        <div className="wallet-history-header">
          <div>
            <div className="wallet-section-title">Historique des mouvements</div>
            <div className="wallet-section-subtitle">Dernieres operations du wallet.</div>
          </div>
          <div className="wallet-count">{txns.length} mouvements</div>
        </div>
        <div className="wallet-history-list">
          {txns.map((t) => {
            const typeKey = String(t.type || '').toLowerCase()
            const amountClass = typeKey === 'credit' ? 'amount-credit' : typeKey === 'debit' ? 'amount-debit' : ''
            return (
              <div key={t.id} className="wallet-history-item">
                <div className="wallet-history-main">
                  <div className="wallet-history-date">{t.transactionDate}</div>
                  <div className={`wallet-history-type type-${typeKey}`}>{t.type || 'â€”'}</div>
                </div>
                <div className="wallet-history-amount">
                  <div className={`wallet-amount-pill ${amountClass}`}>{t.amount}</div>
                  <div className="wallet-balance">
                    <span>Avant {t.balanceBefore}</span>
                    <span>Apres {t.balanceAfter}</span>
                  </div>
                </div>
                <div className="wallet-history-meta">
                  <div className="wallet-meta-group">
                    <span className="wallet-meta-label">Raison</span>
                    <span className="wallet-meta-value">{t.reason || 'â€”'}</span>
                  </div>
                  <div className="wallet-meta-group">
                    <span className="wallet-meta-label">Ref</span>
                    <span className="wallet-meta-value">{t.reference || 'â€”'}</span>
                  </div>
                </div>
              </div>
            )
          })}
          {txns.length === 0 ? <div className="wallet-empty">Aucune transaction</div> : null}
        </div>
      </div>
    </StandardPage>
  )
}

