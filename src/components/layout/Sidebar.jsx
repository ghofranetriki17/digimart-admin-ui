import './Sidebar.css'

export default function Sidebar({ onLogout, onSelect, activeKey }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Digimart</div>
      <nav className="sidebar-nav">
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
          Users
        </button>
        <button
          type="button"
          className={`sidebar-link ${activeKey === 'stores' ? 'active' : ''}`}
          onClick={() => onSelect?.('stores')}
        >
          Stores
        </button>
      </nav>
      <button type="button" className="sidebar-logout" onClick={onLogout}>
        Logout
      </button>
    </aside>
  )
}
