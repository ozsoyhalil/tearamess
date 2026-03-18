'use client'

import { useEffect, useState } from 'react'
import { getUserLists, addPlaceToList, removePlaceFromList, getPlaceListMembership } from '@/lib/services/lists'
import type { List } from '@/types/list'

interface ListItemSelectorProps {
  placeId: string
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function ListItemSelector({ placeId, userId, isOpen, onClose }: ListItemSelectorProps) {
  const [lists, setLists] = useState<List[]>([])
  const [membership, setMembership] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !userId) return

    let cancelled = false
    setLoading(true)

    Promise.all([
      getUserLists(userId, true),
      getPlaceListMembership(userId, placeId),
    ]).then(([listsResult, membershipResult]) => {
      if (cancelled) return
      setLists(listsResult.data ?? [])
      setMembership(new Set(membershipResult.data ?? []))
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [isOpen, userId, placeId])

  if (!isOpen) return null

  const handleToggle = async (list: List) => {
    const inList = membership.has(list.id)

    // Optimistic update
    setMembership((prev) => {
      const next = new Set(prev)
      if (inList) {
        next.delete(list.id)
      } else {
        next.add(list.id)
      }
      return next
    })

    const { error } = inList
      ? await removePlaceFromList(list.id, placeId)
      : await addPlaceToList(list.id, placeId)

    if (error) {
      // Revert on error
      setMembership((prev) => {
        const next = new Set(prev)
        if (inList) {
          next.add(list.id)
        } else {
          next.delete(list.id)
        }
        return next
      })
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popover panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Listeye Ekle"
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-xs w-full max-h-64 overflow-y-auto"
      >
        {/* Title row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-warmgray-100 sticky top-0 bg-white">
          <h2 className="text-sm font-semibold text-coffee">Listeye Ekle</h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="text-warmgray-400 hover:text-warmgray-600 transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="py-1">
          {loading ? (
            <p className="text-center text-warmgray-400 py-4 text-sm">Listeler yükleniyor...</p>
          ) : lists.length === 0 ? (
            <p className="text-center text-warmgray-400 py-4 text-sm">Henüz liste yok.</p>
          ) : (
            lists.map((list) => {
              const checked = membership.has(list.id)
              const count = list.item_count ?? 0
              return (
                <label
                  key={list.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-warmgray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle(list)}
                    className="w-4 h-4 rounded border-warmgray-300 text-[#C08552] focus:ring-[#C08552]"
                  />
                  <span className="flex-1 text-sm text-coffee truncate">{list.name}</span>
                  <span className="text-xs text-warmgray-400">{count}</span>
                </label>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
