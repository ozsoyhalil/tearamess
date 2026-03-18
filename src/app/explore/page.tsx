'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { PlaceCard } from '@/components/PlaceCard'
import { Input } from '@/components/ui/Input'
import { getPlaces, searchPlaces } from '@/lib/services/places'
import type { Place } from '@/types/place'

const CATEGORIES = [
  'Kafe', 'Restoran', 'Park', 'Müze', 'Sahil/Plaj',
  'Sokak/Cadde', 'Kütüphane', 'Bar', 'Teras/Çatı',
  'Köy/Kasaba', 'Doğa/Yürüyüş', 'Manzara Noktası', 'Tarihi Mekan', 'Diğer',
]

type SearchHit = {
  id: string
  name: string
  slug: string
  category: string
  city: string
}

export default function ExplorePage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [cities, setCities] = useState<string[]>([])

  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDrop, setShowDrop] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await getPlaces()
      if (!data) { setLoading(false); return }

      setPlaces(data)
      setCities([...new Set(data.map(p => p.city))].sort())
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!query.trim()) { setHits([]); setShowDrop(false); return }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      const { data } = await searchPlaces(query)
      setHits(data ?? [])
      setShowDrop(true)
      setSearchLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDrop(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = places.filter(p => {
    const matchCat = activeCategory ? p.category === activeCategory : true
    const matchCity = cityFilter ? p.city === cityFilter : true
    return matchCat && matchCity
  })

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* Header + search */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 text-espresso">Keşfet</h1>
          <p className="text-sm mb-5 text-warmgray-500">
            Topluluk tarafından eklenen mekanları keşfet.
          </p>

          <div ref={searchRef} className="relative max-w-2xl">
            <Input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => hits.length > 0 && setShowDrop(true)}
              placeholder="Mekan ara..."
              className="text-base"
            />
            {searchLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
            )}

            {/* Autocomplete dropdown */}
            {showDrop && (
              <div
                className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 border bg-white border-warmgray-200"
                style={{ boxShadow: '0 8px 30px rgba(75,46,43,0.15)' }}
              >
                {hits.length === 0 ? (
                  <div className="px-5 py-4 text-sm flex items-center justify-between text-warmgray-500">
                    <span>&quot;{query}&quot; bulunamadı</span>
                    <Link
                      href="/new"
                      onClick={() => setShowDrop(false)}
                      className="font-semibold transition-colors text-caramel"
                    >
                      + Bu mekanı ekle
                    </Link>
                  </div>
                ) : (
                  <>
                    {hits.map(hit => (
                      <Link
                        key={hit.id}
                        href={`/place/${hit.slug}`}
                        onClick={() => { setShowDrop(false); setQuery('') }}
                        className="flex items-center justify-between px-5 py-3 transition-colors group border-b border-warmgray-100 hover:bg-cream"
                      >
                        <div>
                          <span className="font-semibold transition-colors text-espresso">
                            {hit.name}
                          </span>
                          <span className="text-xs ml-2 text-warmgray-500">{hit.city}</span>
                        </div>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full text-caramel"
                          style={{ backgroundColor: 'rgba(192,133,82,0.12)' }}
                        >
                          {hit.category}
                        </span>
                      </Link>
                    ))}
                    <div className="px-5 py-2.5 flex justify-end bg-cream">
                      <Link
                        href="/new"
                        onClick={() => setShowDrop(false)}
                        className="text-xs font-medium transition-colors text-caramel"
                      >
                        + Aradığın mekan listede yok mu? Ekle
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
          {['Tümü', ...CATEGORIES].map(cat => {
            const isActive = cat === 'Tümü' ? activeCategory === '' : activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === 'Tümü' ? '' : (cat === activeCategory ? '' : cat))}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-caramel text-cream'
                    : 'bg-warmgray-100 text-coffee hover:bg-warmgray-200'
                }`}
                style={isActive ? { boxShadow: '0 2px 8px rgba(192,133,82,0.35)' } : undefined}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Count + city filter */}
        <div className="flex items-center justify-between mb-6 mt-4">
          <p className="text-sm font-medium text-warmgray-500">
            {loading ? '…' : `${filtered.length} mekan`}
          </p>
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none transition-colors cursor-pointer bg-white border border-warmgray-300 text-espresso"
          >
            <option value="">Tüm Şehirler</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏛️</div>
            <p className="text-lg font-medium mb-1 text-coffee">
              {places.length === 0 ? 'Henüz mekan eklenmemiş' : 'Sonuç bulunamadı'}
            </p>
            <p className="text-sm mb-6 text-warmgray-500">
              {places.length === 0 ? 'İlk mekanı sen ekle!' : 'Farklı bir kategori veya şehir dene.'}
            </p>
            {places.length === 0 && (
              <Link
                href="/new"
                className="inline-block px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 bg-caramel text-cream"
              >
                Mekan Ekle
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(place => (
              <Link key={place.id} href={`/place/${place.slug}`}>
                <PlaceCard place={place} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
