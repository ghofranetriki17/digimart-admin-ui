import './ViewToggle.css'

export default function ViewToggle({ value, onChange, options, className = '' }) {
  const classes = `view-toggle ${className}`.trim()
  return (
    <div className={classes}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`view-toggle-button ${value === option.value ? 'active' : ''}`.trim()}
          aria-label={option.ariaLabel || option.label}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
        </button>
      ))}
    </div>
  )
}
