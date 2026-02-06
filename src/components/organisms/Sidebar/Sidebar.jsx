import { useEffect, useState } from 'react'
import { DIGIMART_GPT_URL } from '../../../config/links'
import './Sidebar.css'

export default function Sidebar({ open, onClose, onLogout, onSelect, activeKey }) {
  const [openSection, setOpenSection] = useState('overview')

  useEffect(() => {
    const sectionByKey = {
      dashboard: 'overview',
      users: 'operations',
      stores: 'operations',
      sectors: 'operations',
      'admin-tenants': 'operations',
      'billing-config': 'billing',
      'billing-plans': 'billing',
    }
    const next = sectionByKey[activeKey]
    if (!next) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenSection((prev) => (prev === next ? prev : next))
  }, [activeKey])

  const toggleSection = (key) => {
    setOpenSection((prev) => (prev === key ? '' : key))
  }

  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="sidebar-logo">D</span>
          <div>
            <div className="sidebar-title">Digimart</div>
            <div className="sidebar-subtitle">Admin Hub</div>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          Close
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <button
            type="button"
            className="sidebar-section-title toggle"
            onClick={() => toggleSection('overview')}
          >
            Vue d'ensemble
            <span className={`sidebar-chevron ${openSection === 'overview' ? 'open' : ''}`}>
              v
            </span>
          </button>
          {openSection === 'overview' ? (
            <div className="sidebar-sublist">
              <button
                type="button"
                className={`sidebar-link ${activeKey === 'dashboard' ? 'active' : ''}`}
                onClick={() => onSelect?.('dashboard')}
              >
                Tableau de bord
              </button>
            </div>
          ) : null}
        </div>

        <div className="sidebar-section">
          <button
            type="button"
            className="sidebar-section-title toggle"
            onClick={() => toggleSection('operations')}
          >
            Operations
            <span className={`sidebar-chevron ${openSection === 'operations' ? 'open' : ''}`}>
              v
            </span>
          </button>
          {openSection === 'operations' ? (
            <div className="sidebar-sublist">
              <button
                type="button"
                className={`sidebar-link ${activeKey === 'users' ? 'active' : ''}`}
                onClick={() => onSelect?.('users')}
              >
                Utilisateurs
              </button>
              <button
                type="button"
                className={`sidebar-link ${activeKey === 'stores' ? 'active' : ''}`}
                onClick={() => onSelect?.('stores')}
              >
                Magasins
              </button>
              <button
                type="button"
                className={`sidebar-link ${activeKey === 'sectors' ? 'active' : ''}`}
                onClick={() => onSelect?.('sectors')}
              >
                Secteurs
              </button>
              <button
                type="button"
                className={`sidebar-link ${activeKey === 'admin-tenants' ? 'active' : ''}`}
                onClick={() => onSelect?.('admin-tenants')}
              >
                Tenants
              </button>
            </div>
          ) : null}
        </div>

        <div className="sidebar-section">
          <button
            type="button"
            className="sidebar-section-title toggle"
            onClick={() => toggleSection('support')}
          >
            Support &amp; IA
            <span className={`sidebar-chevron ${openSection === 'support' ? 'open' : ''}`}>
              v
            </span>
          </button>
          {openSection === 'support' ? (
            <div className="sidebar-sublist">
              <a
                className="sidebar-link"
                href={DIGIMART_GPT_URL}
                target="_blank"
                rel="noreferrer"
              >
                DigiMartGPT
              </a>
            </div>
          ) : null}
        </div>

        <div className="sidebar-section">
          <button
            type="button"
            className="sidebar-section-title toggle"
            onClick={() => toggleSection('billing')}
          >
            Billing
            <span className={`sidebar-chevron ${openSection === 'billing' ? 'open' : ''}`}>
              v
            </span>
          </button>
          {openSection === 'billing' ? (
            <div className="sidebar-sublist">
              <button
                type="button"
                className={`sidebar-link ${activeKey === 'billing-config' ? 'active' : ''}`}
                onClick={() => onSelect?.('billing-config')}
              >
                Billing config
              </button>
              <button
                type="button"
                className={`sidebar-link ${activeKey === 'billing-plans' ? 'active' : ''}`}
                onClick={() => onSelect?.('billing-plans')}
              >
                Plans &amp; features
              </button>
            </div>
          ) : null}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout" onClick={onLogout}>
          Logout
        </button>
        <div className="sidebar-user">
          <span className="sidebar-avatar">AD</span>
          <div>
            <div className="sidebar-user-name">Admin</div>
            <div className="sidebar-user-role">Plateforme</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

