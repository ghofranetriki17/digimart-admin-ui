import './DashboardPage.css'

export default function DashboardPage({ userName, tenantName, isSuperAdmin }) {
  return (
    <div className="panel">
      <p>
        Hi Mr {userName} - {isSuperAdmin ? 'Platform Admin' : tenantName}
      </p>
      <p>Dashboard content will be built later.</p>
    </div>
  )
}
