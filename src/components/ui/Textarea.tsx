'use client'

import { type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
}

export function Textarea({ error, label, className = '', id, rows = 4, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-espresso mb-2">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={rows}
        className={`w-full px-4 py-3 rounded-xl bg-warmgray-100 text-espresso text-sm border outline-none placeholder:text-warmgray-400 focus:ring-2 focus:ring-caramel focus:border-caramel transition-all duration-200 resize-none ${error ? 'border-red-400' : 'border-warmgray-300'} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  )
}
