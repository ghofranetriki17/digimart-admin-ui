import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DIGIMART_GPT_URL } from '../../../config/links'
import Sidebar from './Sidebar'

test('admin sidebar exposes DigiMartGPT link', async () => {
  render(
    <Sidebar
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
