import Button from '../../components/atoms/Button'
import AuthPage from '../../templates/AuthPage'
import TextInput from '../../components/atoms/TextInput'
import './LoginPage.css'

export default function LoginPage({
  mode,
  registerStep,
  newTenantName,
  contactEmail,
  contactPhone,
  ownerFirstName,
  ownerLastName,
  email,
  password,
  registeredSubdomain,
  error,
  loading,
  sectors,
  sectorId,
  onChange,
  onSubmit,
  onSwitchMode,
  onBackToLogin,
}) {
  return (
    <AuthPage>
      <div className="app">
      <h1>{mode === 'register' ? 'Create Your Store' : 'Digimart Login'}</h1>
      <p>
        {mode === 'register'
          ? 'Create a tenant and its first owner account.'
          : 'Sign in to access your dashboard.'}
      </p>

      <form onSubmit={onSubmit} className="form">
        {mode === 'register' && registerStep === 1 ? (
          <>
            <TextInput
              label="Tenant Name"
              type="text"
              value={newTenantName}
              onChange={(e) => onChange('newTenantName', e.target.value)}
              required
            />

            <TextInput
              label="Subdomain (auto)"
              type="text"
              value={
                registeredSubdomain
                  ? `${registeredSubdomain}.digimart.tn`
                  : newTenantName
                    ? `${newTenantName
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+/, '')
                        .replace(/-+$/, '')}.digimart.tn`
                    : ''
              }
              readOnly
            />

            <TextInput
              label="Contact Email"
              type="email"
              value={contactEmail}
              onChange={(e) => onChange('contactEmail', e.target.value)}
              required
            />

            <TextInput
              label="Contact Phone"
              type="text"
              value={contactPhone}
              onChange={(e) => onChange('contactPhone', e.target.value)}
              required
            />

            <label className="login-select">
              <span>Secteur d'activite</span>
              <select
                value={sectorId}
                onChange={(e) => onChange('sectorId', e.target.value)}
                required
                disabled={!sectors || sectors.length === 0}
              >
                <option value="">
                  {sectors && sectors.length > 0 ? 'Choisir un secteur' : 'Aucun secteur disponible'}
                </option>
                {sectors?.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="login-file">
              <span>Logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onChange('logoFile', e.target.files?.[0] || null)}
              />
            </label>
          </>
        ) : null}

        {mode === 'register' && registerStep === 2 ? (
          <>
            <TextInput
              label="Owner First Name"
              type="text"
              value={ownerFirstName}
              onChange={(e) => onChange('ownerFirstName', e.target.value)}
              required
            />

            <TextInput
              label="Owner Last Name"
              type="text"
              value={ownerLastName}
              onChange={(e) => onChange('ownerLastName', e.target.value)}
              required
            />
          </>
        ) : null}

        {mode === 'login' || registerStep === 2 ? (
          <>
            <TextInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => onChange('email', e.target.value)}
              required
            />

            <TextInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => onChange('password', e.target.value)}
              required
            />
          </>
        ) : null}

        {error ? <p className="error">{error}</p> : null}

        <div className="actions">
          <Button type="submit" disabled={loading}>
            {loading
              ? mode === 'register'
                ? registerStep === 1
                  ? 'Validating...'
                  : 'Creating...'
                : 'Signing in...'
              : mode === 'register'
                ? registerStep === 1
                  ? 'Validate tenant'
                  : 'Create Store'
                : 'Login'}
          </Button>
          {mode === 'register' ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onBackToLogin}
            >
              Back to login
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={onSwitchMode}
              >
                Create your store
              </Button>
             
            </>
          )}
        </div>
      </form>
      </div>
    </AuthPage>
  )
}


