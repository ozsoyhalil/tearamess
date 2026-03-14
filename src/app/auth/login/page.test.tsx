import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from './page'

jest.mock('@/lib/services/auth', () => ({
  signIn: jest.fn().mockResolvedValue({ error: null }),
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

describe('LoginPage Zod validation', () => {
  it('shows inline email error when email field is empty on submit', async () => {
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /giriş/i }))
    expect(await screen.findByText(/geçerli bir e-posta/i)).toBeInTheDocument()
  })

  it('shows inline password error when only password is short', async () => {
    render(<LoginPage />)
    // Submit with valid email (type=email accepts this) but too-short password
    await userEvent.type(screen.getByLabelText(/e-posta/i), 'test@example.com')
    await userEvent.click(screen.getByRole('button', { name: /giriş/i }))
    // Password is empty so the min(6) error should appear
    expect(await screen.findByText(/en az 6 karakter/i)).toBeInTheDocument()
  })

  it('shows inline password error when password is shorter than 6 characters', async () => {
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/e-posta/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/şifre/i), '123')
    await userEvent.click(screen.getByRole('button', { name: /giriş/i }))
    expect(await screen.findByText(/en az 6 karakter/i)).toBeInTheDocument()
  })

  it('does not call signIn service when validation fails', async () => {
    const { signIn } = require('@/lib/services/auth')
    render(<LoginPage />)
    await userEvent.click(screen.getByRole('button', { name: /giriş/i }))
    expect(signIn).not.toHaveBeenCalled()
  })

  it('calls signIn service when form is valid', async () => {
    const { signIn } = require('@/lib/services/auth')
    render(<LoginPage />)
    await userEvent.type(screen.getByLabelText(/e-posta/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/şifre/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /giriş/i }))
    expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123')
  })
})
