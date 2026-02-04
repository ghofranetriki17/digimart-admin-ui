import './Sidebar.css'

export default function Sidebar({ open, onClose, onLogout, onSelect, activeKey }) {
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
          <div className="sidebar-section-label">Administration</div>
          <button
            type="button"
            className={`sidebar-link ${activeKey === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelect?.('dashboard')}
          >
            Dashboard
          </button>
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
