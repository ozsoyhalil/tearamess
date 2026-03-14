import { supabase } from '@/lib/supabase'

export async function signIn(
  email: string,
  password: string
): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function signUp(
  email: string,
  password: string,
  metadata: { username: string; display_name: string }
): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  })
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut()
  if (error) return { error: error.message }
  return { error: null }
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
