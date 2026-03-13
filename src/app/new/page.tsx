'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const CATEGORIES = [
  'Kafe', 'Restoran', 'Park', 'Müze', 'Sahil/Plaj',
  'Sokak/Cadde', 'Kütüphane', 'Bar', 'Teras/Çatı',
  'Köy/Kasaba', 'Doğa/Yürüyüş', 'Manzara Noktası', 'Tarihi Mekan', 'Diğer',
]

const TR_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya',
  'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik',
  'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis',
  'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa',
  'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize',
  'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 'Tekirdağ',
  'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak',
]

function toSlug(text: string): string {
  const tr: Record<string, string> = {
    ş: 's', Ş: 's', ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g',
    ı: 'i', İ: 'i', ö: 'o', Ö: 'o', ü: 'u', Ü: 'u',
  }
  return text.split('').map(c => tr[c] ?? c).join('')
    .toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-')
}

export default function NewPlacePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [form, setForm] = useState({ name: '', category: '', city: '', neighborhood: '', description: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [cityInput, setCityInput] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const cityRef = useRef<HTMLDivElement>(null)

  const handleCityChange = (val: string) => {
    setCityInput(val)
    setForm(prev => ({ ...prev, city: val }))
    if (val.length >= 1) {
      const matches = TR_CITIES.filter(c =>
        c.toLowerCase().startsWith(val.toLowerCase()) ||
        c.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 6)
      setCitySuggestions(matches)
      setShowCitySuggestions(matches.length > 0)
    } else {
      setCitySuggestions([])
      setShowCitySuggestions(false)
    }
  }

  const selectCity = (city: string) => {
    setCityInput(city)
    setForm(prev => ({ ...prev, city }))
    setShowCitySuggestions(false)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-cream">
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-caramel border-t-transparent" />
        </div>
      </>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.category || !form.city) {
      setError('Mekan adı, kategori ve şehir zorunludur.')
      return
    }
    setSubmitting(true)
    const slug = `${toSlug(form.name)}-${Date.now()}`
    const { error: insertError } = await supabase.from('places').insert({
      name: form.name,
      slug,
      category: form.category,
      city: form.city,
      neighborhood: form.neighborhood || null,
      description: form.description || null,
      created_by: user.id,
    })
    if (insertError) { setError(insertError.message); setSubmitting(false); return }
    router.push(`/place/${slug}`)
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-1 text-espresso">Yeni Mekan Ekle</h1>
        <p className="mb-8 text-coffee">Keşfettiğin bir yeri topluluğa tanıt.</p>

        <Card variant="default" className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <Input
              label="Mekan Adı *"
              id="name"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Örn: Bebek Sahili"
              required
            />

            {/* Category */}
            <div className="w-full">
              <label htmlFor="category" className="block text-sm font-medium text-espresso mb-2">
                Kategori *
              </label>
              <select
                id="category"
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-xl bg-warmgray-100 text-espresso text-sm border outline-none focus:ring-2 focus:ring-caramel focus:border-caramel transition-all duration-200 border-warmgray-300 cursor-pointer"
              >
                <option value="" disabled>Kategori seç…</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* City + Neighborhood */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-espresso mb-2">
                  Şehir *
                </label>
                <div ref={cityRef} className="relative">
                  <input
                    id="city"
                    value={cityInput}
                    onChange={e => handleCityChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                    placeholder="İstanbul"
                    required
                    autoComplete="off"
                    className="w-full px-4 py-3 rounded-xl bg-warmgray-100 text-espresso text-sm border outline-none placeholder:text-warmgray-400 focus:ring-2 focus:ring-caramel focus:border-caramel transition-all duration-200 border-warmgray-300"
                  />
                  {showCitySuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-warmgray-300 rounded-xl overflow-hidden z-50" style={{ boxShadow: '0 8px 24px rgba(75,46,43,0.12)' }}>
                      {citySuggestions.map(city => (
                        <button
                          key={city}
                          type="button"
                          onMouseDown={() => selectCity(city)}
                          className="block w-full text-left px-4 py-2.5 text-sm text-espresso bg-transparent hover:bg-warmgray-100 transition-colors duration-150 cursor-pointer border-none"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <Input
                label="Semt"
                id="neighborhood"
                value={form.neighborhood}
                onChange={e => setForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                placeholder="Beyoğlu"
              />
            </div>

            {/* Description */}
            <Textarea
              label="Açıklama"
              id="description"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="Bu mekanı özel kılan ne? Deneyimini anlat…"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold text-lg transition-all duration-200 bg-caramel text-cream hover:bg-caramel-dark disabled:bg-warmgray-300 disabled:cursor-not-allowed"
              style={{ boxShadow: submitting ? 'none' : '0 4px 14px rgba(192,133,82,0.35)' }}
            >
              {submitting ? 'Ekleniyor…' : 'Mekanı Ekle'}
            </button>
          </form>
        </Card>
      </main>
    </>
  )
}
