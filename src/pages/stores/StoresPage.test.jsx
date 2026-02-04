import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StoresPage from './StoresPage'

const stores = [
  {
    id: 1,
    name: 'Store A',
    code: 'A1',
    address: 'Main',
    city: 'Tunis',
    postalCode: '1000',
    country: 'TN',
    active: true,
  },
  {
    id: 2,
    name: 'Store B',
    code: 'B1',
    address: 'Side',
    city: 'Sfax',
    postalCode: '3000',
    country: 'TN',
    active: false,
  },
]

const mockFetch = () => {
  global.fetch = vi.fn((url) => {
    if (String(url).startsWith('/api/stores')) {
      return Promise.resolve({
        ok: true,
        json: async () => stores,
      })
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
      text: async () => '',
    })
  })
}

test('loads stores and filters by search', async () => {
  mockFetch()
  render(<StoresPage token="t" tenantId={1} />)

  expect(await screen.findByText('Store A')).toBeInTheDocument()
  expect(screen.getByText('Store B')).toBeInTheDocument()

  const search = screen.getByPlaceholderText('Rechercher par nom, ville, code...')
  await userEvent.type(search, 'Store A')

  expect(screen.getByText('Store A')).toBeInTheDocument()
  expect(screen.queryByText('Store B')).toBeNull()
})

test('opens modal when adding a store', async () => {
  mockFetch()
  render(<StoresPage token="t" tenantId={1} />)

  const addButton = screen.getByText('Ajouter un magasin')
  await userEvent.click(addButton)

  const dialog = screen.getByRole('dialog')
  expect(within(dialog).getByText('Ajouter un magasin')).toBeInTheDocument()
  expect(within(dialog).getByLabelText('Nom')).toBeInTheDocument()
})
