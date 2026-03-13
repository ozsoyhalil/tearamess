'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import StarRating from '@/components/StarRating'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
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
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
        </div>
      </>
    )
  }

  if (notFound || !place) {
    return (
      <>
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-lg mb-2 text-coffee">Mekan bulunamadı.</p>
          <Link href="/explore" className="text-sm text-caramel">← Keşfete dön</Link>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">

        {/* Place info card */}
        <Card variant="default" className="p-8 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <span
                className="inline-block text-sm font-semibold px-3 py-1 rounded-full mb-3 text-caramel"
                style={{ backgroundColor: 'rgba(192,133,82,0.12)' }}
              >
                {place.category}
              </span>
              <h1 className="text-3xl font-bold mb-2 leading-tight text-espresso">
                {place.name}
              </h1>
              <p className="text-sm text-coffee">
                📍 {place.neighborhood ? `${place.neighborhood}, ` : ''}{place.city}
              </p>
            </div>

            {avgRating !== null ? (
              <div className="text-right flex-shrink-0">
                <div className="text-5xl font-black leading-none text-caramel">{avgRating}</div>
                <div className="text-sm font-medium mt-1 text-warmgray-500">{ratingLabel(avgRating)}</div>
                <div className="text-xs mt-0.5 text-warmgray-400">{reviews.length} değerlendirme</div>
              </div>
            ) : (
              <div className="text-sm italic text-warmgray-400">Henüz puan yok</div>
            )}
          </div>

          {avgRating !== null && (
            <div className="mt-4">
              <StarRating value={avgRating} size="md" />
            </div>
          )}

          {place.description && (
            <p
              className="mt-5 pt-5 leading-relaxed text-sm border-t text-coffee border-warmgray-100"
            >
              {place.description}
            </p>
          )}
        </Card>

        {/* Review form */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-4 text-warmgray-500">
            Değerlendirmeni Yaz
          </h2>

          {!user ? (
            <Card variant="default" className="p-6 text-sm text-warmgray-500">
              Değerlendirmek için{' '}
              <Link href="/auth/login" className="font-semibold text-caramel">
                giriş yap
              </Link>.
            </Card>
          ) : alreadyReviewed ? (
            <Card variant="default" className="p-6 text-sm text-warmgray-500">
              Bu mekan için zaten değerlendirme yazdın.
            </Card>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-6 border border-warmgray-200 bg-white space-y-5"
              style={{ boxShadow: '0 2px 12px rgba(75,46,43,0.07)' }}
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-warmgray-500">
                  Puan *
                </label>
                <StarRating
                  value={form.rating}
                  onChange={(v) => setForm(prev => ({ ...prev, rating: v }))}
                  size="lg"
                />
              </div>

              <Textarea
                label="Yorum"
                id="content"
                value={form.content}
                onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
                placeholder="Bu mekan hakkında ne düşünüyorsun?"
              />

              <Input
                type="date"
                label="Ziyaret Tarihi"
                id="visit_date"
                value={form.visit_date}
                onChange={e => setForm(prev => ({ ...prev, visit_date: e.target.value }))}
                className="w-auto"
              />

              {formError && <p className="text-sm text-red-400">{formError}</p>}

              <button
                type="submit"
                disabled={submitting || form.rating === 0}
                className="px-7 py-3 rounded-xl font-bold text-sm transition-all duration-200 bg-caramel text-cream hover:bg-caramel-dark disabled:bg-warmgray-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </form>
          )}
        </div>

        {/* Reviews list */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-4 text-warmgray-500">
            Değerlendirmeler ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm italic text-warmgray-400">
              Henüz değerlendirme yok. İlk sen yaz!
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div
                  key={review.id}
                  className="rounded-xl p-5 bg-warmgray-100"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 bg-caramel text-cream">
                        {(review.profiles?.display_name || review.profiles?.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-espresso">
                          {review.profiles?.display_name || review.profiles?.username || 'Anonim'}
                        </span>
                        {review.profiles?.username && review.profiles.display_name && (
                          <span className="text-xs ml-1.5 text-warmgray-500">
                            @{review.profiles.username}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <StarRating value={review.rating} size="sm" />
                      <div className="text-xs mt-0.5 text-warmgray-500">
                        {review.visit_date
                          ? `Ziyaret: ${review.visit_date}`
                          : new Date(review.created_at).toLocaleDateString('tr-TR', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                      </div>
                    </div>
                  </div>
                  {review.content && (
                    <p className="text-sm leading-relaxed pl-11 text-coffee">
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
