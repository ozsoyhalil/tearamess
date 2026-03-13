'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import StarRating from '@/components/StarRating'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

type Place = {
  id: string; name: string; slug: string
  category: string; city: string; created_at: string
}

type Review = {
  id: string; rating: number; content: string | null
  visit_date: string | null; created_at: string
  places: { name: string; slug: string; category: string; city: string } | null
}

type Tab = 'reviews' | 'places'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [places, setPlaces] = useState<Place[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [profile, setProfile] = useState<{ username: string; display_name: string | null } | null>(null)
  const [tab, setTab] = useState<Tab>('reviews')

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/auth/login'); return }

    const fetchData = async () => {
      const [profileRes, placesRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('username, display_name').eq('id', user.id).single(),
        supabase.from('places').select('id, name, slug, category, city, created_at').eq('created_by', user.id).order('created_at', { ascending: false }),
        supabase.from('reviews').select('id, rating, content, visit_date, created_at, places(name, slug, category, city)').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      if (profileRes.data) setProfile(profileRes.data)
      if (placesRes.data) setPlaces(placesRes.data)
      if (reviewsRes.data) setReviews(reviewsRes.data as Review[])
      setDataLoading(false)
    }
    fetchData()
  }, [user, loading])

  if (loading || dataLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF8F0' }}>
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#C08552', borderTopColor: 'transparent' }} />
        </div>
      </>
    )
  }

  if (!user) return null

  const displayName = profile?.display_name || profile?.username || user.email?.split('@')[0]
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating >= star - 0.5 && r.rating < star + 0.5).length,
  }))

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">

        {/* Profile card */}
        <div
          className="rounded-2xl p-8 border mb-6"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#E8DDD1',
            boxShadow: '0 2px 12px rgba(75,46,43,0.07)',
          }}
        >
          <div className="flex items-start gap-5">
            <div>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: '#C08552', color: '#FFF8F0' }}
              >
                {(displayName ?? '?')[0].toUpperCase()}
              </div>
              <button className="text-sm mt-1 text-center w-20" style={{ color: '#C08552' }}>
                Düzenle
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-0.5" style={{ color: '#4B2E2B' }}>{displayName}</h1>
              {profile?.username && (
                <p className="text-sm" style={{ color: '#8C5A3C' }}>@{profile.username}</p>
              )}
              <p className="text-sm mt-0.5" style={{ color: '#9C8E7E' }}>{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-6 pt-6" style={{ borderTop: '1px solid #F5EDE4' }}>
            {[
              { label: 'Review', value: reviews.length },
              { label: 'Mekan', value: places.length },
              { label: 'Ort. Puan', value: avgRating ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#C08552' }}>{value}</div>
                <div
                  className="text-xs uppercase tracking-wider mt-0.5"
                  style={{ color: '#9C8E7E' }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating distribution */}
        {reviews.length > 0 && (
          <div
            className="rounded-2xl p-6 border mb-6"
            style={{ backgroundColor: '#ffffff', borderColor: '#E8DDD1', boxShadow: '0 2px 8px rgba(75,46,43,0.05)' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#9C8E7E' }}>
              Puan Dağılımı
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dist.map(({ star, count }) => {
                const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#9C8E7E', width: 10, textAlign: 'right', fontWeight: 500 }}>
                      {star}
                    </span>
                    <span style={{ color: '#C08552', fontSize: 12 }}>★</span>
                    <div style={{ flex: 1, height: 8, backgroundColor: '#F5EDE4', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          backgroundColor: '#C08552',
                          borderRadius: 4,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: '#B8A898', width: 14, textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #E8DDD1', display: 'flex', gap: 0, marginBottom: 20 }}>
          {(['reviews', 'places'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? '#C08552' : '#9C8E7E',
                borderBottom: tab === t ? '2px solid #C08552' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: tab === t ? '2px solid #C08552' : '2px solid transparent',
              } as React.CSSProperties}
              onMouseEnter={e => { if (tab !== t) e.currentTarget.style.color = '#8C5A3C' }}
              onMouseLeave={e => { if (tab !== t) e.currentTarget.style.color = '#9C8E7E' }}
            >
              {t === 'reviews' ? `Reviewlarım (${reviews.length})` : `Mekanlarım (${places.length})`}
            </button>
          ))}
        </div>

        {/* Reviews */}
        {tab === 'reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reviews.length === 0 ? (
              <p style={{ color: '#B8A898', fontSize: 14 }}>Henüz review yazmamışsın.</p>
            ) : reviews.map(review => (
              <div
                key={review.id}
                className="rounded-xl p-5 border transition-all duration-200"
                style={{ backgroundColor: '#ffffff', borderColor: '#E8DDD1' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4C5B5'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(75,46,43,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8DDD1'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div>
                    {review.places ? (
                      <Link
                        href={`/place/${review.places.slug}`}
                        className="font-semibold transition-colors"
                        style={{ color: '#4B2E2B' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#C08552')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#4B2E2B')}
                      >
                        {review.places.name}
                      </Link>
                    ) : (
                      <span style={{ color: '#B8A898', fontWeight: 600 }}>Mekan silindi</span>
                    )}
                    {review.places && (
                      <p className="text-xs mt-0.5">
                        <span style={{ color: '#C08552', fontWeight: 600 }}>{review.places.category}</span>
                        <span style={{ color: '#9C8E7E' }}> · {review.places.city}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <StarRating value={review.rating} size="sm" />
                    <div className="text-xs mt-0.5" style={{ color: '#B8A898' }}>
                      {review.visit_date
                        ? `Ziyaret: ${review.visit_date}`
                        : new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                {review.content && (
                  <p
                    className="text-sm leading-relaxed pt-2 mt-1"
                    style={{ color: '#8C5A3C', borderTop: '1px solid #F5EDE4' }}
                  >
                    {review.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Places */}
        {tab === 'places' && (
          <div>
            {places.length === 0 ? (
              <p style={{ color: '#B8A898', fontSize: 14 }}>
                Henüz mekan eklememişsin.{' '}
                <Link href="/new" style={{ color: '#C08552' }}>İlk mekanını ekle</Link>.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {places.map(place => (
                  <Link
                    key={place.id}
                    href={`/place/${place.slug}`}
                    className="rounded-2xl p-5 border transition-all duration-200 group"
                    style={{ backgroundColor: '#ffffff', borderColor: '#E8DDD1' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(75,46,43,0.1)'
                      e.currentTarget.style.borderColor = '#D4C5B5'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = '#E8DDD1'
                    }}
                  >
                    <span
                      className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2"
                      style={{ backgroundColor: 'rgba(192,133,82,0.12)', color: '#C08552' }}
                    >
                      {place.category}
                    </span>
                    <h3 className="font-semibold mb-0.5" style={{ color: '#4B2E2B' }}>{place.name}</h3>
                    <p className="text-sm" style={{ color: '#9C8E7E' }}>{place.city}</p>
                    <p className="text-xs mt-2" style={{ color: '#B8A898' }}>
                      {new Date(place.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
