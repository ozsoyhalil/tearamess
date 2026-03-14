// INFRA-02: Middleware auth guard
// These stubs are filled by plan 01-03 (middleware implementation)
describe('middleware auth guard', () => {
  it.todo('redirects unauthenticated user from /profile to /auth/login')
  it.todo('redirects unauthenticated user from /new to /auth/login')
  it.todo('allows unauthenticated user to access /explore (returns NextResponse.next)')
  it.todo('allows authenticated user to access /profile')
})
