import PageContainer from '../../components/atoms/PageContainer'
import './DashboardPage.css'

export default function DashboardPage({ userName, tenantName, isSuperAdmin }) {
  return (
    <PageContainer>
      <div className="panel">
        <p>
          Hi Mr {userName} - {isSuperAdmin ? 'Platform Admin' : tenantName}
        </p>
        <p>Dashboard content will be built later.</p>
      </div>
    </PageContainer>
  )
}
