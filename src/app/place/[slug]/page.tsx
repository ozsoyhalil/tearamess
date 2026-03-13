'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import StarRating from '@/components/StarRating'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import type { Review } from '@/types/review'

type Place = {
  id: string
  name: string
  slug: string
  category: string
  city: string
  neighborhood: string | null
  description: string | null
  created_by: string
  created_at: string
}

function ratingLabel(r: number) {
  if (r >= 4.5) return 'Muhteşem'
  if (r >= 4) return 'Harika'
  if (r >= 3.5) return 'Çok İyi'
  if (r >= 3) return 'İyi'
  if (r >= 2) return 'Vasat'
  return 'Zayıf'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#F5EDE4',
  border: '1px solid #D4C5B5',
  borderRadius: 12,
  color: '#4B2E2B',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s',
}

export default function PlacePage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()

  const [place, setPlace] = useState<Place | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [pageLoading, setPageLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [form, setForm] = useState({ rating: 0, content: '', visit_date: '' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  const fetchReviews = async (placeId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(username, display_name)')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })

    const list = (data ?? []) as Review[]
    setReviews(list)

    if (list.length > 0) {
      const avg = Math.round(list.reduce((s, r) => s + r.rating, 0) / list.length * 2) / 2
      setAvgRating(avg)
    } else {
      setAvgRating(null)
    }

    if (user) setAlreadyReviewed(list.some(r => r.user_id === user.id))
  }

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) { setNotFound(true); setPageLoading(false); return }
      setPlace(data)
      await fetchReviews(data.id)
      setPageLoading(false)
    }
    load()
  }, [slug])

  useEffect(() => {
    if (place && user) setAlreadyReviewed(reviews.some(r => r.user_id === user.id))
  }, [user, reviews])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!user) { setFormError('Yorum yazmak için giriş yapmalısın.'); return }
    if (form.rating === 0) { setFormError('Lütfen bir puan ver.'); return }
    setSubmitting(true)

    const { error } = await supabase.from('reviews').insert({
      place_id: place!.id,
      user_id: user.id,
      rating: form.rating,
      content: form.content || null,
      visit_date: form.visit_date || null,
    })

    if (error) { setFormError(error.message); setSubmitting(false); return }
    setForm({ rating: 0, content: '', visit_date: '' })
    await fetchReviews(place!.id)
    setSubmitting(false)
  }

  if (pageLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF8F0' }}>
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#C08552', borderTopColor: 'transparent' }} />
        </div>
      </>
    )
  }

  if (notFound || !place) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-lg mb-2" style={{ color: '#8C5A3C' }}>Mekan bulunamadı.</p>
          <Link href="/explore" className="text-sm" style={{ color: '#C08552' }}>← Keşfete dön</Link>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">

        {/* Place info card */}
        <div
          className="rounded-2xl p-8 mb-6 border"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#E8DDD1',
            boxShadow: '0 2px 12px rgba(75,46,43,0.07)',
          }}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <span
                className="inline-block text-sm font-semibold px-3 py-1 rounded-full mb-3"
                style={{ backgroundColor: 'rgba(192,133,82,0.12)', color: '#C08552' }}
              >
                {place.category}
              </span>
              <h1 className="text-3xl font-bold mb-2 leading-tight" style={{ color: '#4B2E2B' }}>
                {place.name}
              </h1>
              <p className="text-sm" style={{ color: '#8C5A3C' }}>
                📍 {place.neighborhood ? `${place.neighborhood}, ` : ''}{place.city}
              </p>
            </div>

            {avgRating !== null ? (
              <div className="text-right flex-shrink-0">
                <div className="text-5xl font-black leading-none" style={{ color: '#C08552' }}>{avgRating}</div>
                <div className="text-sm font-medium mt-1" style={{ color: '#9C8E7E' }}>{ratingLabel(avgRating)}</div>
                <div className="text-xs mt-0.5" style={{ color: '#B8A898' }}>{reviews.length} değerlendirme</div>
              </div>
            ) : (
              <div className="text-sm italic" style={{ color: '#B8A898' }}>Henüz puan yok</div>
            )}
          </div>

          {avgRating !== null && (
            <div className="mt-4">
              <StarRating value={avgRating} size="md" />
            </div>
          )}

          {place.description && (
            <p
              className="mt-5 pt-5 leading-relaxed text-sm border-t"
              style={{ color: '#8C5A3C', borderTopColor: '#F5EDE4' }}
            >
              {place.description}
            </p>
          )}
        </div>

        {/* Review form */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: '#9C8E7E' }}>
            Değerlendirmeni Yaz
          </h2>

          {!user ? (
            <div
              className="rounded-2xl p-6 border text-sm"
              style={{ backgroundColor: '#ffffff', borderColor: '#E8DDD1', color: '#9C8E7E' }}
            >
              Değerlendirmek için{' '}
              <Link href="/auth/login" className="font-semibold" style={{ color: '#C08552' }}>
                giriş yap
              </Link>.
            </div>
          ) : alreadyReviewed ? (
            <div
              className="rounded-2xl p-6 border text-sm"
              style={{ backgroundColor: '#ffffff', borderColor: '#E8DDD1', color: '#9C8E7E' }}
            >
              Bu mekan için zaten değerlendirme yazdın.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-6 border space-y-5"
              style={{ backgroundColor: '#ffffff', borderColor: '#E8DDD1', boxShadow: '0 2px 12px rgba(75,46,43,0.07)' }}
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#9C8E7E' }}>
                  Puan *
                </label>
                <StarRating
                  value={form.rating}
                  onChange={(v) => setForm(prev => ({ ...prev, rating: v }))}
                  size="lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9C8E7E' }}>
                  Yorum
                </label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                  placeholder="Bu mekan hakkında ne düşünüyorsun?"
                  style={{ ...inputStyle, resize: 'none', minHeight: 90 }}
                  onFocus={e => { e.target.style.borderColor = '#C08552' }}
                  onBlur={e => { e.target.style.borderColor = '#D4C5B5' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#9C8E7E' }}>
                  Ziyaret Tarihi
                </label>
                <input
                  type="date"
                  value={form.visit_date}
                  onChange={e => setForm(prev => ({ ...prev, visit_date: e.target.value }))}
                  style={{ ...inputStyle, width: 'auto' }}
                  onFocus={e => { e.target.style.borderColor = '#C08552' }}
                  onBlur={e => { e.target.style.borderColor = '#D4C5B5' }}
                />
              </div>

              {formError && <p className="text-sm" style={{ color: '#ef4444' }}>{formError}</p>}

              <button
                type="submit"
                disabled={submitting || form.rating === 0}
                className="px-7 py-3 rounded-xl font-bold text-sm transition-all duration-200"
                style={{
                  backgroundColor: form.rating === 0 || submitting ? '#D4C5B5' : '#C08552',
                  color: '#FFF8F0',
                  cursor: form.rating === 0 || submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </form>
          )}
        </div>

        {/* Reviews list */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: '#9C8E7E' }}>
            Değerlendirmeler ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm italic" style={{ color: '#B8A898' }}>
              Henüz değerlendirme yok. İlk sen yaz!
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div
                  key={review.id}
                  className="rounded-xl p-5"
                  style={{ backgroundColor: '#F5EDE4' }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                        style={{ backgroundColor: '#C08552', color: '#FFF8F0' }}
                      >
                        {(review.profiles?.display_name || review.profiles?.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-semibold" style={{ color: '#4B2E2B' }}>
                          {review.profiles?.display_name || review.profiles?.username || 'Anonim'}
                        </span>
                        {review.profiles?.username && review.profiles.display_name && (
                          <span className="text-xs ml-1.5" style={{ color: '#9C8E7E' }}>
                            @{review.profiles.username}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <StarRating value={review.rating} size="sm" />
                      <div className="text-xs mt-0.5" style={{ color: '#9C8E7E' }}>
                        {review.visit_date
                          ? `Ziyaret: ${review.visit_date}`
                          : new Date(review.created_at).toLocaleDateString('tr-TR', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                      </div>
                    </div>
                  </div>
                  {review.content && (
                    <p className="text-sm leading-relaxed pl-11" style={{ color: '#6B4530' }}>
                      {review.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
