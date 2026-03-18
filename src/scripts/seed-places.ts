/**
 * Ankara Places Seed Script
 *
 * Fetches places from Google Places API (New) and inserts them into Supabase.
 * Run: npx tsx src/scripts/seed-places.ts
 *
 * Required env vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (preferred — bypasses RLS for null created_by)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  (fallback)
 *   GOOGLE_PLACES_API_KEY
 *
 * Note: If latitude, longitude, cover_image_url columns don't exist in the
 * places table yet, add them via Supabase dashboard or a new migration:
 *   alter table places add column if not exists latitude float8;
 *   alter table places add column if not exists longitude float8;
 *   alter table places add column if not exists cover_image_url text;
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !GOOGLE_API_KEY) {
  console.error('Missing required environment variables:')
  if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  if (!SUPABASE_KEY)
    console.error('  - SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!GOOGLE_API_KEY) console.error('  - GOOGLE_PLACES_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Search Queries ───────────────────────────────────────────────────────────

const SEARCH_QUERIES: Array<{ query: string; category: string }> = [
  { query: 'cafe in Ankara', category: 'Kafe' },
  { query: 'restaurant in Ankara', category: 'Restoran' },
  { query: 'park in Ankara', category: 'Park' },
  { query: 'museum in Ankara', category: 'Müze' },
  { query: 'bar in Ankara', category: 'Bar' },
  { query: 'library in Ankara', category: 'Kütüphane' },
  { query: 'mosque in Ankara', category: 'Tarihi Mekan' },
  { query: 'historic site in Ankara', category: 'Tarihi Mekan' },
  { query: 'viewpoint in Ankara', category: 'Manzara Noktası' },
  { query: 'bakery in Ankara', category: 'Fırın' },
  { query: 'bookstore in Ankara', category: 'Kitabevi' },
  { query: 'art gallery in Ankara', category: 'Sanat Galerisi' },
  { query: 'tea house in Ankara', category: 'Çay Bahçesi' },
  { query: 'rooftop bar in Ankara', category: 'Bar' },
  { query: 'street food in Ankara', category: 'Sokak Yemeği' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface GooglePlace {
  id?: string
  displayName?: { text: string }
  formattedAddress?: string
  location?: { latitude: number; longitude: number }
  rating?: number
  userRatingCount?: number
  photos?: Array<{ name: string }>
  editorialSummary?: { text: string }
  types?: string[]
}

interface GoogleSearchResponse {
  places?: GooglePlace[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TR_MAP: Record<string, string> = {
  ş: 's', Ş: 's',
  ğ: 'g', Ğ: 'g',
  ı: 'i', İ: 'i',
  ö: 'o', Ö: 'o',
  ü: 'u', Ü: 'u',
  ç: 'c', Ç: 'c',
}

function toSlug(name: string): string {
  return name
    .split('')
    .map(c => TR_MAP[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7)
}

function extractNeighborhood(address: string): string | null {
  // Turkish addresses: "Street No, Neighborhood, District/City, Province, Country"
  const parts = address.split(',').map(p => p.trim())
  const ankaraIdx = parts.findIndex(p => /ankara/i.test(p))
  if (ankaraIdx > 1) return parts[ankaraIdx - 1]
  if (parts.length >= 3) return parts[parts.length - 3]
  if (parts.length >= 2) return parts[0]
  return null
}

function buildPhotoUrl(photoName: string): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_API_KEY}`
}

// ─── API ──────────────────────────────────────────────────────────────────────

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.photos',
  'places.editorialSummary',
  'places.types',
].join(',')

async function fetchPlaces(query: string): Promise<GooglePlace[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY as string,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'tr' }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google API ${res.status}: ${body}`)
  }

  const data: GoogleSearchResponse = await res.json()
  return data.places ?? []
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Ankara Places Seed ===\n')

  // Load existing place names to skip duplicates
  const { data: existing, error: loadErr } = await supabase
    .from('places')
    .select('name')
    .eq('city', 'Ankara')

  if (loadErr) {
    console.error('Failed to load existing places:', loadErr.message)
    process.exit(1)
  }

  const existingNames = new Set((existing ?? []).map(p => p.name.toLowerCase()))
  console.log(`Found ${existingNames.size} existing Ankara places in DB.\n`)

  // Track names processed in this run to avoid cross-query duplicates
  const seenThisRun = new Set<string>()

  let inserted = 0
  let skipped = 0
  let errors = 0

  for (const { query, category } of SEARCH_QUERIES) {
    process.stdout.write(`Searching "${query}"... `)

    let places: GooglePlace[]
    try {
      places = await fetchPlaces(query)
    } catch (err) {
      console.error(`ERROR — ${(err as Error).message}`)
      errors++
      continue
    }

    console.log(`${places.length} results`)

    for (const place of places) {
      const name = place.displayName?.text
      if (!name) continue

      const nameKey = name.toLowerCase()

      if (existingNames.has(nameKey) || seenThisRun.has(nameKey)) {
        skipped++
        continue
      }

      seenThisRun.add(nameKey)

      const slug = `${toSlug(name)}-${randomSuffix()}`
      const neighborhood = place.formattedAddress
        ? extractNeighborhood(place.formattedAddress)
        : null
      // Store just the resource name (e.g. "places/ChIJ.../photos/AXCi...")
      // The photo proxy at /api/photo adds the API key server-side at request time
      const coverImageUrl = place.photos?.[0]?.name ?? null

      const payload = {
        name,
        slug,
        category,
        city: 'Ankara',
        neighborhood,
        description: place.editorialSummary?.text ?? null,
        latitude: place.location?.latitude ?? null,
        longitude: place.location?.longitude ?? null,
        cover_image_url: coverImageUrl,
        avg_rating: place.rating ?? null,
        review_count: place.userRatingCount ?? null,
        created_by: null,
      }

      const { error } = await supabase.from('places').insert(payload)

      if (error) {
        console.error(`  ✗ "${name}": ${error.message}`)
        errors++
      } else {
        inserted++
        existingNames.add(nameKey) // prevent future cross-query dupes
      }
    }

    // Be polite to the API
    await new Promise(r => setTimeout(r, 300))
  }

  console.log('\n=== Done ===')
  console.log(`Inserted : ${inserted}`)
  console.log(`Skipped  : ${skipped}  (already in DB)`)
  console.log(`Errors   : ${errors}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
