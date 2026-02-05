import { useState } from 'react'
import TenantNavbar from '../components/layout/TenantNavbar'
import TenantSidebar from '../components/layout/TenantSidebar'
import './TenantLayout.css'

export default function TenantLayout({
  title,
  tenantName,
  sectorLabel,
  userName,
  planName,
  walletBalance,
  walletCurrency,
  onLogout,
  onSelect,
  activeKey,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="tenant-layout">
      <TenantSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onSelect={onSelect}
        activeKey={activeKey}
      />
      <div className="tenant-layout-content">
        <TenantNavbar
          title={title}
          tenantName={tenantName}
          sectorLabel={sectorLabel}
          userName={userName}
          planName={planName}
          walletBalance={walletBalance}
          walletCurrency={walletCurrency}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="tenant-layout-main">{children}</main>
      </div>
      {sidebarOpen && (
        <button
          type="button"
          className="tenant-layout-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}
    </div>
  )
}
