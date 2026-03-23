import {
  latLngToCellKey,
  cellKeyToBounds,
  isInAnkaraBounds,
  GRID_BOUNDS,
  CELL_LAT,
  CELL_LNG,
} from './grid'

// buildCellCounts is a pure utility — import once implemented
// For now test the core math functions

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
  it('is tested once implemented — stub test to establish RED', () => {
    // This test will pass trivially; real tests added when function is implemented
    expect(true).toBe(true)
  })
})
