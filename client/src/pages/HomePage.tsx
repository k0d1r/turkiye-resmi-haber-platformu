import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  TrendingUp, 
  Building2, 
  Clock,
  ExternalLink,
  Newspaper
} from 'lucide-react'
import { articlesApi } from '../services/api'

const HomePage = () => {
  // Son makaleleri getir
  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', 'latest'],
    queryFn: () => articlesApi.getLatest(8)
  })

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container section">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Türkiye Resmi Kurumlarının
              <span className="block text-primary-200">Duyuru ve Haberleri</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Resmi Gazete, TCMB, BDDK, SPK ve diğer resmi kurumların duyurularını 
              tek yerden takip edin. Hukuka uygun, güvenilir ve güncel bilgi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/articles" 
                className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100"
              >
                <Newspaper className="w-5 h-5 mr-2" />
                Tüm Duyuruları Görüntüle
              </Link>
              <Link 
                to="/sources" 
                className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600"
              >
                <Building2 className="w-5 h-5 mr-2" />
                Kaynakları İncele
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-600 mb-1">8+</div>
              <div className="text-sm text-gray-600">Resmi Kurum</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-600 mb-1">1000+</div>
              <div className="text-sm text-gray-600">Güncel Duyuru</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-600 mb-1">24/7</div>
              <div className="text-sm text-gray-600">Otomatik Güncelleme</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary-600 mb-1">100%</div>
              <div className="text-sm text-gray-600">Hukuka Uygun</div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="section">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Son Duyurular
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Resmi kurumlardan gelen en güncel duyuru ve haberleri
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="card-body">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles?.data?.slice(0, 8).map((article: any) => (
                <article key={article.id} className="card hover:shadow-medium transition-shadow duration-200">
                  <div className="card-body">
                    <div className="flex items-start justify-between mb-3">
                      <span className="badge badge-primary text-xs">
                        {article.source?.name || 'Bilinmeyen'}
                      </span>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 truncate-2 line-clamp-2">
                      {article.title}
                    </h3>
                    
                    {article.description && (
                      <p className="text-sm text-gray-600 truncate-3 mb-3">
                        {article.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <time>
                        {new Date(article.publishedDate || article.createdAt).toLocaleDateString('tr-TR')}
                      </time>
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-primary-600 hover:text-primary-800"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Kaynağı Gör
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link 
              to="/articles" 
              className="btn btn-primary btn-lg"
            >
              Tüm Duyuruları Görüntüle
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white section">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Özellikler
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Modern teknoloji ile güvenilir haber takibi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Resmi Kaynaklar
              </h3>
              <p className="text-gray-600">
                Sadece resmi kurumların RSS beslemeleri ve hukuka uygun kaynaklar
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Finansal Veriler
              </h3>
              <p className="text-gray-600">
                TCMB döviz kurları ve finansal verilerin grafikli görünümü
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-warning-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Anlık Güncelleme
              </h3>
              <p className="text-gray-600">
                Duyurular yayınlandığı anda otomatik olarak sisteme eklenir
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage 