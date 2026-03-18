'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import StarRating from '@/components/StarRating'
import type { Place } from '@/types/place'

// ─── Category styles ──────────────────────────────────────────────────────────

export const CAT_GRADIENT: Record<string, string> = {
  'Kafe':           'linear-gradient(135deg, #FDE8C8 0%, #F5E4CE 100%)',
  'Restoran':       'linear-gradient(135deg, #FDD9B5 0%, #F5DDCB 100%)',
  'Park':           'linear-gradient(135deg, #D4E8C8 0%, #E0EDD8 100%)',
  'Müze':           'linear-gradient(135deg, #C8D4E8 0%, #D8DFF5 100%)',
  'Sahil/Plaj':     'linear-gradient(135deg, #C8E8E4 0%, #D8EFF0 100%)',
  'Bar':            'linear-gradient(135deg, #E4C8E8 0%, #EDD8F5 100%)',
  'Teras/Çatı':     'linear-gradient(135deg, #E8D4C8 0%, #F5DFD8 100%)',
  'Doğa/Yürüyüş':  'linear-gradient(135deg, #C8E4C8 0%, #D8EDD8 100%)',
  'Manzara Noktası':'linear-gradient(135deg, #C8DCE8 0%, #D8E5F0 100%)',
  'Kütüphane':      'linear-gradient(135deg, #C8D8E8 0%, #D8E5F5 100%)',
  'Tarihi Mekan':   'linear-gradient(135deg, #E8DCC8 0%, #F5EDD8 100%)',
  'Fırın':          'linear-gradient(135deg, #FDE8C8 0%, #F5E4CE 100%)',
  'Kitabevi':       'linear-gradient(135deg, #C8D8E8 0%, #D8E5F5 100%)',
  'Sanat Galerisi': 'linear-gradient(135deg, #E4C8E8 0%, #EDD8F5 100%)',
  'Çay Bahçesi':    'linear-gradient(135deg, #D4E8C8 0%, #E0EDD8 100%)',
  'Sokak Yemeği':   'linear-gradient(135deg, #FDD9B5 0%, #F5DDCB 100%)',
}

export const DEFAULT_GRADIENT = 'linear-gradient(135deg, #F5EDE4 0%, #E8DDD1 100%)'

export const CAT_EMOJI: Record<string, string> = {
  'Kafe':           '☕',
  'Restoran':       '🍽️',
  'Park':           '🌳',
  'Müze':           '🏛️',
  'Sahil/Plaj':     '🏖️',
  'Bar':            '🍷',
  'Teras/Çatı':     '🌇',
  'Doğa/Yürüyüş':  '🥾',
  'Manzara Noktası':'🌅',
  'Kütüphane':      '📚',
  'Tarihi Mekan':   '🏰',
  'Fırın':          '🥐',
  'Kitabevi':       '📖',
  'Sanat Galerisi': '🎨',
  'Çay Bahçesi':    '🍵',
  'Sokak Yemeği':   '🥙',
}

// ─── Photo URL helper ─────────────────────────────────────────────────────────

function resolvePhotoSrc(url: string): string {
  // Stored as resource name "places/xxx/photos/yyy" → proxy
  if (url.startsWith('places/')) {
    return `/api/photo?name=${encodeURIComponent(url)}`
  }
  // Legacy seed format: full Google URL containing resource name → proxy
  if (url.includes('places.googleapis.com')) {
    const match = url.match(/\/v1\/(places\/[^/]+\/photos\/[^/?]+)/)
    if (match) return `/api/photo?name=${encodeURIComponent(match[1])}`
  }
  // External URL → use as-is
  return url
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PlaceCardProps {
  place: Place
  className?: string
}

export function PlaceCard({ place, className = '' }: PlaceCardProps) {
  const [imgFailed, setImgFailed] = useState(false)

  const gradient = CAT_GRADIENT[place.category] ?? DEFAULT_GRADIENT
  const emoji = CAT_EMOJI[place.category] ?? '📍'
  const photoSrc = place.cover_image_url && !imgFailed
    ? resolvePhotoSrc(place.cover_image_url)
    : null

  return (
    <Card variant="interactive" className={`overflow-hidden ${className}`}>
      {/* Top: photo or category gradient */}
      <div className="h-40 relative overflow-hidden flex items-center justify-center">
        {photoSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoSrc}
              alt={place.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: gradient }}>
            <span className="text-5xl opacity-30 select-none">{emoji}</span>
          </div>
        )}
        <span
          className="absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full text-cream z-10"
          style={{ backgroundColor: 'rgba(75,46,43,0.75)' }}
        >
          {place.category}
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-semibold text-lg leading-snug mb-1 text-espresso">
          {place.name}
        </h3>
        <p className="text-sm mb-4 text-coffee">
          📍 {place.city}{place.neighborhood ? `, ${place.neighborhood}` : ''}
        </p>
        <div className="flex items-center justify-between">
          {place.avg_rating !== null && place.avg_rating !== undefined ? (
            <div className="flex items-center gap-2">
              <StarRating value={place.avg_rating} size="sm" />
              <span className="text-sm font-bold text-caramel">{place.avg_rating}</span>
            </div>
          ) : (
            <span className="text-sm italic text-warmgray-400">Henüz değerlendirilmedi</span>
          )}
          <span className="text-sm text-warmgray-500">{place.review_count ?? 0} review</span>
        </div>
      </div>
    </Card>
  )
}
