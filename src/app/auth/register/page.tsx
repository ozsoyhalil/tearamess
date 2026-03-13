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

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (username.length < 3) {
      setError('Kullanıcı adı en az 3 karakter olmalı.')
      setLoading(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          display_name: displayName || username,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    router.push('/')
  }

  const focusStyle = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = '#C08552'
      e.target.style.boxShadow = '0 0 0 3px rgba(192,133,82,0.15)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.style.borderColor = '#D4C5B5'
      e.target.style.boxShadow = 'none'
    },
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
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
            Tearamess&apos;e Katıl
          </h1>
          <p className="text-sm" style={{ color: '#9C8E7E' }}>Mekanlarını keşfet, paylaş, listele.</p>
        </div>

        <div
          className="rounded-2xl p-8 border"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#E8DDD1',
            boxShadow: '0 4px 24px rgba(75,46,43,0.09)',
          }}
        >
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 16 }}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#4B2E2B' }}>
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="kullaniciadi"
                required
                style={inputStyle}
                {...focusStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#4B2E2B' }}>
                Görünen Ad
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Adın Soyadın"
                style={inputStyle}
                {...focusStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#4B2E2B' }}>
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                required
                style={inputStyle}
                {...focusStyle}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="block text-sm font-medium mb-2" style={{ color: '#4B2E2B' }}>
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                required
                minLength={6}
                style={inputStyle}
                {...focusStyle}
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
              {loading ? 'Kayıt yapılıyor…' : 'Kayıt Ol'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: '#9C8E7E' }}>
          Zaten hesabın var mı?{' '}
          <Link
            href="/auth/login"
            className="font-semibold transition-colors"
            style={{ color: '#C08552' }}
          >
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
