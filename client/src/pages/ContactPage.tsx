import { useState } from 'react'
import { 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Phone,
  MapPin,
  Clock,
  FileText,
  User,
  Building2
} from 'lucide-react'

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const contactTypes = [
    { value: 'general', label: 'Genel Soru' },
    { value: 'privacy', label: 'Gizlilik ve KVKK' },
    { value: 'technical', label: 'Teknik Sorun' },
    { value: 'content', label: 'İçerik Sorunu' },
    { value: 'partnership', label: 'İş Birliği' },
    { value: 'legal', label: 'Yasal Konular' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
      })
    }, 2000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-primary-600" />
            İletişim
          </h1>
          <p className="text-lg text-gray-600">
            Sorularınız, önerileriniz veya geri bildirimleriniz için bizimle iletişime geçin.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-soft border border-gray-200">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">İletişim Formu</h2>
              </div>
              <div className="card-body">
                {submitStatus === 'success' && (
                  <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-success-600 mr-2" />
                      <span className="text-success-800 font-medium">
                        Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.
                      </span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="form-label">Ad Soyad *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                        placeholder="Adınız ve soyadınız"
                      />
                    </div>
                    <div>
                      <label className="form-label">E-posta *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Konu Türü</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      {contactTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Konu *</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                      placeholder="Mesajınızın konusu"
                    />
                  </div>

                  <div>
                    <label className="form-label">Mesajınız *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="form-input"
                      placeholder="Detaylı mesajınızı buraya yazabilirsiniz..."
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      * işaretli alanlar zorunludur. Mesajınıza 24-48 saat içinde yanıt vermeye çalışıyoruz.
                      Kişisel verileriniz <a href="/privacy" className="link">gizlilik politikamız</a> 
                      kapsamında korunmaktadır.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary btn-lg w-full flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Mesajı Gönder
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <div className="bg-white rounded-lg shadow-soft border border-gray-200">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Hızlı İletişim</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">E-posta</h4>
                    <p className="text-sm text-gray-600">iletisim@turkiyeresmihaber.com</p>
                    <p className="text-xs text-gray-500 mt-1">Genel sorular için</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">KVKK ve Gizlilik</h4>
                    <p className="text-sm text-gray-600">privacy@turkiyeresmihaber.com</p>
                    <p className="text-xs text-gray-500 mt-1">Kişisel veri talebleri için</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Building2 className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Kurumsal</h4>
                    <p className="text-sm text-gray-600">kurumsal@turkiyeresmihaber.com</p>
                    <p className="text-xs text-gray-500 mt-1">İş birliği ve ortaklık için</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Times */}
            <div className="bg-white rounded-lg shadow-soft border border-gray-200">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-primary-600" />
                  Yanıt Süreleri
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Genel Sorular</span>
                    <span className="text-sm font-medium text-primary-600">24-48 saat</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Teknik Sorunlar</span>
                    <span className="text-sm font-medium text-primary-600">4-8 saat</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">KVKK Talepleri</span>
                    <span className="text-sm font-medium text-primary-600">En fazla 30 gün</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Acil Durumlar</span>
                    <span className="text-sm font-medium text-primary-600">2-4 saat</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="font-semibold text-primary-900 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Sık Sorulan Sorular
              </h4>
              <p className="text-sm text-primary-800 mb-3">
                Sorunu yazmadan önce sık sorulan sorularımıza göz atabilirsiniz.
              </p>
              <a href="/faq" className="btn btn-outline btn-sm text-primary-600 border-primary-200 hover:bg-primary-100">
                SSS'yi Görüntüle
              </a>
            </div>

            {/* Legal Notice */}
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <h4 className="font-semibold text-warning-900 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Önemli Not
              </h4>
              <p className="text-sm text-warning-800">
                Bu platform sadece bilgi paylaşım amaçlıdır. Resmi işlemler için 
                ilgili kurumların resmi web sitelerini ziyaret ediniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage 