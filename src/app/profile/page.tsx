'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import StarRating from '@/components/StarRating'
import { Card } from '@/components/ui/Card'
import { ProfileLayout } from '@/components/ProfileLayout'
import { FollowListModal } from '@/components/FollowListModal'
import { CreateListModal } from '@/components/CreateListModal'
import { useAuth } from '@/context/AuthContext'
import { getProfileByUserId } from '@/lib/services/profiles'
import { getUserReviews } from '@/lib/services/reviews'
import { getFollowerCount, getFollowingCount } from '@/lib/services/follows'
import { getUserVisits } from '@/lib/services/visits'
import { getUserLists, deleteList } from '@/lib/services/lists'
import type { Profile } from '@/types/profile'
import type { Review } from '@/types/review'
import type { Visit } from '@/types/visit'
import type { List } from '@/types/list'

type Tab = 'visits' | 'lists' | 'reviews'

export default function ProfilePage() {
  const { user, loading } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('visits')
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [visitsLoaded, setVisitsLoaded] = useState(false)
  const [lists, setLists] = useState<List[]>([])
  const [listsLoading, setListsLoading] = useState(false)
  const [listsLoaded, setListsLoaded] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deletingListId, setDeletingListId] = useState<string | null>(null)

  const handleDeleteList = async (listId: string) => {
    if (!window.confirm('Bu listeyi silmek istediğinizden emin misiniz?')) return
    setDeletingListId(listId)
    await deleteList(listId)
    setLists((prev) => prev.filter((l) => l.id !== listId))
    setDeletingListId(null)
  }

  useEffect(() => {
    if (loading) return
    if (!user) return

    const fetchData = async () => {
      const [profileRes, reviewsRes, followerRes, followingRes, visitsRes] = await Promise.all([
        getProfileByUserId(user.id),
        getUserReviews(user.id),
        getFollowerCount(user.id),
        getFollowingCount(user.id),
        getUserVisits(user.id),
      ])

      if (profileRes.data) setProfile(profileRes.data)
      if (reviewsRes.data) setReviews(reviewsRes.data as Review[])
      if (visitsRes.data) {
        setVisits(visitsRes.data)
        setVisitsLoaded(true)
      }
      setFollowerCount(followerRes.data)
      setFollowingCount(followingRes.data)
      setDataLoading(false)
    }

    fetchData()
  }, [user, loading])

  // Load lists when lists tab is activated
  useEffect(() => {
    if (activeTab !== 'lists' || listsLoaded || !user) return
    let cancelled = false

    setListsLoading(true)
    getUserLists(user.id, true).then(({ data }) => {
      if (cancelled) return
      setLists(data ?? [])
      setListsLoaded(true)
      setListsLoading(false)
    })

    return () => { cancelled = true }
  }, [activeTab, listsLoaded, user])

  if (loading || dataLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
        </div>
      </>
    )
  }

  if (!user) return null

  // Build a profile shape suitable for ProfileLayout (needs user_id).
  // Fall back to Supabase auth user_metadata when no profiles row exists yet
  // (e.g. new users who signed up via OAuth without a seeded profile row).
  const metaDisplayName: string | null =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    (user.email ? user.email.split('@')[0] : null)

  const profileForLayout: import('@/types/profile').Profile = {
    username: profile?.username ?? null,
    display_name: profile?.display_name ?? metaDisplayName,
    avatar_url: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined) ?? null,
    user_id: user.id,
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <ProfileLayout
          profile={profileForLayout}
          isOwnProfile={true}
          followerCount={followerCount}
          followingCount={followingCount}
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
                <p className="text-sm text-warmgray-400 py-4">
                  Henüz ziyaret yok.{' '}
                  <Link href="/explore" className="text-caramel">Mekan keşfet</Link>.
                </p>
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
            <div>
              {/* Header row with create button */}
              <div className="flex items-center justify-between mb-4">
                <span />
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg bg-caramel text-cream hover:opacity-90 transition-opacity"
                >
                  + Yeni Liste
                </button>
              </div>

              {listsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-24 rounded-xl animate-pulse bg-warmgray-100" />
                  ))}
                </div>
              ) : lists.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-warmgray-400 mb-3">Henüz özel liste yok.</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-sm font-medium text-caramel hover:underline"
                  >
                    + Yeni Liste Oluştur
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {lists.map((list) => (
                    <Card key={list.id} variant="interactive" className="p-0 relative">
                      <Link
                        href={`/lists/${list.id}`}
                        className="block p-4 h-full"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-sm font-semibold text-espresso leading-tight line-clamp-2">
                            {list.name}
                          </span>
                          {!list.is_public && (
                            <span
                              className="shrink-0 text-warmgray-400 mt-0.5"
                              title="Gizli liste"
                              aria-label="Gizli liste"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-warmgray-400">
                          {list.item_count ?? 0} mekan
                        </p>
                      </Link>
                      {/* Delete button for non-wishlist lists */}
                      {!list.is_wishlist && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleDeleteList(list.id)
                          }}
                          disabled={deletingListId === list.id}
                          aria-label="Listeyi sil"
                          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-warmgray-300 hover:text-red-400 hover:bg-red-50 transition-colors z-10 disabled:opacity-40"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                        </button>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              <CreateListModal
                userId={user.id}
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreated={(list) => setLists((prev) => [list, ...prev])}
              />
            </div>
          )}

          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <div className="flex flex-col gap-3">
              {reviews.length === 0 ? (
                <p className="text-sm text-warmgray-400 py-4">Henüz review yazmamışsın.</p>
              ) : reviews.map(review => {
                const reviewWithPlace = review as Review & {
                  places?: { name: string; slug: string; category: string; city: string } | null
                }
                return (
                  <Card
                    key={review.id}
                    variant="default"
                    className="p-5 hover:border-warmgray-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <div>
                        {reviewWithPlace.places ? (
                          <Link
                            href={`/place/${reviewWithPlace.places.slug}`}
                            className="font-semibold transition-colors text-espresso hover:text-caramel"
                          >
                            {reviewWithPlace.places.name}
                          </Link>
                        ) : (
                          <span className="text-warmgray-400 font-semibold">Mekan silindi</span>
                        )}
                        {reviewWithPlace.places && (
                          <p className="text-xs mt-0.5">
                            <span className="text-caramel font-semibold">{reviewWithPlace.places.category}</span>
                            <span className="text-warmgray-500"> · {reviewWithPlace.places.city}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <StarRating value={review.rating} size="sm" />
                        <div className="text-xs mt-0.5 text-warmgray-400">
                          {review.visit_date
                            ? `Ziyaret: ${review.visit_date}`
                            : new Date(review.created_at).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                        </div>
                      </div>
                    </div>
                    {review.content && (
                      <p className="text-sm leading-relaxed pt-2 mt-1 border-t border-warmgray-100 text-coffee">
                        {review.content}
                      </p>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </ProfileLayout>

        {/* Follower/following modals */}
        <FollowListModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          title="Takipçiler"
          userId={user.id}
          listType="followers"
          currentUserId={user.id}
        />
        <FollowListModal
          isOpen={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          title="Takip Edilenler"
          userId={user.id}
          listType="following"
          currentUserId={user.id}
        />
      </main>
    </>
  )
}
