import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './LoginPage'

const baseProps = {
  mode: 'login',
  registerStep: 1,
  newTenantName: '',
  contactEmail: '',
  contactPhone: '',
  ownerFirstName: '',
  ownerLastName: '',
  email: '',
  password: '',
  registeredSubdomain: '',
  error: '',
  loading: false,
  onChange: () => {},
  onSubmit: (e) => e.preventDefault(),
  onSwitchMode: () => {},
  onBackToLogin: () => {},
}

test('renders login fields in login mode', () => {
  render(<LoginPage {...baseProps} />)
  expect(screen.getByText('Digimart Login')).toBeInTheDocument()
  expect(screen.getByLabelText('Email')).toBeInTheDocument()
  expect(screen.getByLabelText('Password')).toBeInTheDocument()
})

test('renders tenant step 1 fields and logo upload', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()

  render(
    <LoginPage
      {...baseProps}
      mode="register"
      registerStep={1}
      onChange={onChange}
    />
  )

  expect(screen.getByLabelText('Tenant Name')).toBeInTheDocument()
  expect(screen.getByLabelText('Contact Email')).toBeInTheDocument()
  expect(screen.getByLabelText('Contact Phone')).toBeInTheDocument()
  expect(screen.getByText('Logo')).toBeInTheDocument()

  const file = new File(['logo'], 'logo.png', { type: 'image/png' })
  const input = screen.getByLabelText('Logo')
  await user.upload(input, file)
  expect(onChange).toHaveBeenCalledWith('logoFile', file)
})
