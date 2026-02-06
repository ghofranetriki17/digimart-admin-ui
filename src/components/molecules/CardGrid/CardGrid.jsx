import './CardGrid.css'

const sizeClassMap = {
  sm: 'size-sm',
  md: 'size-md',
  lg: 'size-lg',
}

export default function CardGrid({
  list = false,
  size = 'md',
  className = '',
  children,
}) {
  const sizeClass = sizeClassMap[size] || sizeClassMap.md
  const classes = `card-grid ${sizeClass} ${list ? 'list' : ''} ${className}`.trim()
  return <div className={classes}>{children}</div>
}
