import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section
        className="min-h-[70vh] flex items-center justify-center px-4 py-20"
        style={{ background: 'linear-gradient(160deg, #F5EDE4 0%, #FFF8F0 60%, #FFF8F0 100%)' }}
      >
        <div className="text-center max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] mb-6 text-caramel">
            Mekanlar için Letterboxd
          </p>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-espresso">
            Her mekanın bir{' '}
            <em className="not-italic text-caramel">hikayesi</em>{' '}
            var.
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed text-coffee">
            Ziyaret ettiğin mekanları puanla, listele ve keşfet.
            Kafelerden parklara, sokaklardan manzara noktalarına.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/explore"
              className="px-8 py-3 rounded-full font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 bg-caramel text-cream"
            >
              Keşfetmeye Başla
            </Link>
            <Link
              href="/new"
              className="px-8 py-3 rounded-full font-semibold text-base border-2 transition-all duration-300 border-espresso text-espresso hover:bg-espresso hover:text-cream"
            >
              Mekan Ekle
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-espresso">
            Nasıl Çalışır?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                emoji: '📍',
                title: 'Mekan Ekle',
                desc: 'Keşfettiğin yerleri topluluğa tanıt. Kafe, park, manzara noktası — her yer olabilir.',
              },
              {
                emoji: '🌟',
                title: 'Değerlendir',
                desc: '5 üzerinden, yarım yıldıza kadar hassas puanla. Deneyimini anlat.',
              },
              {
                emoji: '🗺️',
                title: 'Keşfet',
                desc: 'Başkalarının favorilerini bul. Şehre ve kategoriye göre filtrele.',
              },
            ].map(({ emoji, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg bg-warmgray-100"
              >
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="font-semibold text-lg mb-2 text-espresso">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-coffee">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
