import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react'
import { authApi } from '../services/api'

const LoginPage = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem('auth-token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success('Giriş başarılı!')
      
      // Admin kullanıcısı ise admin panele yönlendir
      if (data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Giriş başarısız!')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate(formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Hızlı giriş butonları
  const quickLogin = (type: 'admin' | 'user') => {
    if (type === 'admin') {
      setFormData({
        email: 'admin@turkiyehaber.gov.tr',
        password: 'admin123'
      })
    } else {
      setFormData({
        email: 'user@test.com',
        password: 'test123'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Giriş Yapın
          </h2>
          <p className="mt-2 text-gray-600">
            Admin paneline erişim için giriş yapın
          </p>
        </div>

        {/* Hızlı Giriş Butonları */}
        <div className="bg-white rounded-lg p-4 shadow-soft">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Hızlı Giriş:</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => quickLogin('admin')}
              className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200"
            >
              👑 Admin
            </button>
            <button
              onClick={() => quickLogin('user')}
              className="btn btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
            >
              👤 User
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-medium p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input pl-10"
                  placeholder="admin@turkiyehaber.gov.tr"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="form-input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full btn btn-primary btn-lg"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Giriş yapılıyor...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <LogIn className="w-5 h-5" />
                  <span>Giriş Yap</span>
                </div>
              )}
            </button>
          </form>

          {/* Test Bilgileri */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Test Hesapları:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Admin:</strong> admin@turkiyehaber.gov.tr / admin123</div>
              <div><strong>User:</strong> user@test.com / test123</div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-primary-600 hover:text-primary-500 text-sm"
          >
            ← Ana sayfaya dön
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 