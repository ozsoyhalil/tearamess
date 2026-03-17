'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { followUser, unfollowUser } from '@/lib/services/follows'

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing: boolean
}

export function FollowButton({ targetUserId, initialIsFollowing }: FollowButtonProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isHovering, setIsHovering] = useState(false)
  const [isPending, setIsPending] = useState(false)

  if (!user) return null

  const handleClick = async () => {
    if (isPending) return

    const prevFollowing = isFollowing
    setIsPending(true)
    setIsFollowing(!isFollowing)

    const result = isFollowing
      ? await unfollowUser(user.id, targetUserId)
      : await followUser(user.id, targetUserId)

    if (result.error) {
      setIsFollowing(prevFollowing)
    }

    setIsPending(false)
  }

  let label: string
  let className: string

  if (isFollowing && isHovering) {
    label = 'Takibi Bırak'
    className =
      'px-4 py-1.5 rounded-full text-sm font-medium border border-red-300 text-red-600 bg-white hover:bg-red-50 transition-colors'
  } else if (isFollowing) {
    label = 'Takip Ediliyor'
    className =
      'px-4 py-1.5 rounded-full text-sm font-medium border border-warmgray-300 text-warmgray-500 bg-warmgray-100 transition-colors'
  } else {
    label = 'Takip Et'
    className =
      'px-4 py-1.5 rounded-full text-sm font-medium bg-[var(--color-caramel)] text-white hover:opacity-90 transition-opacity'
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isPending}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  )
}
