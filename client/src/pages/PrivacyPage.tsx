import { Shield, Eye, Lock, UserCheck, FileText, Mail, Clock } from 'lucide-react'

const PrivacyPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-primary-600" />
            Gizlilik Politikası
          </h1>
          <p className="text-lg text-gray-600">
            Kişisel verilerinizin korunması bizim için önemlidir. KVKK ve GDPR uyumlu gizlilik politikamız.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">İçindekiler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a href="#veri-sorumlusu" className="link flex items-center">
              <UserCheck className="w-4 h-4 mr-2" />
              Veri Sorumlusu
            </a>
            <a href="#toplanan-veriler" className="link flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Toplanan Veriler
            </a>
            <a href="#veri-guvenliği" className="link flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              Veri Güvenliği
            </a>
            <a href="#haklarınız" className="link flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Haklarınız
            </a>
            <a href="#iletisim" className="link flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              İletişim
            </a>
            <a href="#degisiklikler" className="link flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Değişiklikler
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-soft border border-gray-200">
          <div className="prose prose-gray max-w-none p-8">
            
            {/* 1. Veri Sorumlusu */}
            <section id="veri-sorumlusu" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <UserCheck className="w-6 h-6 mr-2 text-primary-600" />
                1. Veri Sorumlusu
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Bu web sitesi, Türkiye'nin resmi kurumlarından gelen duyuru ve haberleri toplayan 
                bir bilgi platformudur. Kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması 
                Kanunu (KVKK) ve AB Genel Veri Koruma Tüzüğü (GDPR) kapsamında korunmaktadır.
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h3 className="font-semibold text-primary-900 mb-2">İletişim Bilgileri:</h3>
                <ul className="text-sm text-primary-800 space-y-1">
                  <li><strong>E-posta:</strong> privacy@turkiyeresmihaber.com</li>
                  <li><strong>Adres:</strong> [Adres bilgisi eklenecek]</li>
                  <li><strong>Telefon:</strong> [Telefon numarası eklenecek]</li>
                </ul>
              </div>
            </section>

            {/* 2. Toplanan Veriler */}
            <section id="toplanan-veriler" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-2 text-primary-600" />
                2. Toplanan Kişisel Veriler
              </h2>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">2.1. Otomatik Olarak Toplanan Veriler</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>IP adresi ve coğrafi konum (ülke/şehir düzeyinde)</li>
                <li>Tarayıcı türü ve versiyonu</li>
                <li>Ziyaret edilen sayfalar ve geçirilen süre</li>
                <li>Referer URL (hangi siteden geldiğiniz)</li>
                <li>Cihaz türü (masaüstü, mobil, tablet)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">2.2. Gönüllü Olarak Sağlanan Veriler</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>E-posta adresi (abonelik için)</li>
                <li>Ad ve soyad (isteğe bağlı)</li>
                <li>İletişim formu bilgileri</li>
                <li>Yorum ve geri bildirimler</li>
              </ul>

              <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                <h4 className="font-semibold text-success-900 mb-2">Önemli Not:</h4>
                <p className="text-sm text-success-800">
                  Hiçbir zaman şifre, kredi kartı bilgisi veya kimlik numarası gibi 
                  hassas kişisel veriler toplamıyoruz.
                </p>
              </div>
            </section>

            {/* 3. Veri Kullanım Amaçları */}
            <section id="veri-kullanimi" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Verilerin Kullanım Amaçları
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Hizmet Sunumu</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Site işlevselliğinin sağlanması</li>
                    <li>• Kişiselleştirilmiş içerik sunumu</li>
                    <li>• Teknik sorunların çözümü</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">İletişim</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Abonelik bildirimlerinin gönderilmesi</li>
                    <li>• Kullanıcı sorularının yanıtlanması</li>
                    <li>• Önemli güncellemelerin duyurulması</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Analiz</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Site kullanım istatistiklerinin analizi</li>
                    <li>• Performans optimizasyonu</li>
                    <li>• Kullanıcı deneyiminin iyileştirilmesi</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Güvenlik</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Spam ve kötüye kullanım önleme</li>
                    <li>• Güvenlik ihlallerinin tespiti</li>
                    <li>• Yasal yükümlülüklerin yerine getirilmesi</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 4. Veri Güvenliği */}
            <section id="veri-guvenliği" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Lock className="w-6 h-6 mr-2 text-primary-600" />
                4. Veri Güvenliği Önlemleri
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Kişisel verilerinizin güvenliğini sağlamak için aşağıdaki teknik ve idari 
                önlemleri almaktayız:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Teknik Önlemler</h4>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>SSL/TLS şifreleme (HTTPS)</li>
                    <li>Güvenli veri saklama</li>
                    <li>Düzenli güvenlik güncellemeleri</li>
                    <li>Erişim kontrolü ve kimlik doğrulama</li>
                    <li>Veri yedekleme ve kurtarma</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">İdari Önlemler</h4>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Personel gizlilik eğitimleri</li>
                    <li>Erişim yetkilendirme sistemi</li>
                    <li>Güvenlik politikaları ve prosedürler</li>
                    <li>Düzenli güvenlik denetimleri</li>
                    <li>Olay müdahale planları</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 5. Çerezler */}
            <section id="cerezler" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. Çerezler (Cookies)
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Web sitemizde kullanıcı deneyimini iyileştirmek için çerezler kullanmaktayız. 
                Çerez tercihleri tamamen sizin kontrolünüzdedir.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Çerez Türü</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Amaç</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Süre</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-200">
                      <td className="py-3 px-4 font-medium">Zorunlu Çerezler</td>
                      <td className="py-3 px-4 text-gray-700">Site işlevselliği</td>
                      <td className="py-3 px-4 text-gray-700">Oturum süresi</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="py-3 px-4 font-medium">Analitik Çerezler</td>
                      <td className="py-3 px-4 text-gray-700">Kullanım analizi</td>
                      <td className="py-3 px-4 text-gray-700">2 yıl</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="py-3 px-4 font-medium">Tercih Çerezleri</td>
                      <td className="py-3 px-4 text-gray-700">Kullanıcı tercihleri</td>
                      <td className="py-3 px-4 text-gray-700">1 yıl</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 6. Kullanıcı Hakları */}
            <section id="haklarınız" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-2 text-primary-600" />
                6. KVKK Kapsamındaki Haklarınız
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h4 className="font-semibold text-primary-900 mb-2">Bilgi Talep Etme</h4>
                  <p className="text-sm text-primary-800">
                    Kişisel verilerinizin işlenip işlenmediğini öğrenme ve 
                    işlenme amaçlarını sorgulama hakkı.
                  </p>
                </div>
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h4 className="font-semibold text-primary-900 mb-2">Düzeltme Talep Etme</h4>
                  <p className="text-sm text-primary-800">
                    Eksik veya yanlış işlenen kişisel verilerinizin 
                    düzeltilmesini talep etme hakkı.
                  </p>
                </div>
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h4 className="font-semibold text-primary-900 mb-2">Silme Talep Etme</h4>
                  <p className="text-sm text-primary-800">
                    Yasal saklama süreleri dolmuş veya işleme amacı 
                    ortadan kalkmış verilerinizin silinmesini talep etme hakkı.
                  </p>
                </div>
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h4 className="font-semibold text-primary-900 mb-2">İtiraz Etme</h4>
                  <p className="text-sm text-primary-800">
                    Kişisel verilerinizin işlenmesine itiraz etme ve 
                    zarar görmeniz halinde tazminat talep etme hakkı.
                  </p>
                </div>
              </div>
            </section>

            {/* 7. İletişim */}
            <section id="iletisim" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Mail className="w-6 h-6 mr-2 text-primary-600" />
                7. İletişim ve Başvuru
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 leading-relaxed mb-4">
                  KVKK kapsamındaki haklarınızı kullanmak veya gizlilik politikamız 
                  hakkında sorularınız için bizimle iletişime geçebilirsiniz:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">E-posta</h4>
                    <p className="text-gray-700">privacy@turkiyeresmihaber.com</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Posta Adresi</h4>
                    <p className="text-gray-700">[Posta adresi eklenecek]</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                  <p className="text-sm text-warning-800">
                    <strong>Başvuru Süreci:</strong> Talebiniz 30 gün içinde değerlendirilecek 
                    ve size geri dönüş yapılacaktır. Kimlik doğrulama gerekebilir.
                  </p>
                </div>
              </div>
            </section>

            {/* 8. Değişiklikler */}
            <section id="degisiklikler" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-primary-600" />
                8. Politika Değişiklikleri
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Bu gizlilik politikası, yasal düzenlemeler ve hizmet değişiklikleri 
                doğrultusunda güncellenebilir. Önemli değişiklikler hakkında sizi 
                bilgilendireceğiz.
              </p>
              <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                <h4 className="font-semibold text-info-900 mb-2">Son Güncellemeler:</h4>
                <ul className="text-sm text-info-800 space-y-1">
                  <li>• {new Date().toLocaleDateString('tr-TR')} - İlk versiyon yayınlandı</li>
                  <li>• Gelecek güncellemeler burada listelenecek</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPage 