'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-sm bg-espresso"
      style={{ borderBottomColor: 'rgba(192,133,82,0.2)' }}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold italic tracking-tight transition-colors duration-200 text-cream hover:text-caramel"
        >
          tearamess
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/explore"
            className="text-sm flex items-center gap-1.5 transition-colors duration-200 text-warmgray-300 hover:text-cream"
          >
            <span>🔍</span> Keşfet
          </Link>

          {loading ? (
            <div className="w-20 h-8 rounded-full animate-pulse bg-espresso-light" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/new"
                className="text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md bg-caramel text-cream hover:bg-caramel-dark"
              >
                + Mekan Ekle
              </Link>
              <Link
                href="/profile"
                className="text-sm transition-colors duration-200 text-warmgray-300 hover:text-cream"
              >
                Profil
              </Link>
              <button
                onClick={signOut}
                className="text-sm transition-colors duration-200 text-warmgray-500 hover:text-warmgray-300"
              >
                Çıkış
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm transition-colors duration-200 text-warmgray-300 hover:text-cream"
              >
                Giriş Yap
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-semibold px-5 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md bg-caramel text-cream hover:bg-caramel-dark"
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
