import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  ExternalLink, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  X,
  SlidersHorizontal
} from 'lucide-react'
import { articlesApi, sourcesApi } from '../services/api'

interface Filters {
  search: string
  sourceId: string
  category: string
  dateFrom: string
  dateTo: string
}

const ArticlesPage = () => {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    sourceId: '',
    category: '',
    dateFrom: '',
    dateTo: ''
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  const itemsPerPage = 20

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
      setCurrentPage(1) // Reset to first page on search
    }, 500)

    return () => clearTimeout(timer)
  }, [filters.search])

  // Articles query
  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['articles', currentPage, debouncedSearch, filters.sourceId, filters.category, filters.dateFrom, filters.dateTo],
    queryFn: () => articlesApi.search({
      page: currentPage,
      limit: itemsPerPage,
      query: debouncedSearch,
      sourceId: filters.sourceId ? parseInt(filters.sourceId) : undefined,
      category: filters.category || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined
    })
  })

  // Sources query for filter dropdown
  const { data: sourcesData } = useQuery({
    queryKey: ['sources'],
    queryFn: sourcesApi.getAll
  })

  const articles = articlesData?.data || []
  const pagination = articlesData?.pagination || { page: 1, totalPages: 1, total: 0 }
  const sources = sourcesData?.data || []

  const categories = [
    { value: 'announcement', label: 'Duyuru' },
    { value: 'regulation', label: 'Mevzuat' },
    { value: 'financial', label: 'Finansal' },
    { value: 'legal', label: 'Hukuki' },
    { value: 'technology', label: 'Teknoloji' },
    { value: 'other', label: 'Diğer' }
  ]

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      sourceId: '',
      category: '',
      dateFrom: '',
      dateTo: ''
    })
    setCurrentPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tüm Duyurular
          </h1>
          <p className="text-lg text-gray-600">
            Resmi kurumlardan gelen güncel duyuru ve haberleri
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Duyuru ara..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} lg:btn-lg flex items-center`}
            >
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filtreler
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-primary-600 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Source Filter */}
                <div>
                  <label className="form-label">Kaynak</label>
                  <select
                    value={filters.sourceId}
                    onChange={(e) => handleFilterChange('sourceId', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Tüm Kaynaklar</option>
                    {sources.map((source: any) => (
                      <option key={source.id} value={source.id}>
                        {source.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="form-label">Kategori</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="form-input"
                  >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date From */}
                <div>
                  <label className="form-label">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="form-label">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={clearFilters}
                    className="btn btn-secondary btn-sm flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Filtreleri Temizle
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {pagination.total > 0 ? (
                <>
                  {((currentPage - 1) * itemsPerPage) + 1}-
                  {Math.min(currentPage * itemsPerPage, pagination.total)} arası, 
                  toplam {pagination.total} sonuç
                </>
              ) : (
                'Sonuç bulunamadı'
              )}
            </span>
            <span>Sayfa {currentPage} / {pagination.totalPages}</span>
          </div>
        </div>

        {/* Articles Grid */}
        {articlesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="card-body">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article: any) => (
              <article key={article.id} className="card hover:shadow-medium transition-shadow duration-200">
                <div className="card-body">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="badge badge-primary text-xs">
                        {article.source?.name || 'Bilinmeyen'}
                      </span>
                      {article.category && (
                        <span className="badge badge-gray text-xs">
                          {categories.find(c => c.value === article.category)?.label || article.category}
                        </span>
                      )}
                    </div>
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-3 truncate-3 leading-snug">
                    {article.title}
                  </h3>

                  {/* Description */}
                  {article.description && (
                    <p className="text-sm text-gray-600 truncate-3 mb-4 leading-relaxed">
                      {article.description}
                    </p>
                  )}

                  {/* Summary (if AI generated) */}
                  {article.summary && (
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-primary-800 font-medium mb-1">AI Özet:</p>
                      <p className="text-sm text-primary-700">{article.summary}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <time className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(article.publishedDate || article.createdAt).toLocaleDateString('tr-TR')}
                    </time>
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-primary-600 hover:text-primary-800 font-medium transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Kaynağa Git
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sonuç Bulunamadı</h3>
            <p className="text-gray-600 mb-4">
              Arama kriterlerinize uygun duyuru bulunamadı. Filtrelerinizi değiştirmeyi deneyin.
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-primary">
                Filtreleri Temizle
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Önceki
            </button>

            <div className="flex items-center space-x-1">
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="btn btn-outline w-10 h-10 p-0"
                  >
                    1
                  </button>
                  {currentPage > 4 && <span className="px-2 text-gray-500">...</span>}
                </>
              )}

              {/* Current page range */}
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const page = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i
                  if (page > pagination.totalPages) return null
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`btn w-10 h-10 p-0 ${
                        page === currentPage ? 'btn-primary' : 'btn-outline'
                      }`}
                    >
                      {page}
                    </button>
                  )
                }
              )}

              {/* Last page */}
              {currentPage < pagination.totalPages - 2 && (
                <>
                  {currentPage < pagination.totalPages - 3 && <span className="px-2 text-gray-500">...</span>}
                  <button
                    onClick={() => setCurrentPage(pagination.totalPages)}
                    className="btn btn-outline w-10 h-10 p-0"
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={currentPage === pagination.totalPages}
              className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArticlesPage 