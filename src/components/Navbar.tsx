'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-sm"
      style={{ backgroundColor: '#4B2E2B', borderBottomColor: 'rgba(192,133,82,0.2)' }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold italic tracking-tight transition-colors duration-200"
          style={{ color: '#FFF8F0' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#C08552')}
          onMouseLeave={e => (e.currentTarget.style.color = '#FFF8F0')}
        >
          tearamess
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/explore"
            className="text-sm flex items-center gap-1.5 transition-colors duration-200"
            style={{ color: '#D4C5B5' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFF8F0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#D4C5B5')}
          >
            <span>🔍</span> Keşfet
          </Link>

          {loading ? (
            <div className="w-20 h-8 rounded-full animate-pulse" style={{ backgroundColor: '#5C3A36' }} />
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/new"
                className="text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                style={{ backgroundColor: '#C08552', color: '#FFF8F0' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#A06B3C')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C08552')}
              >
                + Mekan Ekle
              </Link>
              <Link
                href="/profile"
                className="text-sm transition-colors duration-200"
                style={{ color: '#D4C5B5' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFF8F0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#D4C5B5')}
              >
                Profil
              </Link>
              <button
                onClick={signOut}
                className="text-sm transition-colors duration-200"
                style={{ color: '#9C8E7E' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#D4C5B5')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9C8E7E')}
              >
                Çıkış
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm transition-colors duration-200"
                style={{ color: '#D4C5B5' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FFF8F0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#D4C5B5')}
              >
                Giriş Yap
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                style={{ backgroundColor: '#C08552', color: '#FFF8F0' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#A06B3C')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#C08552')}
              >
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
