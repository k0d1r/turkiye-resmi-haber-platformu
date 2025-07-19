import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { 
  Users, 
  FileText, 
  Building2, 
  TrendingUp, 
  Shield, 
  LogOut,
  Eye,
  Edit,
  Trash2,
  Plus,
  Calendar,
  Activity
} from 'lucide-react'
import { authApi } from '../services/api'

const AdminPage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    // Kullanıcı bilgilerini kontrol et
    const userData = localStorage.getItem('user')
    if (!userData) {
      navigate('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin') {
      toast.error('Bu sayfaya erişim yetkiniz yok!')
      navigate('/')
      return
    }

    setUser(parsedUser)
  }, [navigate])

  // Mock admin data
  const { data: dashboardData } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => ({
      stats: {
        totalUsers: 1247,
        totalArticles: 3580,
        totalSources: 12,
        dailyViews: 15420
      },
      recentActivities: [
        { id: 1, action: 'Yeni makale eklendi', source: 'TCMB', time: '5 dakika önce' },
        { id: 2, action: 'Kullanıcı kaydı', user: 'user@test.com', time: '12 dakika önce' },
        { id: 3, action: 'Kaynak güncellendi', source: 'SPK', time: '1 saat önce' }
      ]
    }),
    enabled: !!user
  })

  const handleLogout = () => {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user')
    toast.success('Çıkış yapıldı')
    navigate('/')
  }

  if (!user) {
    return <div>Yükleniyor...</div>
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: Activity },
    { id: 'users', name: 'Kullanıcılar', icon: Users },
    { id: 'articles', name: 'Makaleler', icon: FileText },
    { id: 'sources', name: 'Kaynaklar', icon: Building2 }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">Türkiye Resmi Haber Sitesi</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-outline flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="card">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData?.stats.totalUsers.toLocaleString()}
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="card">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Toplam Makale</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData?.stats.totalArticles.toLocaleString()}
                          </p>
                        </div>
                        <FileText className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="card">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Aktif Kaynak</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData?.stats.totalSources}
                          </p>
                        </div>
                        <Building2 className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="card">
                    <div className="card-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Günlük Görüntüleme</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData?.stats.dailyViews.toLocaleString()}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold">Son Aktiviteler</h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      {dashboardData?.recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Activity className="w-5 h-5 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Kullanıcı Yönetimi</h2>
                  <button className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Kullanıcı
                  </button>
                </div>
                
                <div className="card">
                  <div className="card-body">
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Kullanıcı yönetimi modülü geliştiriliyor...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'articles' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Makale Yönetimi</h2>
                  <button className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Makale
                  </button>
                </div>
                
                <div className="card">
                  <div className="card-body">
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Makale yönetimi modülü geliştiriliyor...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Kaynak Yönetimi</h2>
                  <button className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Kaynak
                  </button>
                </div>
                
                <div className="card">
                  <div className="card-body">
                    <div className="text-center py-12">
                      <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Kaynak yönetimi modülü geliştiriliyor...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminPage 