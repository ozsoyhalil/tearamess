import { NextRequest, NextResponse } from 'next/server'

// Proxies Google Places photos server-side so the API key is never exposed to
// the client. Usage: GET /api/photo?name=places/{id}/photos/{ref}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')

  if (!name) {
    return new NextResponse('Missing name param', { status: 400 })
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return new NextResponse('Photo service not configured', { status: 500 })
  }

  // name should be like "places/ChIJ.../photos/AXCi..."
  const googleUrl = `https://places.googleapis.com/v1/${name}/media?maxWidthPx=800&key=${apiKey}`

  let res: Response
  try {
    res = await fetch(googleUrl, { next: { revalidate: 86400 } })
  } catch {
    return new NextResponse('Failed to fetch photo', { status: 502 })
  }

  if (!res.ok) {
    return new NextResponse('Photo not found', { status: res.status })
  }

  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  const buffer = await res.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  })
}
