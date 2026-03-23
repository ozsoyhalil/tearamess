import type { VisitWithCoords } from '@/types/visit'

export const GRID_BOUNDS = {
  minLat: 39.769,
  maxLat: 40.1007,
  minLng: 32.5394,
  maxLng: 33.0064,
}

export const CELL_LAT = 0.004   // ~444m vertical
export const CELL_LNG = 0.0047  // ~400m horizontal

export function latLngToCellKey(lat: number, lng: number): string {
  const row = Math.floor((lat - GRID_BOUNDS.minLat) / CELL_LAT)
  const col = Math.floor((lng - GRID_BOUNDS.minLng) / CELL_LNG)
  return `${row}:${col}`
}

export function cellKeyToBounds(key: string): [[number, number], [number, number]] {
  const [rowStr, colStr] = key.split(':')
  const row = parseInt(rowStr, 10)
  const col = parseInt(colStr, 10)
  const swLat = GRID_BOUNDS.minLat + row * CELL_LAT
  const swLng = GRID_BOUNDS.minLng + col * CELL_LNG
  const neLat = swLat + CELL_LAT
  const neLng = swLng + CELL_LNG
  return [[swLat, swLng], [neLat, neLng]]
}

export function isInAnkaraBounds(lat: number, lng: number): boolean {
  return (
    lat >= GRID_BOUNDS.minLat &&
    lat <= GRID_BOUNDS.maxLat &&
    lng >= GRID_BOUNDS.minLng &&
    lng <= GRID_BOUNDS.maxLng
  )
}

export function buildCellCounts(visits: VisitWithCoords[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const visit of visits) {
    const lat = visit.places?.latitude ?? null
    const lng = visit.places?.longitude ?? null
    if (lat == null || lng == null) continue
    if (!isInAnkaraBounds(lat, lng)) continue
    const key = latLngToCellKey(lat, lng)
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}
