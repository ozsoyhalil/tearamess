'use client'

import { useState } from 'react'
import { createList } from '@/lib/services/lists'
import type { List } from '@/types/list'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

interface CreateListModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onCreated: (list: List) => void
}

export function CreateListModal({ userId, isOpen, onClose, onCreated }: CreateListModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Liste adı boş olamaz.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    const result = await createList(
      userId,
      name.trim(),
      description.trim() || undefined
    )

    if (result.error || !result.data) {
      setError(result.error ?? 'Liste oluşturulurken bir hata oluştu.')
      setIsSubmitting(false)
      return
    }

    onCreated(result.data)
    setName('')
    setDescription('')
    setIsSubmitting(false)
    onClose()
  }

  const handleBackdropClick = () => {
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md bg-[var(--color-cream)] rounded-xl shadow-xl z-[51] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-espresso mb-4">Yeni Liste Oluştur</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <Input
              id="list-name"
              type="text"
              placeholder="Liste adı"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-required="true"
            />
          </div>

          <div className="mb-4">
            <Textarea
              id="list-description"
              placeholder="Açıklama (isteğe bağlı)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="mb-3 text-sm text-red-500">{error}</p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-warmgray-600 bg-warmgray-100 hover:bg-warmgray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-caramel)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Oluşturuluyor…' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
