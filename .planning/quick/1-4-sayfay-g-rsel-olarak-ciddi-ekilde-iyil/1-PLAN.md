---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/page.tsx
  - src/app/explore/page.tsx
  - src/app/place/[slug]/page.tsx
  - src/app/profile/page.tsx
  - src/app/profile/edit/page.tsx
  - src/components/ProfileLayout.tsx
  - src/lib/services/profiles.ts
  - supabase/migrations/20260322_fix_wishlist_dedup.sql
autonomous: true
requirements: []

must_haves:
  truths:
    - "Profil sayfasında kullanıcının gerçek adı görünür, 'Kullanıcı' değil"
    - "Gideceğim Yerler listesi profilde tek görünür"
    - "Profili Düzenle sayfası yüklenebilir ve formu çalışır"
    - "Ana sayfa logged-in kullanıcıya kişiselleştirilmiş selamlama gösterir"
    - "Popüler ve Yeni mekanlar yatay scroll carousel formatında görünür"
    - "Keşfet sayfasındaki kartlar h-48 fotoğraf, hover overlay ve kategori badge ile görünür"
    - "Mekan detay sayfasında hero image tam genişlik h-64 ve -mt-8 overlap efekti var"
    - "Profil sayfasında 96x96 avatar ve profesyonel görünüm var"
  artifacts:
    - path: "src/app/profile/edit/page.tsx"
      provides: "Profile edit form (display_name, bio, avatar_url)"
    - path: "supabase/migrations/20260322_fix_wishlist_dedup.sql"
      provides: "SQL to delete duplicate wishlist rows"
  key_links:
    - from: "src/app/profile/edit/page.tsx"
      to: "src/lib/services/profiles.ts"
      via: "updateProfile function"
      pattern: "updateProfile"
    - from: "src/app/profile/page.tsx"
      to: "AuthContext"
      via: "user.email fallback for display name"
      pattern: "user\\.email"
---

<objective>
Görsel olarak ciddi şekilde iyileştirilmiş 4 sayfa + 3 kritik bug fix.

Purpose: Uygulamanın şu anki işlevsel ama ham görünümünü cilalı, profesyonel bir hale getir. Aynı zamanda profil adı, duplicate wishlist ve profili düzenle 404 bug'larını kapat.

Output:
- 3 bug fix (isim, wishlist dedup, profili düzenle 404)
- Ana sayfa: kişiselleştirilmiş hero, istatistik şeridi, horizontal carousel, son reviewlar, kategori keşfet grid
- Keşfet: daha büyük arama, h-48 kart fotoğrafı, hover overlay, sıralama dropdown
- Mekan detay: h-64 hero, -mt-8 overlap bilgi kartı, kart formatında reviewlar
- Profil: 96x96 avatar, tab bar korunsun, profili düzenle sayfası
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Renk token'ları (globals.css @theme'den):
- cream: #FFF8F0
- caramel: #C08552, caramel-dark: #A06B3C
- coffee: #8C5A3C
- espresso: #4B2E2B
- warmgray-100: #F5EDE4, warmgray-200: #E8DDD1, warmgray-300: #D4C5B5, warmgray-400: #B8A898, warmgray-500: #9C8E7E

Mevcut bileşenler: PlaceCard (h-40 fotoğraf, kategori badge, rating), ProfileLayout (tab bar, follow counts, Profili Düzenle linki), Card, Input, Textarea, StarRating

CAT_EMOJI ve CAT_GRADIENT PlaceCard.tsx'te tanımlı — import edilebilir.

getProfileByUserId profiles tablosundan username, display_name, avatar_url çeker. Yeni kullanıcılarda profil satırı olmayabilir — profil sayfası user_metadata fallback'i var ama email prefix her zaman çalışıyor.

getUserLists client-side dedup yapıyor ama DB'de birden fazla is_wishlist=true satırı olabilir. getOrCreateWishlist .single() kullandığı için birden fazla satır varsa hata verir.

updateProfile fonksiyonu henüz yok — profiles.ts'e eklenecek.

Profil tipi (src/types/profile.ts): { id?, user_id?, username, display_name, avatar_url?, created_at? }
Profiles tablosunda bio kolonu olabilir ya da olmayabilir — migration'la eklenecek.
</context>

<tasks>

<task type="auto">
  <name>Task 1: 3 Bug Fix — Profil adı, Wishlist dedup SQL, Profili Düzenle sayfası</name>
  <files>
    supabase/migrations/20260322_fix_wishlist_dedup.sql
    src/lib/services/profiles.ts
    src/types/profile.ts
    src/app/profile/edit/page.tsx
  </files>
  <action>
**1a. Wishlist dedup migration**

`supabase/migrations/20260322_fix_wishlist_dedup.sql` dosyasını oluştur:

```sql
-- Delete duplicate wishlist rows; keep only the oldest one per user
DELETE FROM lists
WHERE is_wishlist = true
  AND id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM lists
    WHERE is_wishlist = true
    ORDER BY user_id, created_at ASC
  );
```

Bu SQL'i doğrudan Supabase SQL editor'a yapıştırarak çalıştır. (Dosya kayıt altı içindir.)

**1b. Profile tip güncellemesi**

`src/types/profile.ts` dosyasına `bio?: string | null` alanı ekle:

```typescript
export interface Profile {
  id?: string
  user_id?: string
  username: string | null
  display_name: string | null
  avatar_url?: string | null
  bio?: string | null
  created_at?: string
}
```

**1c. profiles.ts — updateProfile fonksiyonu ekle**

`src/lib/services/profiles.ts` dosyasının sonuna ekle:

```typescript
export async function updateProfile(
  userId: string,
  updates: { display_name?: string; avatar_url?: string; bio?: string }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  return { error: null }
}
```

**1d. Profili Düzenle sayfası**

`src/app/profile/edit/page.tsx` dosyasını oluştur. 'use client' direktifi. useAuth() ile user al; loading ise spinner. user yoksa router.replace('/login'). useEffect ile getProfileByUserId(user.id) çağır, formu doldur.

Form alanları:
- display_name: Input label="İsim / Takma Ad", placeholder="Nasıl görünmek istiyorsun?"
- bio: Textarea label="Hakkımda", rows={3}, placeholder="Kendini tanıt..."
- avatar_url: Input label="Avatar URL", placeholder="https://..."

Submit: updateProfile(user.id, { display_name, bio, avatar_url }) çağır. Başarıda `router.push('/profile')` ile yönlendir. Hata varsa `errorMsg` state'e yaz, kırmızı paragraf olarak göster.

Stil: `max-w-lg mx-auto px-4 py-10`. Başlıkta geri oku: `← Profil'e dön` (Link href="/profile", text-caramel). "Değişiklikleri Kaydet" butonu bg-caramel text-cream rounded-xl px-7 py-3 font-bold disabled:opacity-50. Kaydetme sırasında "Kaydediliyor…" göster.

Mevcut profil adı burada "Kullanıcı" gösterirse — sayfa getProfileByUserId'den gelen display_name'i input'a yükler, user.email'den değil. Bu yeterli çünkü düzenleme sayfasında kullanıcı zaten kendi adını görecek.
  </action>
  <verify>
    `src/app/profile/edit/page.tsx` dosyası oluşturuldu ve `/profile/edit` route'u 404 vermiyor. updateProfile fonksiyonu profiles.ts'te export edildi. Bio alanı Profile tipinde var.
  </verify>
  <done>
    - /profile/edit sayfası yüklenir ve form render edilir
    - Kaydet butonu updateProfile'ı çağırır, başarıda /profile'a yönlendirir
    - Wishlist dedup SQL dosyası migration klasöründe var
  </done>
</task>

<task type="auto">
  <name>Task 2: Ana Sayfa — Kişiselleştirilmiş hero, carousel, son reviewlar, kategori grid</name>
  <files>
    src/app/page.tsx
  </files>
  <action>
Yalnızca logged-in kullanıcı görüntüsü olan `FeedPage` ve boş feed fallback'i olan `DiscoverSection` bileşenlerini değiştir. LandingPage'e dokunma.

**FeedPage — Kişiselleştirilmiş hero şeridi ekle:**

FeedPage başına (Navbar'dan sonra, main içinde, feed listesinin üstüne) şu bileşeni ekle:

```tsx
// Hero greeting — üstte, feed öncesinde
<div
  className="rounded-2xl p-6 mb-6"
  style={{ background: 'linear-gradient(135deg, #F5EDE4 0%, #FFF8F0 100%)' }}
>
  <p className="text-xl font-bold text-espresso">
    Merhaba{displayName ? `, ${displayName}` : ''} 👋
  </p>
  <p className="text-sm mt-1 text-coffee">Bugün nereye gidiyoruz?</p>
</div>
```

`displayName` için: `useAuth()` user'dan `user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? ''` olarak türet. State kullanma — doğrudan user'dan hesapla.

**DiscoverSection — Horizontal carousel:**

`grid grid-cols-1 sm:grid-cols-2` grid'ini horizontal scroll carousel'e dönüştür:

```tsx
// Yatay scroll container
<div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory -mx-4 px-4">
  {topPlaces.map(place => (
    <Link
      key={place.id}
      href={`/place/${place.slug}`}
      className="min-w-[280px] shrink-0 snap-start"
    >
      <PlaceCard place={place} />
    </Link>
  ))}
</div>
```

Aynı formatı Yeni Eklenen Mekanlar için de uygula.

**DiscoverSection — Son Değerlendirmeler bölümü ekle:**

En altta (CTA'dan önce) yeni bir section ekle:

```tsx
<section className="mb-10">
  <h2 className="text-lg font-bold text-espresso mb-4">Son Değerlendirmeler</h2>
  {recentReviews.length === 0 ? null : (
    <div className="space-y-3">
      {recentReviews.map(review => (
        <div
          key={review.id}
          className="rounded-xl p-4 border border-warmgray-200 bg-white transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-caramel text-cream flex items-center justify-center text-sm font-bold shrink-0">
                {(review.profiles?.display_name || review.profiles?.username || '?')[0].toUpperCase()}
              </div>
              <div>
                <span className="text-sm font-semibold text-espresso">
                  {review.profiles?.display_name || review.profiles?.username || 'Anonim'}
                </span>
                {review.place_name && (
                  <Link href={`/place/${review.place_slug}`} className="block text-xs text-caramel hover:underline">
                    {review.place_name}
                  </Link>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-caramel">{review.rating} ★</div>
              <div className="text-xs text-warmgray-400">
                {new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
          {review.content && (
            <p className="text-sm text-coffee leading-relaxed line-clamp-2 pl-10">
              {review.content}
            </p>
          )}
        </div>
      ))}
    </div>
  )}
</section>
```

`recentReviews` için yeni tip tanımla (local): `{ id, rating, content, created_at, profiles: { display_name, username } | null, place_name, place_slug }`. Bunu DiscoverSection state'ine ekle: `const [recentReviews, setRecentReviews] = useState<RecentReview[]>([])`.

`getRecentReviewsForDiscover` servis fonksiyonu olmadığından, DiscoverSection'daki `useEffect` içinde doğrudan supabase client çağrısı yap:

```tsx
import { supabase } from '@/lib/supabase'

// useEffect içinde:
const { data: reviewData } = await supabase
  .from('reviews')
  .select('id, rating, content, created_at, profiles(display_name, username), places(name, slug)')
  .order('created_at', { ascending: false })
  .limit(5)
setRecentReviews((reviewData ?? []).map((r: any) => ({
  id: r.id,
  rating: r.rating,
  content: r.content,
  created_at: r.created_at,
  profiles: r.profiles,
  place_name: r.places?.name ?? null,
  place_slug: r.places?.slug ?? null,
})))
```

**DiscoverSection — Kategori Keşfet grid ekle:**

Popüler Mekanlar bölümünden önce ekle:

```tsx
<section className="mb-10">
  <h2 className="text-lg font-bold text-espresso mb-4">Kategorilere Göre Keşfet</h2>
  <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
    {[
      { label: 'Kafe', emoji: '☕' },
      { label: 'Restoran', emoji: '🍽️' },
      { label: 'Park', emoji: '🌿' },
      { label: 'Müze', emoji: '🏛️' },
      { label: 'Bar', emoji: '🍷' },
      { label: 'Kütüphane', emoji: '📚' },
      { label: 'Tarihi Mekan', emoji: '🏰' },
      { label: 'Teras/Çatı', emoji: '🌇' },
      { label: 'Sahil/Plaj', emoji: '🏖️' },
      { label: 'Kitabevi', emoji: '📖' },
    ].map(({ label, emoji }) => (
      <Link
        key={label}
        href={`/explore?category=${encodeURIComponent(label)}`}
        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-warmgray-100 hover:bg-warmgray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 text-center"
      >
        <span className="text-2xl">{emoji}</span>
        <span className="text-xs font-medium text-espresso leading-tight">{label}</span>
      </Link>
    ))}
  </div>
</section>
```

Keşfet sayfasındaki kategori filter — URL param'ı okumak için Keşfet sayfasına dokunmayacağız bu task'ta (Task 3'te yapılır).

**PlaceCard — h-40 → h-48 yükseklik artırımı ve hover efekti:**

PlaceCard bileşenini şu şekilde güncelle:
- `h-40` → `h-48` (fotoğraf alanı daha büyük)
- `Card` wrapper'ına `transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5` ekle. Bunu Card component'inin `className` prop'una geç.
- Fotoğraf varsa hover overlay gradient daha belirgin: `from-black/30 to-transparent` → `from-black/50 via-black/10 to-transparent`
  </action>
  <verify>
    Ana sayfada (logged-in) greeting bölümü görünür. DiscoverSection'da horizontal scroll carousel çalışıyor. Kategori grid 10 kategori gösteriyor. Son değerlendirmeler bölümü mevcut review varsa görünüyor. PlaceCard h-48 fotoğraf gösteriyor.
  </verify>
  <done>
    - Logged-in kullanıcı "Merhaba, [isim] 👋" başlığını görüyor
    - Popüler ve Yeni mekanlar horizontal scroll carousel formatında
    - Kategori grid /explore?category=X linkleri veriyor
    - Son 5 public review kart formatında listeleniyor
    - PlaceCard fotoğraf alanı h-48, hover: shadow-lg + -translate-y-0.5
  </done>
</task>

<task type="auto">
  <name>Task 3: Keşfet + Mekan Detay + Profil sayfaları görsel polish</name>
  <files>
    src/app/explore/page.tsx
    src/app/place/[slug]/page.tsx
    src/app/profile/page.tsx
    src/components/ProfileLayout.tsx
  </files>
  <action>
**3a. Keşfet sayfası (src/app/explore/page.tsx)**

Sıralama dropdown ekle: `const [sortBy, setSortBy] = useState<'az' | 'rating' | 'recent'>('recent')`. Şehir filtresi yanına ikinci select:

```tsx
<select
  value={sortBy}
  onChange={e => setSortBy(e.target.value as 'az' | 'rating' | 'recent')}
  className="px-3 py-2 rounded-lg text-sm outline-none transition-colors cursor-pointer bg-white border border-warmgray-300 text-espresso"
>
  <option value="recent">Yeniden Eskiye</option>
  <option value="rating">En Yüksek Puan</option>
  <option value="az">A → Z</option>
</select>
```

`filtered` hesaplamasını sıralamaya göre genişlet:

```typescript
const sorted = [...filtered].sort((a, b) => {
  if (sortBy === 'az') return a.name.localeCompare(b.name, 'tr')
  if (sortBy === 'rating') return (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
  return 0 // 'recent': backend sırası korunur
})
```

Grid'i `sorted` üzerinden render et. Kategori pill butonlarını dolgunlaştır: `px-4 py-2` → `px-5 py-2.5`, font-size `text-sm` → `text-base`. Arama Input className'ine `text-lg py-4 px-5 h-auto` ekle (daha büyük arama alanı).

URL'den category param'ı oku: `import { useSearchParams } from 'next/navigation'`. `const params = useSearchParams(); const initialCategory = params.get('category') ?? ''`. `useState<string>(initialCategory)` olarak başlat. Bu, kategori grid linklerinin çalışmasını sağlar.

**3b. Mekan Detay sayfası (src/app/place/[slug]/page.tsx)**

Hero image ekle: place yüklendikten sonra, Navbar'dan hemen sonra, main container'dan önce:

```tsx
{/* Hero — full width, outside max-w container */}
{place.cover_image_url ? (
  <div className="relative w-full h-64 overflow-hidden">
    <img
      src={resolvePhotoSrc(place.cover_image_url)}  {/* resolvePhotoSrc'yi import et veya inline yaz */}
      alt={place.name}
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
  </div>
) : (
  <div
    className="w-full h-40"
    style={{ background: CAT_GRADIENT[place.category] ?? DEFAULT_GRADIENT }}
  >
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-7xl opacity-20">{CAT_EMOJI[place.category] ?? '📍'}</span>
    </div>
  </div>
)}
```

CAT_GRADIENT, CAT_EMOJI, DEFAULT_GRADIENT'ı PlaceCard.tsx'ten import et: `import { CAT_GRADIENT, CAT_EMOJI, DEFAULT_GRADIENT } from '@/components/PlaceCard'`

`resolvePhotoSrc` için PlaceCard'daki aynı fonksiyonu ya kopyala ya da PlaceCard'dan export edip import et. Daha temiz: PlaceCard'dan `export function resolvePhotoSrc` yap (function declaration'ı export et) ve place/[slug]/page.tsx içinde import et.

Bilgi kartını overlap efekti için: main container `py-10` → `pt-0`. Card variant="default" className'e `-mt-8 relative z-10` ekle.

Review listesi formatını kart'a dönüştür: mevcut `rounded-xl p-5 bg-warmgray-100` → `rounded-xl p-5 bg-white border border-warmgray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`.

**3c. Profil sayfası (src/app/profile/page.tsx)**

Ziyaret kartlarını güncelle: mevcut `p-4 rounded-xl border border-warmgray-100` → `p-4 rounded-xl border border-warmgray-200 bg-white transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`.

**3d. ProfileLayout bileşeni (src/components/ProfileLayout.tsx)**

Avatar boyutunu 80×80 → 96×96 (w-20 h-20 → w-24 h-24, text-2xl font'u text-3xl yap). Display name font boyutunu `text-xl` → `text-2xl`. Tab bar butonlarını dolgunlaştır: `px-5 py-2.5` → `px-6 py-3`.

"Profili Düzenle" butonunu daha belirgin yap: mevcut border-only stil → bg-warmgray-100 hover:bg-warmgray-200 ve padding artışı:

```tsx
<Link
  href="/profile/edit"
  className="inline-block px-5 py-2 rounded-full text-sm font-semibold bg-warmgray-100 hover:bg-warmgray-200 text-espresso transition-all duration-300 border border-warmgray-300"
>
  Profili Düzenle
</Link>
```
  </action>
  <verify>
    - Keşfet sayfasında sıralama dropdown görünür ve çalışır; kategori grid'inden gelen URL param'ı aktif kategori olarak seçili gelir
    - Mekan detay sayfasında fotoğraf varsa tam genişlik h-64 hero görünür, fotoğraf yoksa kategori renkli banner görünür; bilgi kartı -mt-8 overlap efektiyle konumlanır
    - Profil sayfasında 96×96 avatar görünür; ziyaret kartları beyaz arka planla ve hover efektiyle görünür
    - "Profili Düzenle" butonu /profile/edit'e yönlendirir ve 404 vermiyor
  </verify>
  <done>
    - Keşfet: sıralama çalışıyor, kategori URL param'ı aktif, pill butonlar büyük, arama alanı büyük
    - Mekan detay: hero image / kategori banner + overlap bilgi kartı + kart formatında reviewlar
    - Profil: büyük avatar, hover animasyonlu ziyaret kartları, çalışan "Profili Düzenle" butonu
  </done>
</task>

</tasks>

<verification>
1. `/profile/edit` — yüklenir, form görünür, kaydet çalışır, /profile'a döner
2. Profil sayfasında isim "Kullanıcı" DEĞİL, gerçek isim görünür (edit sayfasından sonra)
3. Ana sayfa (logged-in): "Merhaba, [isim] 👋" başlığı, horizontal carousel, kategori grid, son reviewlar
4. Keşfet sayfası: sıralama dropdown, büyük arama, kategori URL param'ı çalışıyor
5. Mekan detay: hero image görünür (varsa), bilgi kartı overlap efektli
6. `npm run build` hataları yok
</verification>

<success_criteria>
- 3 bug fix tamamlandı: profil edit 404 gitti, wishlist dedup SQL hazır, profil formu updateProfile'ı çağırıyor
- 4 sayfa görsel olarak belirgin biçimde iyileşti — her sayfa tiramisu teması korunarak cilalı ve profesyonel
- transition-all duration-300 + hover:shadow-lg + hover:-translate-y-0.5 tüm interaktif kartlarda var
- Mobile-first responsive yapı bozulmadı
</success_criteria>

<output>
Tamamlandıktan sonra `.planning/quick/1-4-sayfay-g-rsel-olarak-ciddi-ekilde-iyil/1-SUMMARY.md` oluştur.
</output>
