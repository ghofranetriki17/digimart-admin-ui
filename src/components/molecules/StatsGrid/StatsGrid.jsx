import './StatsGrid.css'

export default function StatsGrid({
  items,
  className = '',
  cardClassName = '',
  labelClassName = '',
  valueClassName = '',
}) {
  const classes = `stats-grid ${className}`.trim()
  return (
    <div className={classes}>
      {items.map((item) => (
        <div
          key={item.key || item.label}
          className={`stat-card ${cardClassName}`.trim()}
        >
          <div className={`stat-label ${labelClassName}`.trim()}>{item.label}</div>
          <div className={`stat-value ${valueClassName}`.trim()}>{item.value}</div>
        </div>
      ))}
    </div>
  )
}
