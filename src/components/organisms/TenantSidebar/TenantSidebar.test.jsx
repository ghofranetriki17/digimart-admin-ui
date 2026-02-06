import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DIGIMART_GPT_URL } from '../../../config/links'
import TenantSidebar from './TenantSidebar'

test('tenant sidebar exposes DigiMartGPT link', async () => {
  render(
    <TenantSidebar
      open
      onClose={() => {}}
      onLogout={() => {}}
      onSelect={() => {}}
      activeKey="dashboard"
    />,
  )

  const toggle = screen.getByRole('button', { name: /Support & IA/i })
  await userEvent.click(toggle)

  const link = screen.getByRole('link', { name: /DigiMartGPT/i })
  expect(link).toHaveAttribute('href', DIGIMART_GPT_URL)
})
