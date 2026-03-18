'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  getListById,
  getListItems,
  updateListName,
  updateListPrivacy,
  deleteList,
  removePlaceFromList,
} from '@/lib/services/lists'
import { getViewerRatingsForPlaces } from '@/lib/services/reviews'
import StarRating from '@/components/StarRating'
import type { List } from '@/types/list'
import type { ListWithPlaces } from '@/lib/services/lists'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="h-4 bg-warmgray-200 rounded w-1/3" />
      <div className="h-3 bg-warmgray-100 rounded w-1/5" />
      <div className="h-3 bg-warmgray-100 rounded w-1/4" />
    </div>
  )
}

export default function ListDetailPage() {
  const { id: listId } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [list, setList] = useState<List | null>(null)
  const [items, setItems] = useState<ListWithPlaces[]>([])
  const [viewerRatings, setViewerRatings] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Inline name editing
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')

  useEffect(() => {
    if (!listId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)

      const { data: listData } = await getListById(listId)
      if (cancelled) return

      if (!listData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setList(listData)
      setDraftName(listData.name)

      const { data: itemsData } = await getListItems(listId)
      if (cancelled) return

      const fetchedItems = itemsData ?? []
      setItems(fetchedItems)

      if (user && fetchedItems.length > 0) {
        const placeIds = fetchedItems.map((item) => item.place_id)
        const { data: ratingMap } = await getViewerRatingsForPlaces(user.id, placeIds)
        if (!cancelled) {
          setViewerRatings(ratingMap ?? {})
        }
      }

      if (!cancelled) {
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [listId, user])

  const isOwner = !!(user && list && user.id === list.user_id)

  const saveName = async () => {
    const trimmed = draftName.trim()
    if (!trimmed || !list || trimmed === list.name) {
      setEditing(false)
      return
    }
    await updateListName(listId, trimmed)
    setList((prev) => (prev ? { ...prev, name: trimmed } : prev))
    setEditing(false)
  }

  const handlePrivacyToggle = async () => {
    if (!list) return
    const newPublic = !list.is_public
    setList((prev) => (prev ? { ...prev, is_public: newPublic } : prev))
    await updateListPrivacy(listId, newPublic)
  }

  const handleDelete = async () => {
    if (!window.confirm('Bu listeyi silmek istediğinizden emin misiniz?')) return
    await deleteList(listId)
    router.push('/profile')
  }

  const handleRemovePlace = async (placeId: string) => {
    await removePlaceFromList(listId, placeId)
    setItems((prev) => prev.filter((item) => item.place_id !== placeId))
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-warmgray-50 flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-coffee text-lg font-medium">Bu liste bulunamadı.</p>
        <Link href="/profile" className="text-sm text-[#C08552] hover:underline">
          Profile dön
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warmgray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-7 bg-warmgray-200 rounded w-1/2" />
              <div className="h-4 bg-warmgray-100 rounded w-1/4" />
            </div>
          ) : list ? (
            <>
              {/* List name — inline editable for owner */}
              <div className="flex items-center gap-2 mb-1">
                {isOwner && editing ? (
                  <input
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName()
                      if (e.key === 'Escape') {
                        setDraftName(list.name)
                        setEditing(false)
                      }
                    }}
                    onBlur={saveName}
                    className="text-2xl font-bold text-coffee border-b-2 border-[#C08552] outline-none bg-transparent flex-1"
                  />
                ) : (
                  <h1
                    className={`text-2xl font-bold text-coffee ${isOwner ? 'cursor-pointer hover:text-[#C08552] transition-colors' : ''}`}
                    onClick={() => isOwner && setEditing(true)}
                    title={isOwner ? 'Düzenlemek için tıkla' : undefined}
                  >
                    {list.name}
                  </h1>
                )}
              </div>

              {/* Place count */}
              <p className="text-sm text-warmgray-400">{items.length} mekan</p>

              {/* Owner controls (not for wishlist) */}
              {isOwner && !list.is_wishlist && (
                <div className="flex items-center gap-3 mt-3">
                  {/* Privacy toggle */}
                  <button
                    onClick={handlePrivacyToggle}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-warmgray-200 hover:bg-warmgray-100 transition-colors text-warmgray-600"
                  >
                    {list.is_public ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        Herkese Açık
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Gizli
                      </>
                    )}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={handleDelete}
                    className="text-sm px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Listeyi Sil
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Place list */}
        <div className="bg-white rounded-xl shadow-sm divide-y divide-warmgray-100">
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-warmgray-400 text-sm mb-2">
                Bu listede henüz mekan yok. Mekan keşfetmek için{' '}
                <Link href="/explore" className="text-[#C08552] hover:underline">
                  keşfet sayfasına
                </Link>{' '}
                git.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const place = item.places
              const rating = viewerRatings[item.place_id]
              return (
                <div
                  key={item.place_id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-warmgray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-coffee truncate">
                        {place?.name ?? '—'}
                      </span>
                      {place?.category && (
                        <span className="text-xs bg-warmgray-100 text-warmgray-500 px-2 py-0.5 rounded-full shrink-0">
                          {place.category}
                        </span>
                      )}
                    </div>
                    {place?.neighborhood && (
                      <p className="text-xs text-warmgray-400 mt-0.5">{place.neighborhood}</p>
                    )}
                  </div>

                  {/* Viewer's star rating (only if rated) */}
                  {rating !== undefined && (
                    <div className="shrink-0">
                      <StarRating value={rating} size="sm" />
                    </div>
                  )}

                  {/* Owner: remove from list */}
                  {isOwner && (
                    <button
                      onClick={() => handleRemovePlace(item.place_id)}
                      className="shrink-0 text-xs text-warmgray-400 hover:text-red-500 transition-colors ml-1"
                    >
                      Listeden Çıkar
                    </button>
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
