import './SectionHeader.css'

export default function SectionHeader({
  title,
  meta,
  loading = false,
  loadingText = 'Loading...',
  className = '',
}) {
  const classes = `section-header ${className}`.trim()
  return (
    <div className={classes}>
      <h3 className="section-title">{title}</h3>
      <div className="section-meta">
        {meta}
        {loading ? <span className="section-loading">{loadingText}</span> : null}
      </div>
    </div>
  )
}
