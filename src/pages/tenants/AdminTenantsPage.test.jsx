import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminTenantsPage from './AdminTenantsPage'

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div />,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
}))

vi.mock('leaflet', () => {
  class Icon {
    constructor() {}
  }
  const leafletMock = {
    Icon,
    latLngBounds: vi.fn(() => ({})),
  }
  return {
    default: leafletMock,
    ...leafletMock,
  }
})

const tenantId = 10

const mockFetch = () => {
  const tenants = [
    {
      id: tenantId,
      name: 'Acme',
      subdomain: 'acme',
      status: 'ACTIVE',
    },
  ]
  const plans = [{ id: 1, name: 'Starter', price: 10, currency: 'TND' }]
  const wallet = {
    balance: 476,
    currency: 'TND',
    status: 'ACTIVE',
    lastTransactionAt: '2026-02-05T14:05:44.197884',
  }
  const txns = [
    {
      id: 1,
      transactionDate: '2026-02-05',
      type: 'CREDIT',
      amount: 100,
      balanceBefore: 300,
      balanceAfter: 400,
      reason: 'Test',
      reference: 'REF1',
    },
  ]

  global.fetch = vi.fn((url) => {
    const target = String(url)
    if (target === '/api/tenants') {
      return Promise.resolve({ ok: true, json: async () => tenants })
    }
    if (target === '/api/plans') {
      return Promise.resolve({ ok: true, json: async () => plans })
    }
    if (target.includes('/subscriptions/current')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ planId: 1, planName: 'Starter' }),
      })
    }
    if (target === `/api/tenants/${tenantId}`) {
      return Promise.resolve({ ok: true, json: async () => tenants[0] })
    }
    if (target.startsWith(`/api/users?tenantId=${tenantId}`)) {
      return Promise.resolve({ ok: true, json: async () => [] })
    }
    if (target.startsWith(`/api/stores?tenantId=${tenantId}`)) {
      return Promise.resolve({ ok: true, json: async () => [] })
    }
    if (target === `/api/tenants/${tenantId}/wallet`) {
      return Promise.resolve({ ok: true, json: async () => wallet })
    }
    if (target === `/api/tenants/${tenantId}/wallet/transactions`) {
      return Promise.resolve({ ok: true, json: async () => txns })
    }
    if (target === `/api/tenants/${tenantId}/wallet/credit`) {
      return Promise.resolve({ ok: true, json: async () => ({}) })
    }
    return Promise.resolve({ ok: true, json: async () => ({}) })
  })
}

test('admin can credit wallet from tenant details', async () => {
  mockFetch()
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))

  render(<AdminTenantsPage token="t" />)

  const tenantCard = await screen.findByRole('button', { name: /Voir details Acme/i })
  await userEvent.click(tenantCard)

  await screen.findByText('Wallet')

  const amount = screen.getByLabelText('Montant')
  await userEvent.type(amount, '50')

  const creditButton = screen.getByRole('button', { name: /Crediter/i })
  await userEvent.click(creditButton)

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/tenants/${tenantId}/wallet/credit`,
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
