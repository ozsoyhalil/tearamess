'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import StarRating from '@/components/StarRating'
import { formatRelativeTime } from '@/lib/utils/relativeTime'
import type { FeedItem } from '@/types/feed'

interface FeedCardProps {
  item: FeedItem
}

export function FeedCard({ item }: FeedCardProps) {
  const { author, place } = item

  const initials = author.display_name
    ? author.display_name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  const authorHref = author.username
    ? `/users/${author.username}`
    : `/users/${item.user_id}`

  return (
    <Card variant="interactive" className="p-4">
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        {author.avatar_url ? (
          <img
            src={author.avatar_url}
            alt={author.display_name ?? ''}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[var(--color-caramel)] flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <Link
            href={authorHref}
            className="text-sm font-semibold text-coffee hover:underline truncate block"
          >
            {author.display_name ?? author.username ?? 'Kullanıcı'}
          </Link>
          <span className="text-xs text-warmgray-400">
            {formatRelativeTime(item.created_at)}
          </span>
        </div>
      </div>

      {/* Place row */}
      <div className="mb-2">
        <Link
          href={`/place/${place.slug}`}
          className="text-sm font-medium text-coffee hover:underline"
        >
          {place.name}
        </Link>
        <span className="text-xs text-warmgray-400 ml-1.5">{place.category}</span>
      </div>

      {/* Variant-specific content */}
      {item.type === 'review' ? (
        <div className="space-y-1.5">
          <StarRating value={item.rating} size="sm" />
          {item.content && (
            <p className="text-sm text-warmgray-600 leading-relaxed">
              {item.content.length > 100
                ? `${item.content.slice(0, 100)}\u2026`
                : item.content}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-warmgray-500">
          <span className="font-medium text-coffee">
            {author.display_name ?? author.username ?? 'Kullanıcı'}
          </span>{' '}
          {place.name}&apos;e gitti
        </p>
      )}
    </Card>
  )
}
