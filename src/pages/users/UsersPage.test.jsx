import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UsersPage from './UsersPage'

const users = [
  {
    id: 1,
    firstName: 'Sara',
    lastName: 'Ali',
    email: 'sara@demo.com',
    enabled: true,
    roles: ['OWNER'],
  },
  {
    id: 2,
    firstName: 'Nader',
    lastName: 'B.',
    email: 'nader@demo.com',
    enabled: false,
    roles: ['ADMIN'],
  },
]

const roles = [
  { id: 1, tenantId: 0, code: 'ADMIN', label: 'Admin', permissions: [] },
  { id: 2, tenantId: 5, code: 'OWNER', label: 'Owner', permissions: [] },
]

const permissions = [
  { id: 1, code: 'USER_READ' },
  { id: 2, code: 'USER_WRITE' },
]

const mockFetch = () => {
  global.fetch = vi.fn((url) => {
    if (String(url).startsWith('/api/users')) {
      return Promise.resolve({ ok: true, json: async () => users })
    }
    if (String(url).startsWith('/api/roles')) {
      return Promise.resolve({ ok: true, json: async () => roles })
    }
    if (String(url).startsWith('/api/permissions')) {
      return Promise.resolve({ ok: true, json: async () => permissions })
    }
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
}

test('loads users and filters by search', async () => {
  mockFetch()
  render(<UsersPage token="t" tenantId={5} />)

  expect(await screen.findByText('Sara Ali')).toBeInTheDocument()
  expect(screen.getByText('Nader B.')).toBeInTheDocument()

  const search = screen.getByPlaceholderText('Rechercher par nom ou email...')
  await userEvent.type(search, 'Sara')

  expect(screen.getByText('Sara Ali')).toBeInTheDocument()
  expect(screen.queryByText('Nader B.')).toBeNull()
})

test('shows stats and role filter works', async () => {
  mockFetch()
  render(<UsersPage token="t" tenantId={5} />)

  await screen.findByText('Sara Ali')

  const roleSelect = screen.getByDisplayValue('Role: Tous')
  await userEvent.selectOptions(roleSelect, 'admin')

  expect(screen.getByText('Nader B.')).toBeInTheDocument()
  expect(screen.queryByText('Sara Ali')).toBeNull()
})
