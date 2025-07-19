import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Building2, 
  ExternalLink, 
  Globe, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Rss,
  Bot,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { sourcesApi, articlesApi } from '../services/api'

const SourcesPage = () => {
  const [expandedSources, setExpandedSources] = useState<number[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  // Sources query
  const { data: sourcesData, isLoading: sourcesLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: sourcesApi.getAll
  })

  const sources = sourcesData?.data || []

  const categories = [
    { value: '', label: 'Tüm Kaynaklar' },
    { value: 'rss', label: 'RSS Kaynakları' },
    { value: 'scraping', label: 'Kontrollü Scraping' }
  ]

  const filteredSources = sources.filter((source: any) => 
    categoryFilter === '' || source.category === categoryFilter
  )

  const toggleSourceExpansion = (sourceId: number) => {
    setExpandedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-error-600" />
      case 'inactive':
        return <AlertCircle className="w-5 h-5 text-warning-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif'
      case 'error':
        return 'Hata'
      case 'inactive':
        return 'Pasif'
      default:
        return 'Bilinmeyen'
    }
  }

  const getCategoryIcon = (category: string) => {
    return category === 'rss' 
      ? <Rss className="w-5 h-5 text-primary-600" />
      : <Bot className="w-5 h-5 text-secondary-600" />
  }

  const getCategoryText = (category: string) => {
    return category === 'rss' ? 'RSS Beslemesi' : 'Kontrollü Scraping'
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Resmi Kaynaklar
          </h1>
          <p className="text-lg text-gray-600">
            Türkiye'nin resmi kurumlarından hukuka uygun veri kaynakları
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {sources.length}
            </div>
            <div className="text-sm text-gray-600">Toplam Kaynak</div>
          </div>
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-success-600 mb-1">
              {sources.filter((s: any) => s.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Aktif Kaynak</div>
          </div>
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {sources.filter((s: any) => s.category === 'rss').length}
            </div>
            <div className="text-sm text-gray-600">RSS Kaynağı</div>
          </div>
          <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-secondary-600 mb-1">
              {sources.filter((s: any) => s.category === 'scraping').length}
            </div>
            <div className="text-sm text-gray-600">Scraping Kaynağı</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Kategori:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-input max-w-xs"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sources Grid */}
        {sourcesLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="card-body">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSources.map((source: any) => (
              <SourceCard 
                key={source.id} 
                source={source}
                isExpanded={expandedSources.includes(source.id)}
                onToggleExpansion={() => toggleSourceExpansion(source.id)}
                getStatusIcon={getStatusIcon}
                getStatusText={getStatusText}
                getCategoryIcon={getCategoryIcon}
                getCategoryText={getCategoryText}
              />
            ))}
          </div>
        )}

        {filteredSources.length === 0 && !sourcesLoading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kaynak Bulunamadı</h3>
            <p className="text-gray-600">
              Seçtiğiniz kategori için kaynak bulunamadı.
            </p>
          </div>
        )}

        {/* Legal Notice */}
        <div className="mt-12 bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-3">
            Hukuki Uyum ve Veri Kaynakları
          </h3>
          <div className="space-y-2 text-sm text-primary-800">
            <p>
              <strong>RSS Kaynakları:</strong> Resmi kurumların public RSS beslemeleri kullanılır. 
              Bu beslemeler herkesin erişimine açıktır.
            </p>
            <p>
              <strong>Kontrollü Scraping:</strong> robots.txt dosyalarına ve kullanım şartlarına 
              tamamen uygun şekilde, sadece başlık ve özet bilgileri alınır.
            </p>
            <p>
              <strong>İçerik Politikası:</strong> Hiçbir içerik değiştirilmez, tüm makaleler 
              kaynak gösterilerek orijinal bağlantılarıyla sunulur.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Source Card Component
const SourceCard = ({ 
  source, 
  isExpanded, 
  onToggleExpansion, 
  getStatusIcon, 
  getStatusText, 
  getCategoryIcon, 
  getCategoryText 
}: any) => {
  // Recent articles for expanded view
  const { data: articlesData } = useQuery({
    queryKey: ['articles', 'source', source.id],
    queryFn: () => articlesApi.getBySource(source.id, 5),
    enabled: isExpanded
  })

  const articles = articlesData?.data || []

  return (
    <div className="card hover:shadow-medium transition-shadow duration-200">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {source.iconUrl ? (
              <img 
                src={source.iconUrl} 
                alt={source.name}
                className="w-8 h-8 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 leading-tight">
                {source.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                {getCategoryIcon(source.category)}
                <span className="text-xs text-gray-600">
                  {getCategoryText(source.category)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(source.status)}
            <span className="text-xs font-medium">
              {getStatusText(source.status)}
            </span>
          </div>
        </div>

        {/* Description */}
        {source.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {source.description}
          </p>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <a 
              href={source.baseUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="link truncate"
            >
              {source.baseUrl.replace(/^https?:\/\//, '')}
            </a>
          </div>
          
          {source.lastFetched && (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 truncate">
                {new Date(source.lastFetched).toLocaleDateString('tr-TR')}
              </span>
            </div>
          )}

          {source.rssUrl && (
            <div className="flex items-center space-x-2 col-span-2">
              <Rss className="w-4 h-4 text-gray-400" />
              <a 
                href={source.rssUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="link text-xs truncate"
              >
                RSS Feed
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Güncellenme: {source.fetchInterval} dk</span>
            {source.isOfficial && (
              <span className="badge badge-success text-xs">Resmi</span>
            )}
          </div>
          
          <button
            onClick={onToggleExpansion}
            className="btn btn-outline btn-sm flex items-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            Son Duyurular
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1" />
            )}
          </button>
        </div>

        {/* Expanded Content - Recent Articles */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Son Duyurular
            </h4>
            {articles.length > 0 ? (
              <div className="space-y-3">
                {articles.map((article: any) => (
                  <div key={article.id} className="bg-gray-50 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-1 truncate-2">
                      {article.title}
                    </h5>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(article.publishedDate || article.createdAt)
                            .toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <a 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-primary-600 hover:text-primary-800"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Görüntüle
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Henüz duyuru bulunamadı
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SourcesPage 