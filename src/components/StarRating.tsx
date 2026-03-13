'use client'

import { useState } from 'react'

interface Props {
  value: number
  onChange?: (v: number) => void
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 18, md: 26, lg: 34 }

export default function StarRating({ value, onChange, size = 'md' }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const display = hover ?? value
  const readOnly = !onChange
  const px = SIZES[size]

  const calcVal = (e: React.MouseEvent<HTMLSpanElement>, i: number): number => {
    const { left, width } = e.currentTarget.getBoundingClientRect()
    return (e.clientX - left) < width / 2 ? i - 0.5 : i
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 3 }}
      onMouseLeave={() => !readOnly && setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const pct = display >= i ? 100 : display >= i - 0.5 ? 50 : 0
        return (
          <span
            key={i}
            onMouseMove={readOnly ? undefined : (e) => setHover(calcVal(e, i))}
            onClick={readOnly ? undefined : (e) => onChange!(calcVal(e, i))}
            style={{
              fontSize: px,
              lineHeight: 1,
              cursor: readOnly ? 'default' : 'pointer',
              userSelect: 'none' as const,
              display: 'inline-block',
              backgroundImage: `linear-gradient(to right, #C08552 ${pct}%, #D4C5B5 ${pct}%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              transition: 'background-image 0.1s',
            } as React.CSSProperties}
          >
            ★
          </span>
        )
      })}
      {!readOnly && display > 0 && (
        <span style={{ marginLeft: 6, fontSize: 13, color: '#8C5A3C', fontWeight: 600 }}>
          {display}
        </span>
      )}
    </div>
  )
}
