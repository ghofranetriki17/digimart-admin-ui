import { useEffect, useState } from 'react'
import TextInput from '../../components/ui/TextInput'
import Button from '../../components/ui/Button'
import './WalletPage.css'

export default function WalletPage({ token, tenantId }) {
  const [wallet, setWallet] = useState(null)
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [reference, setReference] = useState('')
  const [mode, setMode] = useState('CREDIT')
  const [processing, setProcessing] = useState(false)

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
  }, [tenantId])

  const submit = async () => {
    setProcessing(true)
    setError('')
    try {
      const body = {
        amount: parseFloat(amount || '0'),
        reason,
        reference,
      }
      const endpoint = mode === 'DEBIT' ? 'debit' : 'credit'
      const res = await fetch(`/api/tenants/${tenantId}/wallet/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Opération impossible')
      setAmount('')
      setReason('')
      setReference('')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <div>
          <h2>Wallet du tenant</h2>
          <p>Solde, statut et historique des mouvements.</p>
        </div>
        <div className="wallet-actions">
          <label className="wallet-toggle">
            <input
              type="radio"
              name="mode"
              value="CREDIT"
              checked={mode === 'CREDIT'}
              onChange={() => setMode('CREDIT')}
            />
            Créditer
          </label>
          <label className="wallet-toggle">
            <input
              type="radio"
              name="mode"
              value="DEBIT"
              checked={mode === 'DEBIT'}
              onChange={() => setMode('DEBIT')}
            />
            Débiter
          </label>
        </div>
      </div>

      {loading ? <div className="wallet-status">Chargement…</div> : null}
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
            <div className="wallet-label">Dernière transaction</div>
            <div>{wallet.lastTransactionAt || '—'}</div>
          </div>
        </div>
      ) : null}

      <div className="wallet-form">
        <TextInput
          label="Montant"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <TextInput
          label="Raison"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <TextInput
          label="Référence"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
        <Button variant="primary" disabled={processing} onClick={submit}>
          {processing ? 'Traitement…' : mode === 'DEBIT' ? 'Débiter' : 'Créditer'}
        </Button>
      </div>

      <div className="wallet-table">
        <div className="wallet-table-head">
          <div>Date</div>
          <div>Type</div>
          <div>Montant</div>
          <div>Avant</div>
          <div>Après</div>
          <div>Raison</div>
          <div>Réf</div>
        </div>
        {txns.map((t) => (
          <div key={t.id} className="wallet-table-row">
            <div>{t.transactionDate}</div>
            <div>{t.type}</div>
            <div>{t.amount}</div>
            <div>{t.balanceBefore}</div>
            <div>{t.balanceAfter}</div>
            <div>{t.reason}</div>
            <div>{t.reference || '—'}</div>
          </div>
        ))}
        {txns.length === 0 ? <div className="wallet-empty">Aucune transaction</div> : null}
      </div>
    </div>
  )
}
