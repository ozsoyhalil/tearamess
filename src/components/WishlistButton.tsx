'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { addToWishlist, removeFromWishlist } from '@/lib/services/lists'

interface WishlistButtonProps {
  placeId: string
  initialIsWishlisted: boolean
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <path d="M6 2a2 2 0 0 0-2 2v18l8-4 8 4V4a2 2 0 0 0-2-2H6z" />
      </svg>
    )
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M6 2a2 2 0 0 0-2 2v18l8-4 8 4V4a2 2 0 0 0-2-2H6z" />
    </svg>
  )
}

export function WishlistButton({ placeId, initialIsWishlisted }: WishlistButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted)
  const [isHovering, setIsHovering] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (isPending) return

    const prev = isWishlisted
    setIsPending(true)
    setIsWishlisted(!isWishlisted)

    const result = isWishlisted
      ? await removeFromWishlist(user.id, placeId)
      : await addToWishlist(user.id, placeId)

    if (result.error) {
      setIsWishlisted(prev)
    }

    setIsPending(false)
  }

  let label: string
  let iconClassName: string
  let buttonClassName: string

  if (isWishlisted && isHovering) {
    label = 'Listeden Çıkar'
    iconClassName = 'text-warmgray-400'
    buttonClassName =
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-warmgray-300 text-warmgray-500 bg-white hover:bg-warmgray-50 transition-colors'
  } else if (isWishlisted) {
    label = 'Listede'
    iconClassName = 'text-[#C08552]'
    buttonClassName =
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-warmgray-200 text-warmgray-600 bg-warmgray-100 transition-colors'
  } else {
    label = 'Gideceğim Yerler'
    iconClassName = 'text-warmgray-400'
    buttonClassName =
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-warmgray-300 text-espresso bg-white hover:bg-warmgray-50 transition-colors'
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isPending}
      className={`${buttonClassName} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span className={iconClassName}>
        <BookmarkIcon filled={isWishlisted} />
      </span>
      {label}
    </button>
  )
}
