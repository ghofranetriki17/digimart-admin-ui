import { useEffect, useState } from 'react'
import './TenantSidebar.css'

export default function TenantSidebar({
  open,
  onClose,
  onLogout,
  onSelect,
  activeKey,
}) {
  const [openSection, setOpenSection] = useState('catalog')

  useEffect(() => {
    const sectionByKey = {
      products: 'catalog',
      categories: 'catalog',
      'stock-alerts': 'catalog',
      'stock-by-store': 'catalog',
      orders: 'sales',
      pos: 'sales',
      stores: 'sales',
      transactions: 'sales',
      promotions: 'marketing',
      automations: 'growth',
      campaigns: 'growth',
      notifications: 'growth',
      themes: 'appearance',
      marketplace: 'appearance',
      digimartgpt: 'support',
      documentation: 'support',
      'help-center': 'support',
      users: 'support',
    }
    const next = sectionByKey[activeKey]
    if (next && next !== openSection) {
      setOpenSection(next)
    }
  }, [activeKey])

  const toggleSection = (key) => {
    setOpenSection(key)
  }

  return (
    <aside className={`tenant-sidebar ${open ? 'is-open' : ''}`}>
      <div className="tenant-sidebar-header">
        <div className="tenant-sidebar-brand">
          <span className="tenant-sidebar-logo">D</span>
          <div>
            <div className="tenant-sidebar-title">Digimart</div>
            <div className="tenant-sidebar-subtitle">Vendor Hub</div>
          </div>
        </div>
        <button
          type="button"
          className="tenant-sidebar-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          Close
        </button>
      </div>
      <nav className="tenant-sidebar-nav">
        <button
          type="button"
          className={`tenant-sidebar-link ${
            activeKey === 'dashboard' ? 'active' : ''
          }`}
          onClick={() => onSelect?.('dashboard')}
        >
          Tableau de bord
        </button>

        <div className="tenant-sidebar-section">
          <button
            type="button"
            className="tenant-sidebar-section-title toggle"
            onClick={() => toggleSection('catalog')}
          >
            Catalogue
            <span className={`tenant-sidebar-chevron ${openSection === 'catalog' ? 'open' : ''}`}>
              v
            </span>
          </button>
          {openSection === 'catalog' ? (
            <div className="tenant-sidebar-sublist">
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('products')}
              >
                Produits <span className="tenant-sidebar-badge">238</span>
              </button>
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('categories')}
              >
                Categories
              </button>
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('stock-alerts')}
              >
                Stock &amp; Alertes{' '}
                <span className="tenant-sidebar-badge warning">3</span>
              </button>
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('stock-by-store')}
              >
                Stock par magasin
              </button>
            </div>
          ) : null}
        </div>

        <div className="tenant-sidebar-section">
          <button
            type="button"
            className="tenant-sidebar-section-title toggle"
            onClick={() => toggleSection('sales')}
          >
            Ventes
            <span className={`tenant-sidebar-chevron ${openSection === 'sales' ? 'open' : ''}`}>
              v
            </span>
          </button>
          {openSection === 'sales' ? (
            <div className="tenant-sidebar-sublist">
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('orders')}
              >
                Commandes <span className="tenant-sidebar-badge">15</span>
              </button>
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('pos')}
              >
                Point de Vente
              </button>
              <button
                type="button"
                className={`tenant-sidebar-link ${
                  activeKey === 'stores' ? 'active' : ''
                }`}
                onClick={() => onSelect?.('stores')}
              >
                Magasins
              </button>
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('transactions')}
              >
                Transactions
              </button>
            </div>
          ) : null}
        </div>

        <div className="tenant-sidebar-section">
          <button
            type="button"
            className="tenant-sidebar-section-title toggle"
            onClick={() => toggleSection('marketing')}
          >
            Marketing
            <span className={`tenant-sidebar-chevron ${openSection === 'marketing' ? 'open' : ''}`}>
              v
            </span>
          </button>
          {openSection === 'marketing' ? (
            <div className="tenant-sidebar-sublist">
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('promotions')}
              >
                Promotions
              </button>
            </div>
          ) : null}
        </div>

        <div className="tenant-sidebar-section">
          <button
            type="button"
            className="tenant-sidebar-section-title toggle"
            onClick={() => toggleSection('growth')}
          >
            Growth
            <span className={`tenant-sidebar-chevron ${openSection === 'growth' ? 'open' : ''}`}>
              v
            </span>
          </button>
          {openSection === 'growth' ? (
            <div className="tenant-sidebar-sublist">
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('automations')}
              >
                Automation
              </button>
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('campaigns')}
              >
                Campagnes
              </button>
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('notifications')}
              >
                Notifications
              </button>
            </div>
          ) : null}
        </div>

        <div className="tenant-sidebar-section">
          <button
            type="button"
            className="tenant-sidebar-section-title toggle"
            onClick={() => toggleSection('appearance')}
          >
            Apparence
            <span className={`tenant-sidebar-chevron ${openSection === 'appearance' ? 'open' : ''}`}>
              v
            </span>
          </button>
          {openSection === 'appearance' ? (
            <div className="tenant-sidebar-sublist">
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('themes')}
              >
                Themes
              </button>
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('marketplace')}
              >
                Marketplace
              </button>
            </div>
          ) : null}
        </div>

        <div className="tenant-sidebar-section">
          <button
            type="button"
            className="tenant-sidebar-section-title toggle"
            onClick={() => toggleSection('support')}
          >
            Support &amp; IA
            <span className={`tenant-sidebar-chevron ${openSection === 'support' ? 'open' : ''}`}>
              v
            </span>
          </button>
          {openSection === 'support' ? (
            <div className="tenant-sidebar-sublist">
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('digimartgpt')}
              >
                DigiMartGPT
              </button>
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('documentation')}
              >
                Documentation
              </button>
              <button
                type="button"
                className="tenant-sidebar-link"
                onClick={() => onSelect?.('help-center')}
              >
                Centre d'aide
              </button>
              <button
                type="button"
                className={`tenant-sidebar-link ${
                  activeKey === 'users' ? 'active' : ''
                }`}
                onClick={() => onSelect?.('users')}
              >
                Utilisateurs
              </button>
            </div>
          ) : null}
        </div>
      </nav>

      <div className="tenant-sidebar-footer">
        <button type="button" className="tenant-sidebar-logout" onClick={onLogout}>
          Logout
        </button>
        <div className="tenant-sidebar-user">
          <span className="tenant-sidebar-avatar">JD</span>
          <div>
            <div className="tenant-sidebar-user-name">J. Dupont</div>
            <div className="tenant-sidebar-user-role">Store Admin</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
