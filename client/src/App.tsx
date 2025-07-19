import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Workbox } from 'workbox-window'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import ArticlesPage from './pages/ArticlesPage'
import SourcesPage from './pages/SourcesPage'
import FinancialPage from './pages/FinancialPage'
import AboutPage from './pages/AboutPage'
import PrivacyPage from './pages/PrivacyPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import toast from 'react-hot-toast'

function App() {
  // PWA service worker registration
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      const wb = new Workbox('/sw.js')
      
      wb.addEventListener('waiting', () => {
        toast((t) => (
          <div className="flex items-center gap-2">
            <span>Yeni sürüm mevcut!</span>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => {
                wb.messageSkipWaiting()
                toast.dismiss(t.id)
              }}
            >
              Güncelle
            </button>
          </div>
        ), { duration: 10000 })
      })

      wb.addEventListener('controlling', () => {
        window.location.reload()
      })

      wb.register()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/financial" element={<FinancialPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App 