import './EmptyState.css'

export default function EmptyState({ children, className = '' }) {
  const classes = `empty-state ${className}`.trim()
  return <div className={classes}>{children}</div>
}
