'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Profile } from '@/types/profile'
import { FollowButton } from '@/components/FollowButton'

interface ProfileLayoutProps {
  profile: Profile
  isOwnProfile: boolean
  followerCount: number
  followingCount: number
  isFollowing?: boolean
  activeTab: 'visits' | 'lists' | 'reviews'
  onTabChange: (tab: 'visits' | 'lists' | 'reviews') => void
  onFollowerCountClick: () => void
  onFollowingCountClick: () => void
  children: ReactNode
}

const TABS: { key: 'visits' | 'lists' | 'reviews'; label: string }[] = [
  { key: 'visits', label: 'Ziyaretler' },
  { key: 'lists', label: 'Listeler' },
  { key: 'reviews', label: 'Yorumlar' },
]

export function ProfileLayout({
  profile,
  isOwnProfile,
  followerCount,
  followingCount,
  isFollowing,
  activeTab,
  onTabChange,
  onFollowerCountClick,
  onFollowingCountClick,
  children,
}: ProfileLayoutProps) {
  const userId = profile.user_id ?? profile.id ?? ''

  const initials = profile.display_name
    ? profile.display_name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div className="w-full">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-warmgray-100">
        {/* Avatar */}
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name ?? ''}
            className="w-24 h-24 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[var(--color-caramel)] flex items-center justify-center text-white text-3xl font-semibold shrink-0">
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-coffee truncate">
            {profile.display_name ?? profile.username ?? 'Kullanıcı'}
          </h1>
          {profile.username && (
            <p className="text-sm text-warmgray-400 mb-3">@{profile.username}</p>
          )}

          {/* Follow counts */}
          <div className="flex items-center justify-center sm:justify-start gap-4 mb-3">
            <button
              onClick={onFollowerCountClick}
              className="text-sm text-coffee hover:text-caramel transition-colors"
            >
              <span className="font-semibold">{followerCount}</span>{' '}
              <span className="text-warmgray-500">takipçi</span>
            </button>
            <button
              onClick={onFollowingCountClick}
              className="text-sm text-coffee hover:text-caramel transition-colors"
            >
              <span className="font-semibold">{followingCount}</span>{' '}
              <span className="text-warmgray-500">takip edilen</span>
            </button>
          </div>

          {/* Action */}
          {isOwnProfile ? (
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
              <Link
                href="/profile/edit"
                className="inline-block px-5 py-2 rounded-full text-sm font-semibold bg-warmgray-100 hover:bg-warmgray-200 text-espresso transition-all duration-300 border border-warmgray-300"
              >
                Profili D&uuml;zenle
              </Link>
              <Link
                href="/grid"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium border border-warmgray-200 text-warmgray-600 hover:bg-warmgray-50 transition-all duration-200"
              >
                <span>🗺️</span> Haritam
              </Link>
            </div>
          ) : (
            userId && (
              <FollowButton
                targetUserId={userId}
                initialIsFollowing={isFollowing ?? false}
              />
            )
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-warmgray-100 mt-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-[var(--color-caramel)] text-[var(--color-caramel)]'
                : 'border-transparent text-warmgray-500 hover:text-coffee'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">{children}</div>
    </div>
  )
}
