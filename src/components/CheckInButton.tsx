'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { checkIn } from '@/lib/services/checkIns'
import { toast } from 'sonner'

interface CheckInButtonProps {
  placeId: string
}

export function CheckInButton({ placeId }: CheckInButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [checkedIn, setCheckedIn] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (isPending) return

    setIsPending(true)
    const { error } = await checkIn(user.id, placeId)
    if (!error) {
      setCheckedIn(true)
      toast.success('Mekana check-in yapıldı!')
    } else {
      toast.error('Check-in yapılamadı. Tekrar dene.')
    }
    setIsPending(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        checkedIn
          ? 'bg-[rgba(192,133,82,0.15)] border border-[rgba(192,133,82,0.4)] text-caramel'
          : 'bg-caramel text-cream hover:bg-caramel-dark border border-transparent shadow-sm hover:shadow-md'
      }`}
    >
      {checkedIn ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
          </svg>
          Check edildi
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
          </svg>
          Check In
        </>
      )}
    </button>
  )
}
