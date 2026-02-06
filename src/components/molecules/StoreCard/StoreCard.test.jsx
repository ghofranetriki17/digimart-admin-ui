import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StoreCard from './StoreCard'

test('calls actions when buttons clicked', async () => {
  const user = userEvent.setup()
  const store = {
    id: 1,
    name: 'Store A',
    code: 'ST-A',
    address: 'Main St',
    city: 'Tunis',
    phone: '111',
    email: 'a@store.com',
    active: true,
  }
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  const onToggleActive = vi.fn()

  render(
    <StoreCard
      store={store}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleActive={onToggleActive}
    />
  )

  await user.click(screen.getByText(/Edit/i))
  await user.click(screen.getByText(/Off/i))
  await user.click(screen.getByText(/Delete/i))

  expect(onEdit).toHaveBeenCalledWith(store)
  expect(onToggleActive).toHaveBeenCalledWith(store)
  expect(onDelete).toHaveBeenCalledWith(store)
})
