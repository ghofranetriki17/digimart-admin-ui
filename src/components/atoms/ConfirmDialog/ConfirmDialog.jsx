import Button from '../Button'
import Modal from '../Modal'
import './ConfirmDialog.css'

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  onConfirm,
  onCancel,
  danger,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <div className="ui-confirm-body">
        <p>{description}</p>
        <div className="ui-confirm-actions">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button type="button" variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
