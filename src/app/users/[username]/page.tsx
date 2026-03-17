'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { ProfileLayout } from '@/components/ProfileLayout'
import { FollowListModal } from '@/components/FollowListModal'
import { useAuth } from '@/context/AuthContext'
import { getProfileByUsername } from '@/lib/services/profiles'
import {
  getFollowerCount,
  getFollowingCount,
  isFollowing as checkIsFollowing,
} from '@/lib/services/follows'
import { getUserVisits } from '@/lib/services/visits'
import type { Profile } from '@/types/profile'
import type { Visit } from '@/types/visit'

export default function UserProfilePage() {
  const { user } = useAuth()
  const params = useParams<{ username: string }>()
  const username = params.username

  const [profile, setProfile] = useState<Profile | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [following, setFollowing] = useState(false)
  const [activeTab, setActiveTab] = useState<'visits' | 'lists' | 'reviews'>('visits')
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [visits, setVisits] = useState<Visit[]>([])
  const [visitsLoaded, setVisitsLoaded] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // Load profile + counts
  useEffect(() => {
    if (!username) return
    let cancelled = false

    const load = async () => {
      setPageLoading(true)

      const profileRes = await getProfileByUsername(username)
      if (cancelled) return

      if (profileRes.error || !profileRes.data) {
        setNotFound(true)
        setPageLoading(false)
        return
      }

      const p = profileRes.data
      setProfile(p)

      const targetUserId = p.user_id ?? ''

      const [followerRes, followingRes, isFollowingRes] = await Promise.all([
        getFollowerCount(targetUserId),
        getFollowingCount(targetUserId),
        user && targetUserId ? checkIsFollowing(user.id, targetUserId) : Promise.resolve({ data: false, error: null }),
      ])

      if (cancelled) return

      setFollowerCount(followerRes.data)
      setFollowingCount(followingRes.data)
      setFollowing(isFollowingRes.data)
      setPageLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [username, user])

  // Load visits when tab is active
  useEffect(() => {
    if (activeTab !== 'visits' || visitsLoaded || !profile) return
    let cancelled = false

    const targetUserId = profile.user_id ?? ''
    if (!targetUserId) return

    getUserVisits(targetUserId).then(({ data }) => {
      if (cancelled) return
      setVisits(data ?? [])
      setVisitsLoaded(true)
    })

    return () => { cancelled = true }
  }, [activeTab, visitsLoaded, profile])

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

  if (notFound || !profile) {
    return (
      <>
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-lg font-medium text-coffee mb-4">Kullanıcı bulunamadı.</p>
          <Link href="/" className="text-sm text-caramel hover:underline">
            Ana sayfaya dön
          </Link>
        </main>
      </>
    )
  }

  const targetUserId = profile.user_id ?? ''
  const isOwnProfile = !!user && user.id === targetUserId

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <ProfileLayout
          profile={profile}
          isOwnProfile={isOwnProfile}
          followerCount={followerCount}
          followingCount={followingCount}
          isFollowing={following}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onFollowerCountClick={() => setShowFollowersModal(true)}
          onFollowingCountClick={() => setShowFollowingModal(true)}
        >
          {/* Visits tab */}
          {activeTab === 'visits' && (
            <div className="flex flex-col gap-3">
              {!visitsLoaded ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
                </div>
              ) : visits.length === 0 ? (
                <p className="text-sm text-warmgray-400 py-4">Henüz ziyaret yok.</p>
              ) : (
                visits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-start justify-between gap-3 p-4 rounded-xl border border-warmgray-100 hover:border-warmgray-200 transition-colors"
                  >
                    <div>
                      {visit.places ? (
                        <Link
                          href={`/place/${visit.places.slug}`}
                          className="font-medium text-coffee hover:text-caramel transition-colors text-sm"
                        >
                          {visit.places.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-warmgray-400">Mekan silindi</span>
                      )}
                      {visit.places && (
                        <p className="text-xs mt-0.5 text-warmgray-400">
                          {visit.places.category}
                          {visit.places.city && ` · ${visit.places.city}`}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-warmgray-400 shrink-0">
                      {new Date(visit.visited_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Lists tab */}
          {activeTab === 'lists' && (
            <p className="text-sm text-warmgray-400 py-4">Henüz liste yok.</p>
          )}

          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <p className="text-sm text-warmgray-400 py-4">Yorumlar yakında burada görünecek.</p>
          )}
        </ProfileLayout>

        {/* Follower/following modals */}
        <FollowListModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          title="Takipçiler"
          userId={targetUserId}
          listType="followers"
          currentUserId={user?.id}
        />
        <FollowListModal
          isOpen={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          title="Takip Edilenler"
          userId={targetUserId}
          listType="following"
          currentUserId={user?.id}
        />
      </main>
    </>
  )
}
