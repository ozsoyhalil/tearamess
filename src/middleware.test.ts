/**
 * @jest-environment node
 */
import { type NextRequest } from 'next/server'
import { middleware } from './middleware'

// Mock createMiddlewareClient to control auth.getUser() return
const mockGetUser = jest.fn()
jest.mock('@/lib/supabase-server', () => ({
  createMiddlewareClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}))

function makeRequest(pathname: string): NextRequest {
  return {
    nextUrl: { pathname },
    url: `http://localhost${pathname}`,
    cookies: { getAll: () => [] },
  } as unknown as NextRequest
}

describe('middleware auth guard', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
  })

  it('redirects unauthenticated user from /profile to /auth/login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/profile')
    const res = await middleware(req)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get('location')).toContain('/auth/login')
  })

  it('redirects unauthenticated user from /new to /auth/login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/new')
    const res = await middleware(req)
    expect(res.headers.get('location')).toContain('/auth/login')
  })

  it('allows unauthenticated user to access /explore', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = makeRequest('/explore')
    const res = await middleware(req)
    const location = res.headers.get('location')
    expect(location == null || !location.includes('/auth/login')).toBe(true)
  })

  it('allows authenticated user to access /profile', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    const req = makeRequest('/profile')
    const res = await middleware(req)
    const location = res.headers.get('location')
    expect(location == null || !location.includes('/auth/login')).toBe(true)
  })
})
