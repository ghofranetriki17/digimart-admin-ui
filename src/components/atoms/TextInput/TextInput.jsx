import './TextInput.css'

export default function TextInput({
  label,
  hint,
  error,
  className = '',
  ...props
}) {
  return (
    <label className={`ui-field ${className}`.trim()}>
      <span className="ui-field-label">{label}</span>
      <input className="ui-input" {...props} />
      {hint ? <span className="ui-field-hint">{hint}</span> : null}
      {error ? <span className="ui-field-error">{error}</span> : null}
    </label>
  )
}
