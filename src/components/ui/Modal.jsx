import './Modal.css'

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="ui-modal-overlay" role="dialog" aria-modal="true">
      <div className="ui-modal">
        <div className="ui-modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="ui-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>
  )
}
