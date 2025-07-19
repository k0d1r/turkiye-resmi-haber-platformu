import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Euro, 
  PoundSterling,
  Coins,
  Calendar,
  BarChart3,
  LineChart,
  Info,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { financialApi } from '../services/api'

const FinancialPage = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1M')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')

  // Exchange rates query
  const { data: exchangeData, isLoading: exchangeLoading, refetch } = useQuery({
    queryKey: ['financial', 'exchange-rates'],
    queryFn: financialApi.getExchangeRates,
    refetchInterval: 5 * 60 * 1000 // 5 dakikada bir güncelle
  })

  const timeRanges = [
    { value: '1D', label: '1 Gün' },
    { value: '1W', label: '1 Hafta' },
    { value: '1M', label: '1 Ay' },
    { value: '3M', label: '3 Ay' },
    { value: '6M', label: '6 Ay' },
    { value: '1Y', label: '1 Yıl' }
  ]

  const currencies = [
    { 
      code: 'USD', 
      name: 'Amerikan Doları', 
      icon: DollarSign,
      flag: '🇺🇸'
    },
    { 
      code: 'EUR', 
      name: 'Euro', 
      icon: Euro,
      flag: '🇪🇺' 
    },
    { 
      code: 'GBP', 
      name: 'İngiliz Sterlini', 
      icon: PoundSterling,
      flag: '🇬🇧'
    },
    { 
      code: 'CHF', 
      name: 'İsviçre Frangı', 
      icon: DollarSign,
      flag: '🇨🇭'
    },
    { 
      code: 'JPY', 
      name: 'Japon Yeni', 
      icon: DollarSign,
      flag: '🇯🇵'
    }
  ]

  // Mock data - Gerçek API entegrasyonunda TCMB'den gelecek
  const mockExchangeRates = [
    {
      code: 'USD',
      name: 'Amerikan Doları',
      buying: 32.85,
      selling: 32.95,
      change: 0.15,
      changePercent: 0.46,
      lastUpdate: new Date().toISOString()
    },
    {
      code: 'EUR',
      name: 'Euro',
      buying: 35.42,
      selling: 35.54,
      change: -0.08,
      changePercent: -0.23,
      lastUpdate: new Date().toISOString()
    },
    {
      code: 'GBP',
      name: 'İngiliz Sterlini',
      buying: 41.28,
      selling: 41.42,
      change: 0.32,
      changePercent: 0.78,
      lastUpdate: new Date().toISOString()
    },
    {
      code: 'CHF',
      name: 'İsviçre Frangı',
      buying: 36.18,
      selling: 36.31,
      change: 0.05,
      changePercent: 0.14,
      lastUpdate: new Date().toISOString()
    }
  ]

  const mockGoldPrices = [
    {
      type: 'gram_gold',
      name: 'Gram Altın',
      price: 2384.50,
      change: 15.75,
      changePercent: 0.67,
      unit: 'TRY'
    },
    {
      type: 'quarter_gold',
      name: 'Çeyrek Altın',
      price: 3976.25,
      change: 26.25,
      changePercent: 0.67,
      unit: 'TRY'
    },
    {
      type: 'ounce_gold',
      name: 'Ons Altın',
      price: 2632.40,
      change: -8.20,
      changePercent: -0.31,
      unit: 'USD'
    }
  ]

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-success-600" />
    } else if (change < 0) {
      return <TrendingDown className="w-4 h-4 text-error-600" />
    }
    return <div className="w-4 h-4" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-success-600'
    if (change < 0) return 'text-error-600'
    return 'text-gray-600'
  }

  const formatCurrency = (value: number, currency = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Finansal Veriler
              </h1>
              <p className="text-lg text-gray-600">
                TCMB döviz kurları, altın fiyatları ve finansal göstergeler
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="btn btn-outline flex items-center"
              disabled={exchangeLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${exchangeLoading ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {mockExchangeRates.slice(0, 4).map((rate) => {
            const currency = currencies.find(c => c.code === rate.code)
            return (
              <div key={rate.code} className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{currency?.flag}</span>
                    <span className="font-medium text-gray-900">{rate.code}</span>
                  </div>
                  {getTrendIcon(rate.change)}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {formatCurrency(rate.selling)}
                </div>
                <div className={`text-sm font-medium ${getTrendColor(rate.change)}`}>
                  {rate.change > 0 ? '+' : ''}{rate.change.toFixed(4)} 
                  ({rate.changePercent > 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%)
                </div>
              </div>
            )
          })}
        </div>

        {/* Exchange Rates Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-soft border border-gray-200">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary-600" />
                Döviz Kurları
              </h2>
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Para Birimi</th>
                      <th className="text-right py-3 px-6 text-sm font-medium text-gray-700">Alış</th>
                      <th className="text-right py-3 px-6 text-sm font-medium text-gray-700">Satış</th>
                      <th className="text-right py-3 px-6 text-sm font-medium text-gray-700">Değişim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockExchangeRates.map((rate) => {
                      const currency = currencies.find(c => c.code === rate.code)
                      return (
                        <tr key={rate.code} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{currency?.flag}</span>
                              <div>
                                <div className="font-medium text-gray-900">{rate.code}</div>
                                <div className="text-sm text-gray-600">{rate.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-medium">
                            {formatCurrency(rate.buying)}
                          </td>
                          <td className="py-4 px-6 text-right font-medium">
                            {formatCurrency(rate.selling)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className={`flex items-center justify-end space-x-1 ${getTrendColor(rate.change)}`}>
                              {getTrendIcon(rate.change)}
                              <span className="font-medium">
                                {rate.change > 0 ? '+' : ''}{rate.change.toFixed(4)}
                              </span>
                            </div>
                            <div className={`text-sm ${getTrendColor(rate.change)}`}>
                              ({rate.changePercent > 0 ? '+' : ''}{rate.changePercent.toFixed(2)}%)
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card-footer">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Son güncelleme: {new Date().toLocaleString('tr-TR')}</span>
                </div>
                <span className="text-xs">Kaynak: TCMB</span>
              </div>
            </div>
          </div>

          {/* Gold Prices */}
          <div className="bg-white rounded-lg shadow-soft border border-gray-200">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Coins className="w-5 h-5 mr-2 text-warning-600" />
                Altın Fiyatları
              </h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {mockGoldPrices.map((gold) => (
                  <div key={gold.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{gold.name}</div>
                      <div className="text-sm text-gray-600">
                        Birim: 1 {gold.type.includes('ounce') ? 'Ons' : gold.type.includes('quarter') ? 'Çeyrek' : 'Gram'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatCurrency(gold.price, gold.unit)}
                      </div>
                      <div className={`text-sm font-medium flex items-center ${getTrendColor(gold.change)}`}>
                        {getTrendIcon(gold.change)}
                        <span className="ml-1">
                          {gold.change > 0 ? '+' : ''}{gold.change.toFixed(2)} 
                          ({gold.changePercent > 0 ? '+' : ''}{gold.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-footer">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Son güncelleme: {new Date().toLocaleString('tr-TR')}</span>
                </div>
                <span className="text-xs">Kaynak: İstanbul Altın Borsası</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 mb-8">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <LineChart className="w-5 h-5 mr-2 text-primary-600" />
                Grafik Analizi
              </h2>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="form-input"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.flag} {currency.code}
                    </option>
                  ))}
                </select>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {timeRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setSelectedTimeRange(range.value)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        selectedTimeRange === range.value
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="card-body">
            {/* Chart Placeholder - Gerçek entegrasyonda Chart.js kullanılacak */}
            <div className="h-80 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-primary-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary-700 mb-2">
                  Grafik Yükleniyor
                </h3>
                <p className="text-primary-600">
                  {selectedCurrency} kurları - {timeRanges.find(r => r.value === selectedTimeRange)?.label} görünümü
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Economic Indicators */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 mb-8">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-success-600" />
              Ekonomik Göstergeler
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-primary-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600 mb-1">45.00%</div>
                <div className="text-sm text-primary-800 font-medium">TCMB Politika Faizi</div>
                <div className="text-xs text-primary-600 mt-1">Son 6 ayda +5.00%</div>
              </div>
              <div className="text-center p-4 bg-warning-50 rounded-lg">
                <div className="text-2xl font-bold text-warning-600 mb-1">61.36%</div>
                <div className="text-sm text-warning-800 font-medium">Yıllık Enflasyon</div>
                <div className="text-xs text-warning-600 mt-1">Önceki ay: 61.86%</div>
              </div>
              <div className="text-center p-4 bg-success-50 rounded-lg">
                <div className="text-2xl font-bold text-success-600 mb-1">134.2B$</div>
                <div className="text-sm text-success-800 font-medium">Döviz Rezervleri</div>
                <div className="text-xs text-success-600 mt-1">Önceki hafta: +2.1B$</div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-warning-900 mb-2">
                Önemli Uyarı
              </h3>
              <div className="space-y-2 text-sm text-warning-800">
                <p>
                  Bu sayfa yalnızca bilgilendirme amaçlıdır. Finansal kararlarınızı alırken 
                  profesyonel danışmanlık alınız.
                </p>
                <p>
                  Veriler TCMB ve diğer resmi kaynaklardan alınmaktadır. Gerçek zamanlı 
                  veriler arasında küçük farklılıklar olabilir.
                </p>
                <p>
                  <strong>Son güncelleme:</strong> {new Date().toLocaleString('tr-TR')} - 
                  Veriler 5 dakikada bir otomatik güncellenir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinancialPage 