import './StoreCard.css'
import {
  FaStore,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaEdit,
  FaTrash,
  FaPowerOff,
} from 'react-icons/fa'

export default function StoreCard({ store, onEdit, onDelete, onToggleActive }) {
  return (
    <div className="store-card">
      <div className="store-card-top">
        <div className="store-card-icon" aria-hidden="true">
          <FaStore />
        </div>
        <span
          className={`store-card-status ${
            store.active ? 'active' : 'inactive'
          }`}
        >
          {store.active ? 'Actif' : 'Inactif'}
        </span>
      </div>
      <div className="store-card-title">
        <div className="store-card-name">{store.name}</div>
        <span className="store-card-code">{store.code}</span>
      </div>
      <div className="store-card-type">PHYSIQUE</div>
      <div className="store-card-divider" />
      <div className="store-card-body">
        <div className="store-card-row">
          <span className="store-card-row-icon" aria-hidden="true">
            <FaMapMarkerAlt />
          </span>
          {store.address}, {store.city}
        </div>
        <div className="store-card-row">
          <span className="store-card-row-icon" aria-hidden="true">
            <FaPhoneAlt />
          </span>
          {store.phone || '---'}
        </div>
        <div className="store-card-row">
          <span className="store-card-row-icon" aria-hidden="true">
            <FaEnvelope />
          </span>
          {store.email || '---'}
        </div>
      </div>
      <div className="store-card-actions">
        <button type="button" className="store-card-action" onClick={() => onEdit(store)}>
          <FaEdit /> Edit
        </button>
        <button type="button" className="store-card-action" onClick={() => onToggleActive(store)}>
          <FaPowerOff /> {store.active ? 'Off' : 'On'}
        </button>
        <button type="button" className="store-card-action danger" onClick={() => onDelete(store)}>
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  )
}
