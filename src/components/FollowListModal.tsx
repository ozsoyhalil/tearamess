'use client'

import { useEffect, useState } from 'react'
import { getFollowers, getFollowing } from '@/lib/services/follows'
import type { FollowProfile } from '@/types/follow'
import { FollowButton } from '@/components/FollowButton'

interface FollowListModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  userId: string
  listType: 'followers' | 'following'
  currentUserId?: string
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-warmgray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-warmgray-200 rounded w-1/3" />
        <div className="h-3 bg-warmgray-100 rounded w-1/4" />
      </div>
    </div>
  )
}

export function FollowListModal({
  isOpen,
  onClose,
  title,
  userId,
  listType,
  currentUserId,
}: FollowListModalProps) {
  const [entries, setEntries] = useState<FollowProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !userId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    const fetchList = listType === 'followers' ? getFollowers : getFollowing

    fetchList(userId).then(({ data, error: fetchError }) => {
      if (cancelled) return
      if (fetchError) {
        setError(fetchError)
      } else {
        setEntries(data ?? [])
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [isOpen, userId, listType])

  if (!isOpen) return null

  const emptyMessage =
    listType === 'followers' ? 'Henüz takipçi yok' : 'Henüz kimseyi takip etmiyor'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm mx-4 bg-white rounded-xl shadow-xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-warmgray-100">
          <h2 className="text-base font-semibold text-coffee">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="text-warmgray-400 hover:text-warmgray-600 transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : error ? (
            <p className="text-center text-red-500 py-8 text-sm">{error}</p>
          ) : entries.length === 0 ? (
            <p className="text-center text-warmgray-400 py-8 text-sm">{emptyMessage}</p>
          ) : (
            entries.map((entry) => {
              const initials = entry.display_name
                ? entry.display_name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : '?'

              return (
                <div
                  key={entry.user_id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-warmgray-50 transition-colors"
                >
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={entry.display_name ?? ''}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-caramel)] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {initials}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coffee truncate">
                      {entry.display_name ?? entry.username ?? 'Kullanıcı'}
                    </p>
                    {entry.username && (
                      <p className="text-xs text-warmgray-400 truncate">@{entry.username}</p>
                    )}
                  </div>

                  {currentUserId && entry.user_id !== currentUserId && (
                    <FollowButton
                      targetUserId={entry.user_id}
                      initialIsFollowing={false}
                    />
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
