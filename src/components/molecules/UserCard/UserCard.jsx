import { FaEdit, FaPhoneAlt, FaEnvelope, FaUserShield } from 'react-icons/fa'
import './UserCard.css'

export default function UserCard({ user, onEdit, onManageRoles }) {
  const roles = user.roles || []
  const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')
  const isOwner = roles.includes('OWNER')
  const roleLabel = isOwner ? 'OWNER' : isAdmin ? 'ADMIN' : 'USER'

  return (
    <div className="user-card">
      <div className="user-card-header">
        <div className="user-card-user">
          <div className="user-card-avatar">
            <img
              src={user.imageUrl || 'https://i.pravatar.cc/80?img=32'}
              alt="User avatar"
            />
          </div>
          <div>
            <div className="user-card-name">
              {user.firstName} {user.lastName}
            </div>
            <div className="user-card-email">{user.email}</div>
          </div>
        </div>
        <span className={`user-card-badge ${roleLabel.toLowerCase()}`}>
          {roleLabel}
        </span>
      </div>

      <div className="user-card-meta">
        <span className={`user-card-status ${user.enabled ? 'active' : 'inactive'}`}>
          {user.enabled ? 'Actif' : 'Inactif'}
        </span>
      </div>

      <div className="user-card-footer">
        <div className="user-card-action-bar">
          {user.phone ? (
            <a href={`tel:${user.phone}`} className="user-card-action-link">
              <FaPhoneAlt />
            </a>
          ) : null}
          {user.email ? (
            <a href={`mailto:${user.email}`} className="user-card-action-link">
              <FaEnvelope />
            </a>
          ) : null}
          <button type="button" onClick={() => onEdit(user)}>
            <FaEdit />
          </button>
          <button type="button" onClick={() => onManageRoles(user)}>
            <FaUserShield />
          </button>
        </div>
      </div>
    </div>
  )
}
