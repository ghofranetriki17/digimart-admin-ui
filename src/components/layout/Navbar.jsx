import './Navbar.css'

export default function Navbar({ title }) {
  return (
    <header className="navbar">
      <h2>{title}</h2>
      <div className="navbar-actions">Digimart</div>
    </header>
  )
}
