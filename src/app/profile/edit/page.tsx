'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/context/AuthContext'
import { getProfileByUserId, updateProfile } from '@/lib/services/profiles'

export default function ProfileEditPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }

    getProfileByUserId(user.id).then(({ data }) => {
      if (data) {
        setDisplayName(data.display_name ?? '')
        setBio(data.bio ?? '')
        setAvatarUrl(data.avatar_url ?? '')
      }
      setProfileLoading(false)
    })
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setErrorMsg(null)

    const { error } = await updateProfile(user.id, {
      display_name: displayName,
      bio,
      avatar_url: avatarUrl,
    })

    setSaving(false)

    if (error) {
      setErrorMsg(error)
      return
    }

    router.push('/profile')
  }

  if (loading || profileLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-10">
        <Link
          href="/profile"
          className="inline-block mb-6 text-sm font-medium text-caramel hover:underline"
        >
          ← Profil&apos;e dön
        </Link>

        <h1 className="text-2xl font-bold text-espresso mb-8">Profili Düzenle</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="İsim / Takma Ad"
            id="display_name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Nasıl görünmek istiyorsun?"
          />

          <Textarea
            label="Hakkımda"
            id="bio"
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            placeholder="Kendini tanıt..."
          />

          <Input
            label="Avatar URL"
            id="avatar_url"
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            placeholder="https://..."
          />

          {errorMsg && (
            <p className="text-sm text-red-500">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-caramel text-cream rounded-xl px-7 py-3 font-bold transition-all duration-200 hover:bg-caramel-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
          </button>
        </form>
      </main>
    </>
  )
}
