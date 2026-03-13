'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import StarRating from '@/components/StarRating'
import { Card } from '@/components/ui/Card'
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
      if (reviewsRes.data) setReviews(reviewsRes.data as unknown as Review[])
      setDataLoading(false)
    }
    fetchData()
  }, [user, loading])

  if (loading || dataLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
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
        <Card variant="default" className="p-8 mb-6">
          <div className="flex items-start gap-5">
            <div>
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold bg-caramel text-cream">
                {(displayName ?? '?')[0].toUpperCase()}
              </div>
              <button className="text-sm mt-1 text-center w-20 text-caramel">
                Düzenle
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-0.5 text-espresso">{displayName}</h1>
              {profile?.username && (
                <p className="text-sm text-coffee">@{profile.username}</p>
              )}
              <p className="text-sm mt-0.5 text-warmgray-500">{user.email}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-6 pt-6 border-t border-warmgray-100">
            {[
              { label: 'Review', value: reviews.length },
              { label: 'Mekan', value: places.length },
              { label: 'Ort. Puan', value: avgRating ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-caramel">{value}</div>
                <div className="text-xs uppercase tracking-wider mt-0.5 text-warmgray-500">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Rating distribution */}
        {reviews.length > 0 && (
          <Card variant="flat" className="p-6 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-warmgray-500">
              Puan Dağılımı
            </h3>
            <div className="flex flex-col gap-2">
              {dist.map(({ star, count }) => {
                const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2.5">
                    <span className="text-xs text-warmgray-500 w-2.5 text-right font-medium">
                      {star}
                    </span>
                    <span className="text-caramel text-xs">★</span>
                    <div className="flex-1 h-2 bg-warmgray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-caramel rounded transition-[width] duration-500 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-warmgray-400 w-3.5 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex border-b border-warmgray-200 mb-5">
          {(['reviews', 'places'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm transition-all duration-200 border-b-2 -mb-px ${
                tab === t
                  ? 'font-semibold text-caramel border-caramel'
                  : 'font-normal text-warmgray-500 border-transparent hover:text-coffee'
              }`}
            >
              {t === 'reviews' ? `Reviewlarım (${reviews.length})` : `Mekanlarım (${places.length})`}
            </button>
          ))}
        </div>

        {/* Reviews */}
        {tab === 'reviews' && (
          <div className="flex flex-col gap-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-warmgray-400">Henüz review yazmamışsın.</p>
            ) : reviews.map(review => (
              <Card
                key={review.id}
                variant="default"
                className="p-5 hover:border-warmgray-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div>
                    {review.places ? (
                      <Link
                        href={`/place/${review.places.slug}`}
                        className="font-semibold transition-colors text-espresso hover:text-caramel"
                      >
                        {review.places.name}
                      </Link>
                    ) : (
                      <span className="text-warmgray-400 font-semibold">Mekan silindi</span>
                    )}
                    {review.places && (
                      <p className="text-xs mt-0.5">
                        <span className="text-caramel font-semibold">{review.places.category}</span>
                        <span className="text-warmgray-500"> · {review.places.city}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <StarRating value={review.rating} size="sm" />
                    <div className="text-xs mt-0.5 text-warmgray-400">
                      {review.visit_date
                        ? `Ziyaret: ${review.visit_date}`
                        : new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                {review.content && (
                  <p className="text-sm leading-relaxed pt-2 mt-1 border-t border-warmgray-100 text-coffee">
                    {review.content}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Places */}
        {tab === 'places' && (
          <div>
            {places.length === 0 ? (
              <p className="text-sm text-warmgray-400">
                Henüz mekan eklememişsin.{' '}
                <Link href="/new" className="text-caramel">İlk mekanını ekle</Link>.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {places.map(place => (
                  <Link key={place.id} href={`/place/${place.slug}`}>
                    <Card variant="interactive" className="p-5">
                      <span
                        className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-2 text-caramel"
                        style={{ backgroundColor: 'rgba(192,133,82,0.12)' }}
                      >
                        {place.category}
                      </span>
                      <h3 className="font-semibold mb-0.5 text-espresso">{place.name}</h3>
                      <p className="text-sm text-warmgray-500">{place.city}</p>
                      <p className="text-xs mt-2 text-warmgray-400">
                        {new Date(place.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </Card>
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
