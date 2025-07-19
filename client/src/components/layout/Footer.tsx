import { Link } from 'react-router-dom'
import { Newspaper, Mail, Shield, FileText } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">TR Resmi Haber</h3>
                <p className="text-sm text-gray-400">Resmi Kurumlar</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Türkiye'nin resmi kurumlarından gelen duyuru ve haberleri 
              hukuka uygun şekilde tek platformdan takip edin.
            </p>
            <p className="text-sm text-gray-400">
              Tüm içerikler kaynak gösterilerek, telif haklarına saygı 
              duyularak sunulmaktadır.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Hızlı Erişim</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/articles" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Tüm Duyurular
                </Link>
              </li>
              <li>
                <Link to="/sources" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Kaynaklar
                </Link>
              </li>
              <li>
                <Link to="/financial" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Finansal Veriler
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-primary-400 transition-colors">
                  Hakkında
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Yasal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-primary-400 transition-colors flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-primary-400 transition-colors flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  İletişim
                </Link>
              </li>
              <li>
                <a 
                  href="/legal-notice" 
                  className="text-gray-300 hover:text-primary-400 transition-colors flex items-center"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Yasal Uyarı
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              © 2024 TR Resmi Haber. Tüm hakları saklıdır.
            </p>
            <div className="text-sm text-gray-400">
              <p>
                Bu site sadece resmi kaynaklardan bilgi toplar ve 
                <strong className="text-white ml-1">hukuka uygun</strong> şekilde hizmet verir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer 