import PageContainer from '../../components/atoms/PageContainer'

export default function AuthPage({ children, className = '' }) {
  const classes = `auth-page ${className}`.trim()
  return <PageContainer className={classes}>{children}</PageContainer>
}
