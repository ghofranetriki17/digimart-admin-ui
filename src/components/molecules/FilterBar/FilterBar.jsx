import './FilterBar.css'

export default function FilterBar({ children, className = '' }) {
  const classes = `filter-bar ${className}`.trim()
  return <div className={classes}>{children}</div>
}
