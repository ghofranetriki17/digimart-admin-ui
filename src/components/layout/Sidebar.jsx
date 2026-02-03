import './Sidebar.css'

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Digimart</div>
      <nav className="sidebar-nav">
        <button type="button" className="sidebar-link">
          Dashboard
        </button>
        <button type="button" className="sidebar-link">
          Users
        </button>
        <button type="button" className="sidebar-link">
          Stores
        </button>
      </nav>
      <button type="button" className="sidebar-logout" onClick={onLogout}>
        Logout
      </button>
    </aside>
  )
}
