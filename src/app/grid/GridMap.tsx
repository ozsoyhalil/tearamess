'use client'

import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import { MapContainer, TileLayer, Rectangle } from 'react-leaflet'
import { cellKeyToBounds } from '@/lib/grid'
import type { VisitWithCoords } from '@/types/visit'

interface CellPlaceEntry {
  placeId: string
  placeName: string
  slug: string
  visitedAt: string
}

interface GridMapProps {
  cellCounts: Record<string, number>
  // Map of cell key → list of place visits in that cell
  cellPlaces: Record<string, CellPlaceEntry[]>
}

function visitCountToOpacity(count: number): number {
  return Math.min(count * 0.20, 1.0)
}

export default function GridMap({ cellCounts, cellPlaces }: GridMapProps) {
  const center: [number, number] = [39.9208, 32.8541]
  const [selectedCell, setSelectedCell] = useState<string | null>(null)

  const selectedPlaces = selectedCell ? (cellPlaces[selectedCell] ?? []) : []

  return (
    <div className="relative flex-1" style={{ height: 'calc(100vh - 64px)' }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {Object.entries(cellCounts).map(([key, count]) => (
          <Rectangle
            key={key}
            bounds={cellKeyToBounds(key)}
            pathOptions={{
              fillColor: '#C08552',
              fillOpacity: visitCountToOpacity(count),
              color: '#E0D0C0',
              weight: 0.5,
              opacity: 0.6,
            }}
            eventHandlers={{
              click: () => setSelectedCell(selectedCell === key ? null : key),
            }}
          />
        ))}
      </MapContainer>

      {/* Cell detail panel */}
      {selectedCell && selectedPlaces.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-72 z-[1000] bg-white rounded-2xl shadow-xl border border-warmgray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-espresso">Bu hücrede ziyaret ettiklerin</h3>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-warmgray-400 hover:text-espresso transition-colors"
              aria-label="Kapat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {selectedPlaces.map((entry, i) => (
              <li key={`${entry.placeId}-${i}`}>
                <a
                  href={`/place/${entry.slug}`}
                  className="text-sm text-caramel hover:underline font-medium"
                >
                  {entry.placeName}
                </a>
                <span className="text-xs text-warmgray-400 ml-1.5">
                  {new Date(entry.visitedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
