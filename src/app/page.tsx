'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { FeedCard } from '@/components/FeedCard'
import { FeedSkeleton } from '@/components/FeedSkeleton'
import { PlaceCard } from '@/components/PlaceCard'
import { useAuth } from '@/context/AuthContext'
import { getFeed } from '@/lib/services/feed'
import { getTopPlaces, getRecentPlaces } from '@/lib/services/places'
import { supabase } from '@/lib/supabase'
import type { FeedItem } from '@/types/feed'
import type { Place } from '@/types/place'

const PAGE_SIZE = 20

type RecentReview = {
  id: string
  rating: number
  content: string | null
  created_at: string
  profiles: { display_name: string | null; username: string | null } | null
  place_name: string | null
  place_slug: string | null
}

// ─── Landing page (logged-out) ───────────────────────────────────────────────

function LandingPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section
        className="min-h-[70vh] flex items-center justify-center px-4 py-20"
        style={{ background: 'linear-gradient(160deg, #F5EDE4 0%, #FFF8F0 60%, #FFF8F0 100%)' }}
      >
        <div className="text-center max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] mb-6 text-caramel">
            Mekanlar için Letterboxd
          </p>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-espresso">
            Her mekanın bir{' '}
            <em className="not-italic text-caramel">hikayesi</em>{' '}
            var.
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-coffee">
            Ziyaret ettiğin mekanları puanla, listele ve keşfet.
            Kafelerden parklara, sokaklardan manzara noktalarına.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/login"
              className="px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 bg-caramel text-cream"
            >
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 rounded-full font-semibold text-base border-2 transition-all duration-300 border-espresso text-espresso hover:bg-espresso hover:text-cream"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-espresso">
            Nasıl Çalışır?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                emoji: '📍',
                title: 'Mekan Ekle',
                desc: 'Keşfettiğin yerleri topluluğa tanıt. Kafe, park, manzara noktası — her yer olabilir.',
              },
              {
                emoji: '🌟',
                title: 'Değerlendir',
                desc: '5 üzerinden, yarım yıldıza kadar hassas puanla. Deneyimini anlat.',
              },
              {
                emoji: '🗺️',
                title: 'Keşfet',
                desc: 'Başkalarının favorilerini bul. Şehre ve kategoriye göre filtrele.',
              },
            ].map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg bg-warmgray-100"
              >
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="font-semibold text-lg mb-2 text-espresso">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-coffee">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

// ─── Discover section (empty feed fallback) ───────────────────────────────────

function DiscoverSection() {
  const [topPlaces, setTopPlaces] = useState<Place[]>([])
  const [recentPlaces, setRecentPlaces] = useState<Place[]>([])
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [top, recent] = await Promise.all([getTopPlaces(6), getRecentPlaces(6)])
      setTopPlaces(top.data ?? [])
      setRecentPlaces(recent.data ?? [])

      const { data: reviewData } = await supabase
        .from('reviews')
        .select('id, rating, content, created_at, profiles(display_name, username), places(name, slug)')
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentReviews((reviewData ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        rating: r.rating as number,
        content: r.content as string | null,
        created_at: r.created_at as string,
        profiles: r.profiles as { display_name: string | null; username: string | null } | null,
        place_name: (r.places as { name?: string; slug?: string } | null)?.name ?? null,
        place_slug: (r.places as { name?: string; slug?: string } | null)?.slug ?? null,
      })))

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="py-4">
      {/* Category explore grid */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-espresso mb-4">Kategorilere Göre Keşfet</h2>
        <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
          {[
            { label: 'Kafe', emoji: '☕' },
            { label: 'Restoran', emoji: '🍽️' },
            { label: 'Park', emoji: '🌿' },
            { label: 'Müze', emoji: '🏛️' },
            { label: 'Bar', emoji: '🍷' },
            { label: 'Kütüphane', emoji: '📚' },
            { label: 'Tarihi Mekan', emoji: '🏰' },
            { label: 'Teras/Çatı', emoji: '🌇' },
            { label: 'Sahil/Plaj', emoji: '🏖️' },
            { label: 'Kitabevi', emoji: '📖' },
          ].map(({ label, emoji }) => (
            <Link
              key={label}
              href={`/explore?category=${encodeURIComponent(label)}`}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-warmgray-100 hover:bg-warmgray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 text-center"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-medium text-espresso leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular places — horizontal carousel */}
      {topPlaces.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-espresso mb-4">Popüler Mekanlar</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
            {topPlaces.map(place => (
              <Link
                key={place.id}
                href={`/place/${place.slug}`}
                className="min-w-[280px] shrink-0 snap-start"
              >
                <PlaceCard place={place} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recently added — horizontal carousel */}
      {recentPlaces.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-espresso mb-4">Yeni Eklenen Mekanlar</h2>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
            {recentPlaces.map(place => (
              <Link
                key={place.id}
                href={`/place/${place.slug}`}
                className="min-w-[280px] shrink-0 snap-start"
              >
                <PlaceCard place={place} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent reviews */}
      {recentReviews.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-espresso mb-4">Son Değerlendirmeler</h2>
          <div className="space-y-3">
            {recentReviews.map(review => (
              <div
                key={review.id}
                className="rounded-xl p-4 border border-warmgray-200 bg-white transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-caramel text-cream flex items-center justify-center text-sm font-bold shrink-0">
                      {(review.profiles?.display_name || review.profiles?.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-espresso">
                        {review.profiles?.display_name || review.profiles?.username || 'Anonim'}
                      </span>
                      {review.place_name && review.place_slug && (
                        <Link href={`/place/${review.place_slug}`} className="block text-xs text-caramel hover:underline">
                          {review.place_name}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-caramel">{review.rating} ★</div>
                    <div className="text-xs text-warmgray-400">
                      {new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
                {review.content && (
                  <p className="text-sm text-coffee leading-relaxed line-clamp-2 pl-10">
                    {review.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="text-center py-6 border-t border-warmgray-100">
        <p className="text-sm text-coffee mb-4">
          Takip ettiğin kişilerin aktiviteleri burada görünecek.
        </p>
        <Link
          href="/explore"
          className="inline-block px-8 py-3 rounded-full font-semibold text-sm bg-caramel text-cream hover:opacity-90 transition-opacity shadow-sm"
        >
          Keşfetmeye Başla
        </Link>
      </div>
    </div>
  )
}

// ─── Feed page (logged-in) ────────────────────────────────────────────────────

function FeedPage({ userId, displayName }: { userId: string; displayName: string }) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)

  // Initial load
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getFeed(userId).then(({ data }) => {
      if (cancelled) return
      const fetched = data ?? []
      setItems(fetched)
      setHasMore(fetched.length === PAGE_SIZE)
      if (fetched.length > 0) {
        setCursor(fetched[fetched.length - 1].created_at)
      }
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [userId])

  // Infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMoreRef.current && hasMore && !loading) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, cursor])

  const loadMore = async () => {
    if (loadingMoreRef.current || !hasMore) return
    loadingMoreRef.current = true
    setLoadingMore(true)

    const { data } = await getFeed(userId, cursor)
    const fetched = data ?? []

    setItems((prev) => [...prev, ...fetched])
    setHasMore(fetched.length === PAGE_SIZE)
    if (fetched.length > 0) {
      setCursor(fetched[fetched.length - 1].created_at)
    }

    loadingMoreRef.current = false
    setLoadingMore(false)
  }

  // Feed is empty (finished loading, no items) → show discover
  if (!loading && items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          {/* Hero greeting */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: 'linear-gradient(135deg, #F5EDE4 0%, #FFF8F0 100%)' }}
          >
            <p className="text-xl font-bold text-espresso">
              Merhaba{displayName ? `, ${displayName}` : ''} 👋
            </p>
            <p className="text-sm mt-1 text-coffee">Bugün nereye gidiyoruz?</p>
          </div>
          <DiscoverSection />
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero greeting */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: 'linear-gradient(135deg, #F5EDE4 0%, #FFF8F0 100%)' }}
        >
          <p className="text-xl font-bold text-espresso">
            Merhaba{displayName ? `, ${displayName}` : ''} 👋
          </p>
          <p className="text-sm mt-1 text-coffee">Bugün nereye gidiyoruz?</p>
        </div>

        {loading ? (
          <FeedSkeleton count={5} />
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <FeedCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>

            {loadingMore && (
              <div className="mt-3">
                <FeedSkeleton count={2} />
              </div>
            )}

            <div ref={sentinelRef} className="h-4" />

            {!hasMore && items.length > 0 && (
              <p className="text-center text-sm text-warmgray-400 py-6">
                Tüm aktiviteler yüklendi.
              </p>
            )}
          </>
        )}
      </main>
    </>
  )
}

// ─── Root page (auth split) ───────────────────────────────────────────────────

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
        </div>
      </>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  const displayName: string =
    user.user_metadata?.full_name as string ??
    user.user_metadata?.name as string ??
    user.email?.split('@')[0] ??
    ''

  return <FeedPage userId={user.id} displayName={displayName} />
}
