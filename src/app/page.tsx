'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { FeedCard } from '@/components/FeedCard'
import { FeedSkeleton } from '@/components/FeedSkeleton'
import { useAuth } from '@/context/AuthContext'
import { getFeed } from '@/lib/services/feed'
import type { FeedItem } from '@/types/feed'

const PAGE_SIZE = 20

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

// ─── Feed page (logged-in) ────────────────────────────────────────────────────

function FeedPage({ userId }: { userId: string }) {
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

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-espresso mb-6">Aktivite Akışı</h1>

        {loading ? (
          <FeedSkeleton count={5} />
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-coffee mb-4">
              Henüz kimseyi takip etmiyorsun. Keşfet ve ilginç insanları bul.
            </p>
            <Link
              href="/explore"
              className="inline-block px-6 py-2 rounded-full font-semibold text-sm bg-caramel text-cream hover:opacity-90 transition-opacity"
            >
              Keşfet
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <FeedCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="mt-3">
                <FeedSkeleton count={2} />
              </div>
            )}

            {/* Sentinel for IntersectionObserver */}
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

  return <FeedPage userId={user.id} />
}
