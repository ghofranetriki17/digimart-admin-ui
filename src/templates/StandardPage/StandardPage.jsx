import PageContainer from '../../components/atoms/PageContainer'
import PageHeader from '../../components/organisms/PageHeader'
import './StandardPage.css'

export default function StandardPage({
  title,
  badge,
  subtitle,
  actions,
  align = 'center',
  className = '',
  children,
}) {
  const classes = `standard-page ${className}`.trim()
  return (
    <PageContainer className={classes}>
      <PageHeader
        title={title}
        badge={badge}
        subtitle={subtitle}
        actions={actions}
        align={align}
      />
      {children}
    </PageContainer>
  )
}
