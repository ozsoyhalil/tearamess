'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#F5EDE4',
  border: '1px solid #D4C5B5',
  borderRadius: 12,
  color: '#4B2E2B',
  fontSize: 14,
  outline: 'none',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold italic transition-colors"
            style={{ color: '#C08552' }}
          >
            tearamess
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-1" style={{ color: '#4B2E2B' }}>
            Tekrar Hoş Geldin
          </h1>
          <p className="text-sm" style={{ color: '#9C8E7E' }}>Mekanların seni bekliyor.</p>
        </div>

        <div
          className="rounded-2xl p-8 border"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#E8DDD1',
            boxShadow: '0 4px 24px rgba(75,46,43,0.09)',
          }}
        >
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#4B2E2B' }}
              >
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#C08552'; e.target.style.boxShadow = '0 0 0 3px rgba(192,133,82,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#D4C5B5'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#4B2E2B' }}
              >
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#C08552'; e.target.style.boxShadow = '0 0 0 3px rgba(192,133,82,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#D4C5B5'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {error && (
              <p className="text-sm mb-4" style={{ color: '#ef4444' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-200"
              style={{
                backgroundColor: loading ? '#D4C5B5' : '#C08552',
                color: '#FFF8F0',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(192,133,82,0.35)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#A06B3C' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#C08552' }}
            >
              {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: '#9C8E7E' }}>
          Hesabın yok mu?{' '}
          <Link
            href="/auth/register"
            className="font-semibold transition-colors"
            style={{ color: '#C08552' }}
          >
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  )
}
