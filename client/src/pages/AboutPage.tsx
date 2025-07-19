import { 
  Building2, 
  Shield, 
  Globe, 
  Users, 
  CheckCircle, 
  Target, 
  Heart,
  Code,
  Rss,
  Bot,
  Search,
  Bell,
  TrendingUp,
  Lock
} from 'lucide-react'

const AboutPage = () => {
  const features = [
    {
      icon: Rss,
      title: 'RSS Beslemelerinden Veri Çekme',
      description: 'Resmi kurumların public RSS beslemelerinden otomatik veri toplama'
    },
    {
      icon: Bot,
      title: 'Kontrollü Web Scraping',
      description: 'robots.txt uyumlu, hukuka uygun web scraping teknikleri'
    },
    {
      icon: Search,
      title: 'Gelişmiş Arama',
      description: 'Kaynak, kategori, tarih bazlı detaylı arama ve filtreleme'
    },
    {
      icon: Bell,
      title: 'Akıllı Bildirimler',
      description: 'Abone olduğunuz konularda anlık e-posta bildirimleri'
    },
    {
      icon: TrendingUp,
      title: 'Finansal Veri Görselleştirme',
      description: 'TCMB döviz kurları ve finansal verilerin grafikli sunumu'
    },
    {
      icon: Lock,
      title: 'Güvenlik ve Gizlilik',
      description: 'KVKK/GDPR uyumlu veri koruma ve güvenlik önlemleri'
    }
  ]

  const sources = [
    { name: 'Resmi Gazete', type: 'RSS', status: 'Aktif' },
    { name: 'TCMB', type: 'RSS', status: 'Aktif' },
    { name: 'BDDK', type: 'RSS', status: 'Aktif' },
    { name: 'mevzuat.gov.tr', type: 'RSS', status: 'Aktif' },
    { name: 'SPK', type: 'Scraping', status: 'Aktif' },
    { name: 'EPDK', type: 'Scraping', status: 'Aktif' },
    { name: 'TÜBİTAK', type: 'Scraping', status: 'Aktif' },
    { name: 'Meteoroloji', type: 'RSS', status: 'Aktif' }
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <Building2 className="w-8 h-8 mr-3 text-primary-600" />
            Hakkımızda
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Türkiye'nin resmi kurumlarından gelen duyuru ve haberleri tek platformda toplayan, 
            tamamen hukuka uygun ve güvenilir bir bilgi merkezi.
          </p>
        </div>

        {/* Mission */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl text-white p-8 mb-12">
          <div className="max-w-4xl mx-auto text-center">
            <Target className="w-16 h-16 mx-auto mb-6 text-primary-100" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Misyonumuz</h2>
            <p className="text-lg text-primary-100 leading-relaxed">
              Vatandaşların resmi kurumlardan gelen önemli duyuru ve haberlere kolay, hızlı ve 
              güvenilir şekilde erişimini sağlamak. Hukuki riskleri sıfıra indirerek, 
              tamamen yasal yöntemlerle veri toplama ve sunma.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6 text-center">
            <Shield className="w-12 h-12 text-success-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hukuki Uyum</h3>
            <p className="text-gray-600 text-sm">
              Sadece resmi RSS beslemeleri ve hukuka uygun kaynaklardan veri topluyoruz. 
              Tüm işlemlerimiz yasal çerçevede gerçekleşir.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6 text-center">
            <Globe className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Şeffaflık</h3>
            <p className="text-gray-600 text-sm">
              Tüm veri kaynaklarımız açık şekilde belirtilir. Hangi bilginin nereden 
              geldiği her zaman görünür durumdadır.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6 text-center">
            <Users className="w-12 h-12 text-warning-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Halka Hizmet</h3>
            <p className="text-gray-600 text-sm">
              Amacımız ticari kazanç değil, vatandaşların bilgiye erişimini 
              kolaylaştırmak ve toplumsal faydayı artırmaktır.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            Özelliklerimiz
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                      <Icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 mb-12">
          <div className="card-header">
            <h2 className="text-2xl font-bold text-gray-900">Veri Kaynaklarımız</h2>
            <p className="text-gray-600">Türkiye'nin en güvenilir resmi kurumları</p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      source.status === 'Aktif' ? 'bg-success-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium text-gray-900">{source.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${
                      source.type === 'RSS' ? 'badge-primary' : 'badge-secondary'
                    } text-xs`}>
                      {source.type}
                    </span>
                    <span className="text-xs text-success-600 font-medium">
                      {source.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legal Compliance */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-primary-900 mb-6 text-center">
            Hukuki Uyum ve Veri Politikası
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-primary-900 mb-3">RSS Kaynakları</h3>
              <ul className="space-y-2 text-sm text-primary-800">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                  Resmi kurumların public RSS beslemeleri kullanılır
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                  Bu beslemeler herkesin erişimine açıktır
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                  Hiçbir içerik değişikliği yapılmaz
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary-900 mb-3">Kontrollü Scraping</h3>
              <ul className="space-y-2 text-sm text-primary-800">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                  robots.txt dosyalarına tamamen uygun
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                  Sadece başlık ve özet bilgileri alınır
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                  Orijinal kaynak her zaman belirtilir
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 mb-12">
          <div className="card-header">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Code className="w-6 h-6 mr-2 text-primary-600" />
              Teknoloji Altyapısı
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Frontend</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">React 18</span>
                    <span className="badge badge-primary text-xs">TypeScript</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Tailwind CSS</span>
                    <span className="badge badge-success text-xs">Modern</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">PWA Desteği</span>
                    <span className="badge badge-warning text-xs">Mobil</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Backend</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Node.js + Express</span>
                    <span className="badge badge-primary text-xs">TypeScript</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">SQLite Database</span>
                    <span className="badge badge-success text-xs">Hafif</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">RSS Parser</span>
                    <span className="badge badge-warning text-xs">Otomatik</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-br from-success-600 to-success-800 rounded-xl text-white p-8 text-center">
          <Heart className="w-16 h-16 mx-auto mb-6 text-success-100" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Bizimle İletişime Geçin</h2>
          <p className="text-lg text-success-100 mb-6 max-w-2xl mx-auto">
            Sorularınız, önerileriniz veya geri bildirimleriniz bizim için çok değerlidir. 
            Daha iyi bir hizmet sunmak için sizden gelen her türlü katkı önemlidir.
          </p>
          <a 
            href="/contact" 
            className="btn bg-white text-success-700 hover:bg-success-50 btn-lg"
          >
            İletişime Geçin
          </a>
        </div>
      </div>
    </div>
  )
}

export default AboutPage 