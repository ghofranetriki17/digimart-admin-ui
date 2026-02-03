import './TenantNavbar.css'

export default function TenantNavbar({
  title,
  tenantName,
  userName,
  onToggleSidebar,
}) {
  const initials = userName
    ? userName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <header className="tenant-navbar">
      <div className="tenant-navbar-left">
        <button
          type="button"
          className="tenant-navbar-menu"
          onClick={onToggleSidebar}
          aria-label="Open navigation"
        >
          Menu
        </button>
        <div className="tenant-navbar-title">
          <span className="tenant-navbar-title-text">{title}</span>
          <span className="tenant-navbar-tenant">{tenantName}</span>
        </div>
      </div>
      <div className="tenant-navbar-right">
        <div className="tenant-navbar-search">
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search"
          />
        </div>
        <button type="button" className="tenant-navbar-pill">
          New
        </button>
        <button type="button" className="tenant-navbar-icon" aria-label="Alerts">
          Bell
        </button>
        <div className="tenant-navbar-user">
          <span className="tenant-navbar-avatar">{initials}</span>
          <span className="tenant-navbar-name">{userName || 'User'}</span>
        </div>
      </div>
    </header>
  )
}
