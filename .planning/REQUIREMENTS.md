# Requirements: Tearamess

**Defined:** 2026-03-13
**Core Value:** Bulunduğun şehri bir keşif oyunu gibi deneyimle — gittiğin yerleri kaydet, gidecekklerini planla, Ankara'nın grid haritasını doldur ve istatistiklerini izle.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Polish & Bugfix

- [x] **PLSH-01**: Tüm sayfalara tutarlı Tiramisu renk teması uygulanır (inline style'lar kaldırılır, Tailwind CSS custom token'larına taşınır); renkler: #FFF8F0 krem/bg, #C08552 karamel/primary, #8C5A3C kahve/secondary, #4B2E2B espresso/dark
- [x] **PLSH-02**: `reviews` tablosunda "comment" kolonu yerine "content" kolonu kullanılacak şekilde tüm query ve type tanımları düzeltilir; yıldız rating 10 üzerinden 5 üzerine normalize edilir (StarRating komponenti 0–5 aralığında çalışır)
- [x] **PLSH-03**: Kartlar, shadow, hover efektleri ve form stilleri için tutarlı görsel dil oluşturulur; tüm etkileşimli elemanlarda geçiş animasyonları eklenir

### Infrastructure

- [x] **INFRA-01**: Service layer `src/lib/services/` oluşturulur ve mevcut inline Supabase sorguları buraya taşınır
- [x] **INFRA-02**: `middleware.ts` ile server-side auth koruması uygulanır, client-side yönlendirmeler kaldırılır
- [x] **INFRA-03**: Tüm yeni formlar Zod şema doğrulaması ve React Hook Form ile yazılır

### Social

- [x] **SOCL-01**: Kullanıcı başka bir kullanıcıyı takip edebilir (tek yönlü)
- [x] **SOCL-02**: Kullanıcı kendi takip/takipçi listesini görebilir
- [x] **SOCL-03**: Kullanıcı takip ettiklerinin son aktivitelerini (ziyaret, yorum) feed'de görebilir
- [x] **SOCL-04**: Kullanıcı başka bir kullanıcının herkese açık profilini, listelerini ve ziyaret geçmişini görebilir

### Lists

- [ ] **LIST-01**: Kullanıcı bir mekanı tek tıkla "Gideceğim Yerler" listesine ekleyip çıkarabilir
- [ ] **LIST-02**: Kullanıcı isimlendirilmiş özel liste oluşturabilir (örn. "En iyi kahvaltılıklar")
- [ ] **LIST-03**: Kullanıcı oluşturduğu listelere mekan ekleyip çıkarabilir
- [ ] **LIST-04**: Kullanıcı listesini herkese açık yapabilir; başkaları profilinde görebilir

### Exploration

- [ ] **XPLR-01**: Kullanıcı bir mekana check-in yapabilir
- [ ] **XPLR-02**: Check-in yapılan konumdan Ankara grid hücresi hesaplanır ve kullanıcı haritasında işaretlenir
- [ ] **XPLR-03**: Kullanıcı Ankara'nın yüzde kaçını keşfettiğini görebilir (boyalı hücre / toplam hücre)
- [ ] **XPLR-04**: Kullanıcı istatistik sayfasında toplam ziyaret sayısı, kategori dağılımı, aktiflik takvimi ve en çok gittiği bölgeleri görebilir

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Anonymous Notes

- **NOTE-01**: Kullanıcı bir mekana anonim not bırakabilir
- **NOTE-02**: O mekana check-in yapan kullanıcılar mevcut anonim notları keşfedebilir
- **NOTE-03**: Anonim notlarda user_id API payload'unda gizlenir (maskeleme)
- **NOTE-04**: Location-gate Supabase RLS policy ile server-side enforce edilir

### Events

- **EVNT-01**: Mekan bazlı etkinlik (sergi, konser, workshop) oluşturulabilir
- **EVNT-02**: Kullanıcı yaklaşan etkinlikleri keşfedebilir ve kayıt olabilir
- **EVNT-03**: Takip edilen mekanların etkinlikleri bildirim olarak gelir

### Multi-city

- **CITY-01**: Kullanıcı birden fazla şehir için grid oluşturabilir
- **CITY-02**: Şehir seçimi kayıt sırasında yapılır

## Out of Scope

| Feature | Reason |
|---------|--------|
| Eventler (v1) | Ghost-town riski — bootstrap stratejisi olmadan anlamsız; v2'ye ertelendi |
| Anonim notlar (v1) | RLS location-gate kompleksliği; check-in sistemi oturduktan sonra daha güvenli build edilir |
| Mobil uygulama | Web-first yaklaşım, mobil v2+ |
| İki yönlü arkadaşlık sistemi | Letterboxd tarzı tek yönlü takip yeterli |
| Gerçek zamanlı sohbet | Kapsam dışı |
| Ödeme/monetizasyon | v1 değil |
| Ankara dışı şehirler (v1) | Tek şehirde derinlik önce |

## Traceability

Which phases cover which requirements. Validated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLSH-01 | Phase 0 | Complete |
| PLSH-02 | Phase 0 | Complete |
| PLSH-03 | Phase 0 | Complete |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| SOCL-01 | Phase 2 | Complete |
| SOCL-02 | Phase 2 | Complete |
| SOCL-03 | Phase 2 | Complete |
| SOCL-04 | Phase 2 | Complete |
| LIST-01 | Phase 3 | Pending |
| LIST-02 | Phase 3 | Pending |
| LIST-03 | Phase 3 | Pending |
| LIST-04 | Phase 3 | Pending |
| XPLR-01 | Phase 4 | Pending |
| XPLR-02 | Phase 4 | Pending |
| XPLR-03 | Phase 5 | Pending |
| XPLR-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 — Phase 0 (Polish & Bugfix) added; PLSH-01, PLSH-02, PLSH-03 inserted; traceability updated*
