import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import './AdminLayout.css'

export default function AdminLayout({
  title,
  onLogout,
  onSelect,
  activeKey,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="layout">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onSelect={onSelect}
        activeKey={activeKey}
      />
      <div className="layout-content">
        <Navbar title={title} onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="layout-main">{children}</main>
      </div>
      {sidebarOpen && (
        <button
          type="button"
          className="layout-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}
    </div>
  )
}
