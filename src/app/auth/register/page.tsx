'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-cream">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold italic transition-colors text-caramel"
          >
            tearamess
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-1 text-espresso">
            Tearamess&apos;e Katıl
          </h1>
          <p className="text-sm text-warmgray-500">Mekanlarını keşfet, paylaş, listele.</p>
        </div>

        <div
          className="rounded-2xl p-8 border bg-white border-warmgray-200 shadow-sm"
          style={{ boxShadow: '0 4px 24px rgba(75,46,43,0.09)' }}
        >
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              type="text"
              label="Kullanıcı Adı"
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="kullaniciadi"
              required
            />

            <Input
              type="text"
              label="Görünen Ad"
              id="displayName"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Adın Soyadın"
            />

            <Input
              type="email"
              label="E-posta"
              id="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
            />

            <Input
              type="password"
              label="Şifre"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              required
              minLength={6}
            />

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-200 bg-caramel text-cream hover:bg-caramel-dark disabled:bg-warmgray-300 disabled:cursor-not-allowed"
              style={{ boxShadow: loading ? 'none' : '0 4px 14px rgba(192,133,82,0.35)' }}
            >
              {loading ? 'Kayıt yapılıyor…' : 'Kayıt Ol'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5 text-warmgray-500">
          Zaten hesabın var mı?{' '}
          <Link
            href="/auth/login"
            className="font-semibold transition-colors text-caramel"
          >
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
