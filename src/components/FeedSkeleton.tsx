'use client'

import { Card } from '@/components/ui/Card'

interface FeedSkeletonProps {
  count?: number
}

export function FeedSkeleton({ count = 5 }: FeedSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} variant="flat" className="p-4 animate-pulse">
          {/* Author row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-warmgray-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-warmgray-200 rounded w-1/4" />
              <div className="h-3 bg-warmgray-100 rounded w-1/6" />
            </div>
          </div>

          {/* Place row */}
          <div className="mb-2 flex items-center gap-2">
            <div className="h-3.5 bg-warmgray-200 rounded w-1/3" />
            <div className="h-3 bg-warmgray-100 rounded w-1/5" />
          </div>

          {/* Rating bar */}
          <div className="h-3 bg-warmgray-100 rounded w-1/4" />
        </Card>
      ))}
    </div>
  )
}
