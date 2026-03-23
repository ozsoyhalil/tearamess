import {
  latLngToCellKey,
  cellKeyToBounds,
  isInAnkaraBounds,
  buildCellCounts,
  GRID_BOUNDS,
  CELL_LAT,
  CELL_LNG,
} from './grid'
import type { VisitWithCoords } from '@/types/visit'

describe('latLngToCellKey', () => {
  it('returns a string in row:col format', () => {
    const key = latLngToCellKey(39.9208, 32.8541)
    expect(key).toMatch(/^\d+:\d+$/)
  })

  it('maps Kızılay coordinates to expected row:col', () => {
    // row = floor((39.9208 - GRID_BOUNDS.minLat) / CELL_LAT)
    // col = floor((32.8541 - GRID_BOUNDS.minLng) / CELL_LNG)
    const expectedRow = Math.floor((39.9208 - GRID_BOUNDS.minLat) / CELL_LAT)
    const expectedCol = Math.floor((32.8541 - GRID_BOUNDS.minLng) / CELL_LNG)
    expect(latLngToCellKey(39.9208, 32.8541)).toBe(`${expectedRow}:${expectedCol}`)
  })
})

describe('cellKeyToBounds', () => {
  it('returns a [[lat,lng],[lat,lng]] tuple with numeric values', () => {
    const bounds = cellKeyToBounds('38:66')
    expect(bounds).toHaveLength(2)
    expect(bounds[0]).toHaveLength(2)
    expect(bounds[1]).toHaveLength(2)
    expect(typeof bounds[0][0]).toBe('number')
    expect(typeof bounds[1][1]).toBe('number')
  })

  it('returns NE corner strictly above SW corner', () => {
    const bounds = cellKeyToBounds('38:66')
    const [sw, ne] = bounds
    expect(ne[0]).toBeGreaterThan(sw[0]) // neLat > swLat
    expect(ne[1]).toBeGreaterThan(sw[1]) // neLng > swLng
  })
})

describe('isInAnkaraBounds', () => {
  it('returns true for Kızılay (center of Ankara)', () => {
    expect(isInAnkaraBounds(39.9208, 32.8541)).toBe(true)
  })

  it('returns false for Istanbul coordinates', () => {
    expect(isInAnkaraBounds(41.0082, 28.9784)).toBe(false)
  })
})

describe('buildCellCounts', () => {
  const makeVisit = (lat: number | null, lng: number | null): VisitWithCoords => ({
    id: 'v1',
    user_id: 'u1',
    place_id: 'p1',
    visited_at: '2026-01-01T00:00:00Z',
    places: {
      id: 'p1',
      name: 'Test Place',
      slug: 'test-place',
      latitude: lat,
      longitude: lng,
    },
  })

  it('counts two visits at the same coordinates as 2 in that cell', () => {
    const lat = 39.9208
    const lng = 32.8541
    const visits: VisitWithCoords[] = [makeVisit(lat, lng), makeVisit(lat, lng)]
    const counts = buildCellCounts(visits)
    const key = latLngToCellKey(lat, lng)
    expect(counts[key]).toBe(2)
  })

  it('skips visits where latitude is null', () => {
    const visits: VisitWithCoords[] = [makeVisit(null, 32.8541)]
    const counts = buildCellCounts(visits)
    expect(Object.keys(counts)).toHaveLength(0)
  })

  it('skips visits where longitude is null', () => {
    const visits: VisitWithCoords[] = [makeVisit(39.9208, null)]
    const counts = buildCellCounts(visits)
    expect(Object.keys(counts)).toHaveLength(0)
  })

  it('skips visits outside Ankara bounds', () => {
    // Istanbul coordinates
    const visits: VisitWithCoords[] = [makeVisit(41.0082, 28.9784)]
    const counts = buildCellCounts(visits)
    expect(Object.keys(counts)).toHaveLength(0)
  })

  it('aggregates visits in different cells independently', () => {
    const lat1 = 39.9208
    const lng1 = 32.8541
    const lat2 = 39.85
    const lng2 = 32.75
    const visits: VisitWithCoords[] = [makeVisit(lat1, lng1), makeVisit(lat2, lng2)]
    const counts = buildCellCounts(visits)
    const key1 = latLngToCellKey(lat1, lng1)
    const key2 = latLngToCellKey(lat2, lng2)
    expect(counts[key1]).toBe(1)
    expect(counts[key2]).toBe(1)
  })
})
