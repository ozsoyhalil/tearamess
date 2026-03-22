'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import StarRating from '@/components/StarRating'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { getPlaceBySlug } from '@/lib/services/places'
import { getReviewsForPlace, createReview } from '@/lib/services/reviews'
import { isPlaceInWishlist } from '@/lib/services/lists'
import { reviewSchema, ReviewInput } from '@/lib/schemas/reviews'
import { WishlistButton } from '@/components/WishlistButton'
import { ListItemSelector } from '@/components/ListItemSelector'
import { useAuth } from '@/context/AuthContext'
import { CAT_GRADIENT, CAT_EMOJI, DEFAULT_GRADIENT, resolvePhotoSrc } from '@/components/PlaceCard'
import type { Review } from '@/types/review'
import type { Place } from '@/types/place'

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
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showListSelector, setShowListSelector] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0 },
  })

  const ratingValue = watch('rating')

  const fetchReviews = async (placeId: string) => {
    const { data, error } = await getReviewsForPlace(placeId)

    if (error || !data) return

    setReviews(data)

    if (data.length > 0) {
      const avg = Math.round(data.reduce((s, r) => s + r.rating, 0) / data.length * 2) / 2
      setAvgRating(avg)
    } else {
      setAvgRating(null)
    }

    if (user) setAlreadyReviewed(data.some(r => r.user_id === user.id))
  }

  useEffect(() => {
    const load = async () => {
      const { data, error } = await getPlaceBySlug(slug)

      if (error || !data) { setNotFound(true); setPageLoading(false); return }
      setPlace(data)
      await fetchReviews(data.id)

      if (user) {
        const { data: wishlisted } = await isPlaceInWishlist(user.id, data.id)
        setIsWishlisted(wishlisted)
      }

      setPageLoading(false)
    }
    load()
  }, [slug, user])

  useEffect(() => {
    if (place && user) setAlreadyReviewed(reviews.some(r => r.user_id === user.id))
  }, [user, reviews])

  const onSubmit = async (values: ReviewInput) => {
    if (!user) return
    const { error } = await createReview({
      place_id: place!.id,
      user_id: user.id,
      rating: values.rating,
      content: values.content || null,
      visit_date: values.visit_date || null,
    })

    if (error) {
      setError('root', { message: error })
      return
    }
    reset({ rating: 0, content: '', visit_date: '' })
    await fetchReviews(place!.id)
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

  const heroPhotoSrc = place.cover_image_url ? resolvePhotoSrc(place.cover_image_url) : null

  return (
    <>
      <Navbar />

      {/* Hero — full width, outside max-w container */}
      {heroPhotoSrc ? (
        <div className="relative w-full h-64 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroPhotoSrc}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      ) : (
        <div
          className="w-full h-40"
          style={{ background: CAT_GRADIENT[place.category] ?? DEFAULT_GRADIENT }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl opacity-20">{CAT_EMOJI[place.category] ?? '📍'}</span>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 pt-0 pb-10">

        {/* Place info card — -mt-8 overlap effect */}
        <Card variant="default" className="p-8 mb-6 -mt-8 relative z-10">
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

              {/* Wishlist + list actions */}
              <div className="flex items-center gap-2 mt-3 flex-wrap relative">
                <WishlistButton placeId={place.id} initialIsWishlisted={isWishlisted} />
                {user && (
                  <>
                    <button
                      onClick={() => setShowListSelector(true)}
                      className="text-sm border border-warmgray-300 rounded-lg px-3 py-1.5 hover:bg-warmgray-50 transition-colors"
                    >
                      Listeye Ekle
                    </button>
                    <ListItemSelector
                      placeId={place.id}
                      userId={user.id}
                      isOpen={showListSelector}
                      onClose={() => setShowListSelector(false)}
                    />
                  </>
                )}
              </div>
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
              Yorum yazmak için{' '}
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
              onSubmit={handleSubmit(onSubmit)}
              className="rounded-2xl p-6 border border-warmgray-200 bg-white space-y-5"
              style={{ boxShadow: '0 2px 12px rgba(75,46,43,0.07)' }}
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-warmgray-500">
                  Puan *
                </label>
                <StarRating
                  value={ratingValue}
                  onChange={(v) => setValue('rating', v, { shouldValidate: true })}
                  size="lg"
                />
                {errors.rating && (
                  <p className="text-sm text-red-400 mt-1">{errors.rating.message}</p>
                )}
              </div>

              <Textarea
                label="Yorum"
                id="content"
                {...register('content')}
                rows={3}
                placeholder="Bu mekan hakkında ne düşünüyorsun?"
                error={errors.content?.message}
              />

              <Input
                type="date"
                label="Ziyaret Tarihi"
                id="visit_date"
                {...register('visit_date')}
                className="w-auto"
                error={errors.visit_date?.message}
              />

              {errors.root && <p className="text-sm text-red-400">{errors.root.message}</p>}

              <button
                type="submit"
                disabled={isSubmitting || ratingValue === 0}
                className="px-7 py-3 rounded-xl font-bold text-sm transition-all duration-200 bg-caramel text-cream hover:bg-caramel-dark disabled:bg-warmgray-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Gönderiliyor…' : 'Gönder'}
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
                  className="rounded-xl p-5 bg-white border border-warmgray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
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
