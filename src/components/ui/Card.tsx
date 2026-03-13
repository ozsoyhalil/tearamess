'use client'

import { type ReactNode } from 'react'

type CardVariant = 'default' | 'interactive' | 'flat'

interface CardProps {
  variant?: CardVariant
  className?: string
  children: ReactNode
  [key: string]: unknown
}

export function Card({ variant = 'default', className = '', children, ...rest }: CardProps) {
  const base = 'rounded-2xl border border-warmgray-200 bg-white'
  const variants: Record<CardVariant, string> = {
    default: 'shadow-sm',
    interactive: 'shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer',
    flat: '',
  }
  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </div>
  )
}
