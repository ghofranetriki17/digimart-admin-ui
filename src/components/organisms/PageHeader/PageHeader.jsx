import './PageHeader.css'

export default function PageHeader({
  title,
  badge,
  subtitle,
  actions,
  align = 'center',
  className = '',
}) {
  const classes = `page-header ${align === 'left' ? 'align-left' : ''} ${className}`.trim()
  return (
    <header className={classes}>
      <div className="page-hero">
        <div className="page-hero-title">
          <h2>{title}</h2>
          {badge ? <span className="page-hero-badge">{badge}</span> : null}
        </div>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-hero-actions">{actions}</div> : null}
    </header>
  )
}
