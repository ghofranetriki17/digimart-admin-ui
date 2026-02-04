import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserCard from './UserCard'

test('renders user and triggers actions', async () => {
  const user = userEvent.setup()
  const userData = {
    id: 1,
    firstName: 'Sara',
    lastName: 'Ali',
    email: 'sara@demo.com',
    phone: '555',
    enabled: true,
    roles: ['OWNER'],
  }
  const onEdit = vi.fn()
  const onManageRoles = vi.fn()

  render(
    <UserCard user={userData} onEdit={onEdit} onManageRoles={onManageRoles} />
  )

  expect(screen.getByText('Sara Ali')).toBeInTheDocument()
  expect(screen.getByText('OWNER')).toBeInTheDocument()

  const buttons = screen.getAllByRole('button')
  await user.click(buttons[0])
  await user.click(buttons[1])

  expect(onEdit).toHaveBeenCalledWith(userData)
  expect(onManageRoles).toHaveBeenCalledWith(userData)
})
