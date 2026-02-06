import './Navbar.css'

export default function Navbar({ title, onToggleSidebar }) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="navbar-menu"
          onClick={onToggleSidebar}
          aria-label="Open navigation"
        >
          Menu
        </button>
        <h2>{title}</h2>
      </div>
      <div className="navbar-actions">Digimart</div>
    </header>
  )
}
