import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import './AdminLayout.css'

export default function AdminLayout({ title, onLogout, children }) {
  return (
    <div className="layout">
      <Sidebar onLogout={onLogout} />
      <div className="layout-content">
        <Navbar title={title} />
        <main className="layout-main">{children}</main>
      </div>
    </div>
  )
}
