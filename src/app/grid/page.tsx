'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getUserVisitsWithCoords } from '@/lib/services/visits'
import { buildCellCounts, latLngToCellKey, isInAnkaraBounds } from '@/lib/grid'
import Navbar from '@/components/Navbar'
import type { VisitWithCoords } from '@/types/visit'

const GridMap = dynamic(() => import('./GridMap'), {
  ssr: false,
  loading: () => (
    <div
      className="flex-1 flex items-center justify-center bg-cream"
      style={{ height: 'calc(100vh - 64px)' }}
    >
      <div className="w-8 h-8 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
    </div>
  ),
})

interface CellPlaceEntry {
  placeId: string
  placeName: string
  slug: string
  visitedAt: string
}

function buildCellPlaces(visits: VisitWithCoords[]): Record<string, CellPlaceEntry[]> {
  const result: Record<string, CellPlaceEntry[]> = {}
  for (const v of visits) {
    const lat = v.places?.latitude
    const lng = v.places?.longitude
    if (lat == null || lng == null) continue
    if (!isInAnkaraBounds(lat, lng)) continue
    const key = latLngToCellKey(lat, lng)
    const entry: CellPlaceEntry = {
      placeId: v.place_id,
      placeName: v.places?.name ?? v.place_id,
      slug: v.places?.slug ?? v.place_id,
      visitedAt: v.visited_at,
    }
    result[key] = [...(result[key] ?? []), entry]
  }
  return result
}

export default function GridPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [cellCounts, setCellCounts] = useState<Record<string, number>>({})
  const [cellPlaces, setCellPlaces] = useState<Record<string, CellPlaceEntry[]>>({})
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const { data } = await getUserVisitsWithCoords(user.id)
      if (data) {
        setCellCounts(buildCellCounts(data))
        setCellPlaces(buildCellPlaces(data))
      }
      setDataLoading(false)
    }
    load()
  }, [user])

  if (loading || dataLoading) {
    return (
      <>
        <Navbar />
        <div
          className="flex items-center justify-center bg-cream"
          style={{ height: 'calc(100vh - 64px)' }}
        >
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <GridMap cellCounts={cellCounts} cellPlaces={cellPlaces} />
    </>
  )
}
