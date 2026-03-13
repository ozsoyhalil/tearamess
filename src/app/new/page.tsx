'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
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

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#F5EDE4',
  border: '1px solid #D4C5B5',
  borderRadius: 12,
  color: '#4B2E2B',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 500,
  color: '#4B2E2B',
  marginBottom: 8,
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
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFF8F0' }}>
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#C08552', borderTopColor: 'transparent' }} />
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
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#4B2E2B' }}>Yeni Mekan Ekle</h1>
        <p className="mb-8" style={{ color: '#8C5A3C' }}>Keşfettiğin bir yeri topluluğa tanıt.</p>

        <div
          className="rounded-2xl p-8 border"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#E8DDD1',
            boxShadow: '0 2px 12px rgba(75,46,43,0.06)',
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Mekan Adı *</label>
              <input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Örn: Bebek Sahili"
                required
                style={fieldStyle}
                onFocus={e => { e.target.style.borderColor = '#C08552'; e.target.style.boxShadow = '0 0 0 3px rgba(192,133,82,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#D4C5B5'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Kategori *</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                required
                style={{ ...fieldStyle, cursor: 'pointer', appearance: 'auto' }}
                onFocus={e => { e.target.style.borderColor = '#C08552'; e.target.style.boxShadow = '0 0 0 3px rgba(192,133,82,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#D4C5B5'; e.target.style.boxShadow = 'none' }}
              >
                <option value="" disabled>Kategori seç…</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* City + Neighborhood */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>Şehir *</label>
                <div ref={cityRef} style={{ position: 'relative' }}>
                  <input
                    value={cityInput}
                    onChange={e => handleCityChange(e.target.value)}
                    onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                    placeholder="İstanbul"
                    required
                    autoComplete="off"
                    style={fieldStyle}
                    onFocus={e => { e.target.style.borderColor = '#C08552'; e.target.style.boxShadow = '0 0 0 3px rgba(192,133,82,0.15)' }}
                  />
                  {showCitySuggestions && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        backgroundColor: '#ffffff',
                        border: '1px solid #D4C5B5',
                        borderRadius: 12,
                        overflow: 'hidden',
                        zIndex: 50,
                        boxShadow: '0 8px 24px rgba(75,46,43,0.12)',
                      }}
                    >
                      {citySuggestions.map(city => (
                        <button
                          key={city}
                          type="button"
                          onMouseDown={() => selectCity(city)}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 16px',
                            fontSize: 14,
                            color: '#4B2E2B',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5EDE4')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Semt</label>
                <input
                  value={form.neighborhood}
                  onChange={e => setForm(prev => ({ ...prev, neighborhood: e.target.value }))}
                  placeholder="Beyoğlu"
                  style={fieldStyle}
                  onFocus={e => { e.target.style.borderColor = '#C08552'; e.target.style.boxShadow = '0 0 0 3px rgba(192,133,82,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = '#D4C5B5'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Açıklama</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Bu mekanı özel kılan ne? Deneyimini anlat…"
                style={{ ...fieldStyle, resize: 'none', minHeight: 120 }}
                onFocus={e => { e.target.style.borderColor = '#C08552'; e.target.style.boxShadow = '0 0 0 3px rgba(192,133,82,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#D4C5B5'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {error && <p className="text-sm mb-4" style={{ color: '#ef4444' }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold text-lg transition-all duration-200"
              style={{
                backgroundColor: submitting ? '#D4C5B5' : '#C08552',
                color: '#FFF8F0',
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 14px rgba(192,133,82,0.35)',
              }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#A06B3C' }}
              onMouseLeave={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#C08552' }}
            >
              {submitting ? 'Ekleniyor…' : 'Mekanı Ekle'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
