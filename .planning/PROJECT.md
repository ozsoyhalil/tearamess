# Tearamess

## What This Is

Tearamess, mekanlar için Letterboxd — Ankara odaklı bir mekan keşif ve takip platformu. Kullanıcılar kafeler, parklar, müzeler, sokaklar gibi her türlü mekanı puanlar, değerlendirir, listelere ekler; şehrin grid haritasını fetheder gibi keşfederken istatistik biriktirir ve arkadaşlarını takip eder.

## Core Value

Bulunduğun şehri bir keşif oyunu gibi deneyimle — gittiğin yerleri kaydet, gidecekklerini planla, Ankara'nın grid haritasını doldur ve istatistiklerini izle.

## Requirements

### Validated

- ✓ Kullanıcı email/şifre ile kayıt olabilir ve giriş yapabilir — existing
- ✓ Kullanıcı mekanları kategoriye göre filtreleyerek keşfedebilir — existing
- ✓ Kullanıcı bir mekana yıldız puanı (0–5, 0.5 artışlı) verebilir ve yorum yazabilir — existing
- ✓ Kullanıcı yeni mekan ekleyebilir — existing
- ✓ Kullanıcı kendi profil sayfasını görebilir — existing
- ✓ Tiramisu renk teması uygulanmış (#4B2E2B, #C08552, #F5EDE4, #FFF8F0) — existing

### Active

- [ ] Kullanıcı "Gideceğim Yerler" listesi oluşturabilir (watchlist benzeri)
- [ ] Kullanıcı özel listeler oluşturabilir ve mekanlara ekleyebilir
- [ ] Ankara grid sistemi: şehir ızgara karelerine bölünür, gidilen kareleri boyar ve yüzdelik gösterir
- [ ] Kullanıcı detaylı istatistiklerini görebilir (ziyaret edilen yer sayısı, kategoriler dağılımı, aktiflik)
- [ ] Kullanıcı başka kullanıcıları takip edebilir (tek yönlü, Letterboxd tarzı)
- [ ] Kullanıcı takip ettiği kişilerin aktivitesini akışta görebilir
- [ ] Mekanlar için mekan bazlı etkinlikler (sergi, konser, workshop) oluşturulabilir ve takip edilebilir
- [ ] Kullanıcı bir konuma anonim not bırakabilir; o konuma giden başkaları bu notu keşfeder
- [ ] Kullanıcı başka kullanıcıların profillerini, listelerini ve yorumlarını görebilir

### Out of Scope

- Ankara dışı şehirler (v1) — önce bir şehri iyi yap
- Mobil uygulama — web-first
- İki yönlü arkadaşlık sistemi — Letterboxd gibi tek yönlü takip yeterli
- Gerçek zamanlı sohbet — kapsam dışı
- Ödeme/monetizasyon — v1 değil

## Context

- **Mevcut kod tabanı**: Next.js 16 App Router, Supabase (auth + PostgreSQL), Tailwind CSS v4, TypeScript. Client-heavy mimari — çoğu veri client-side Supabase JS SDK ile çekiliyor.
- **Mimari not**: Şu an service layer yok, Supabase sorguları direkt page component'larında yazılmış. Yeni özellikler eklenirken service/repository katmanı eklenmesi gerekecek.
- **Şehir**: Ankara. Grid sistemi Ankara sınırları için tasarlanacak.
- **Tema**: Tiramisu renk paleti var ve korunacak.

## Constraints

- **Tech Stack**: Next.js + Supabase + TypeScript — değiştirilmez, mevcut kod buna göre yazılmış
- **Şehir**: v1 sadece Ankara
- **Sosyal model**: Tek yönlü takip (follow), iki yönlü arkadaşlık yok
- **Anonim notlar**: Yalnızca o konuma giden kullanıcılar görebilir (location-gated)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Letterboxd-style tek yönlü takip | Mekan keşfinde içerik kalitesi önemli, mutual follow yerine iyi insan takip etmek yeterli | — Pending |
| Grid sistemi (Snap Map benzeri) | Şehri "fethetmek" hissi veriyor, mahalle bazından daha oyunlaştırıcı | — Pending |
| Anonim notlar location-gated | Sadece o yere gidenlerin görmesi sürprizi ve anlamı artırır | — Pending |
| v1 sadece Ankara | Tek şehirde derinlik, birden fazla şehirde yüzeysellik yerine | — Pending |

---
*Last updated: 2026-03-13 after initialization*
