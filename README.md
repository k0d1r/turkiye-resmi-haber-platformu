# 🇹🇷 Türkiye Resmi Haber Platformu

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)

> **Modern, güvenli ve hukuka uygun Türkiye resmi kurumları haber toplama ve duyuru platformu**

## 📋 İçindekiler

- [🎯 Proje Hakkında](#-proje-hakkında)
- [✨ Özellikler](#-özellikler)
- [🛠️ Teknoloji Stack](#️-teknoloji-stack)
- [📊 Mimari](#-mimari)
- [🚀 Hızlı Başlangıç](#-hızlı-başlangıç)
- [⚙️ Kurulum](#️-kurulum)
- [🔧 Yapılandırma](#-yapılandırma)
- [📱 Kullanım](#-kullanım)
- [🔌 API Dokümantasyonu](#-api-dokümantasyonu)
- [⚖️ Hukuki Uyumluluk](#️-hukuki-uyumluluk)
- [🛡️ Güvenlik](#️-güvenlik)
- [📸 Ekran Görüntüleri](#-ekran-görüntüleri)
- [🤝 Katkıda Bulunma](#-katkıda-bulunma)
- [📄 Lisans](#-lisans)

## 🎯 Proje Hakkında

**Türkiye Resmi Haber Platformu**, Türkiye'deki resmi kurumların duyuru ve haberlerini tek bir noktadan takip edilebilir hale getiren modern web platformudur. Platform, hukuka uygun veri toplama yöntemleri kullanarak TCMB, SPK, EPDK, Resmi Gazete ve diğer resmi kurumlardan otomatik olarak güncel bilgileri toplar.

### 🎯 Misyon
- Türkiye'deki resmi kurumların duyurularına kolay erişim sağlamak
- Hukuka uygun ve etik veri toplama prensipleriyle çalışmak
- Modern web teknolojileriyle güvenli ve hızlı hizmet sunmak
- Vatandaşların resmi bilgilere ulaşmasını kolaylaştırmak

### 👥 Hedef Kitle
- Finansal piyasa takipçileri
- Hukuk ve düzenleme uzmanları
- Gazeteciler ve medya çalışanları
- Kamu yönetimi araştırmacıları
- Genel vatandaşlar

## ✨ Özellikler

### 📰 İçerik Yönetimi
- **RSS Beslemeleri**: Resmi kurumların public RSS feedlerinden otomatik veri çekme
- **Kontrollü Web Scraping**: robots.txt uyumlu, hukuka uygun scraping
- **İçerik Kategorilendirme**: Finansal, yasal, enerji, teknoloji kategorileri
- **Arama ve Filtreleme**: Kaynak, kategori, tarih bazlı gelişmiş arama
- **Real-time Updates**: Anlık güncelleme ve bildirim sistemi

### 🏛️ Kaynak Yönetimi
- **8 Resmi Kurum**: TCMB, SPK, EPDK, Resmi Gazete, BDDK, TÜBİTAK, Meteoroloji, TÜİK
- **Kaynak Durumu Takibi**: Aktif/pasif kaynak monitoring
- **Güvenilirlik Kontrolü**: Kaynak doğrulama ve güvenilirlik puanlama
- **Kaynak İstatistikleri**: Her kaynak için detaylı performans metrikleri

### 💰 Finansal Veriler
- **Döviz Kurları**: TCMB güncel döviz kurları (8 para birimi)
- **Altın Fiyatları**: Güncel gram, çeyrek, yarım, tam altın fiyatları
- **Finansal Dashboard**: Grafikli veri görselleştirme
- **Trend Analizi**: Değişim oranları ve trend takibi

### 👤 Kullanıcı Yönetimi
- **JWT Authentication**: Güvenli kimlik doğrulama
- **Role-based Access**: Admin ve kullanıcı rol yönetimi
- **Kullanıcı Profilleri**: Kişiselleştirilebilir kullanıcı deneyimi
- **Favoriler**: Makale favorileme sistemi

### ⚙️ Admin Paneli
- **Dashboard**: Sistem genel durumu ve istatistikleri
- **Kullanıcı Yönetimi**: Kullanıcı CRUD işlemleri
- **İçerik Yönetimi**: Makale ve kaynak yönetimi
- **Sistem Sağlığı**: Real-time sistem monitoring

### 🔔 Bildirim Sistemi
- **E-posta Bildirimleri**: Seçili konularda otomatik bildirim
- **Push Notifications**: PWA destekli anlık bildirimler
- **Özelleştirilebilir Abonelikler**: Kullanıcı tercihleri bazlı bildirim

### 📱 Progressive Web App (PWA)
- **Offline Çalışma**: Service worker ile offline destek
- **Mobil Optimize**: Responsive ve mobil-first tasarım
- **App-like Experience**: Native app deneyimi
- **Push Support**: Browser push notification desteği

## 🛠️ Teknoloji Stack

### Frontend
```
React 18.x          - Modern UI framework
TypeScript 5.x      - Type-safe development
Vite 4.x           - Fast build tool
Tailwind CSS 3.x   - Utility-first CSS framework
React Query        - Server state management
React Router 6.x   - Client-side routing
Framer Motion      - Smooth animations
Chart.js           - Data visualization
Lucide React       - Modern icon library
React Hook Form    - Form management
Zustand            - Lightweight state management
```

### Backend
```
Node.js 18.x       - JavaScript runtime
Express 4.x        - Web framework
TypeScript 5.x     - Type-safe backend
SQLite 3.x         - Lightweight database
JWT               - Authentication tokens
Helmet            - Security middleware
Rate Limiting     - API protection
CORS              - Cross-origin requests
Nodemailer        - Email service
RSS Parser        - Feed processing
Cheerio           - Web scraping
Cron              - Scheduled tasks
```

### DevOps & Tools
```
Vite              - Development server
ESLint            - Code linting
Prettier          - Code formatting
Husky             - Git hooks
Jest              - Unit testing
GitHub Actions    - CI/CD pipeline
Docker            - Containerization
PM2               - Process management
```

## 📊 Mimari

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React)       │◄──►│   (Express)     │◄──►│   Sources       │
│                 │    │                 │    │                 │
│ • React 18      │    │ • Node.js       │    │ • TCMB RSS      │
│ • TypeScript    │    │ • Express       │    │ • SPK Website   │
│ • Tailwind CSS  │    │ • SQLite        │    │ • EPDK API      │
│ • React Query   │    │ • JWT Auth      │    │ • Resmi Gazete  │
│ • PWA Support   │    │ • Cron Jobs     │    │ • BDDK RSS      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Veri Akışı
1. **RSS Feeds** → Otomatik güncellemeler (her 15 dakika)
2. **Web Scraping** → Kontrollü toplama (günlük)
3. **Data Processing** → İçerik analizi ve kategorilendirme
4. **Database Storage** → SQLite veri depolama
5. **API Serving** → RESTful API endpoints
6. **Frontend Display** → React component rendering
7. **User Interaction** → Real-time updates

## 🚀 Hızlı Başlangıç

### Ön Gereksinimler
- Node.js 18.x veya üzeri
- npm 9.x veya yarn
- Git

### 1-Dakika Kurulum
```bash
# Repository'yi klonlayın
git clone https://github.com/kullaniciadi/turkiye-resmi-haber-platformu.git
cd turkiye-resmi-haber-platformu

# Gerekli paketleri yükleyin
npm run install:all

# Geliştirme ortamını başlatın
npm run dev
```

🎉 **Hazır!** Platform `http://localhost:3000` adresinde çalışıyor.

## ⚙️ Kurulum

### Detaylı Kurulum

#### 1. Repository Klonlama
```bash
git clone https://github.com/kullaniciadi/turkiye-resmi-haber-platformu.git
cd turkiye-resmi-haber-platformu
```

#### 2. Backend Kurulumu
```bash
cd server
npm install

# Environment dosyası oluşturun
cp .env.example .env

# Veritabanını başlatın
npm run db:init

# Development server'ı başlatın
npm run dev
```

#### 3. Frontend Kurulumu
```bash
cd ../client
npm install

# Environment dosyası oluşturun
cp .env.example .env

# Development server'ı başlatın
npm run dev
```

#### 4. Otomatik Kurulum (Önerilen)
```bash
# Tüm bağımlılıkları yükler
npm run install:all

# Hem frontend hem backend'i başlatır
npm run dev
```

## 🔧 Yapılandırma

### Environment Variables

#### Backend (.env)
```bash
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
DATABASE_URL=./data/app.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OpenAI API (İçerik özeti için)
OPENAI_API_KEY=your-openai-api-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# RSS Update Intervals (minutes)
RSS_UPDATE_INTERVAL=15
SCRAPING_UPDATE_INTERVAL=60
```

#### Frontend (.env)
```bash
# API Configuration
VITE_API_URL=http://localhost:5001/api

# App Configuration
VITE_APP_NAME=Türkiye Resmi Haber Platformu
VITE_APP_VERSION=2.0.0

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_NOTIFICATIONS=true

# External Services
VITE_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
```

### Package.json Scripts

#### Root Scripts
```bash
npm run install:all      # Tüm dependencies'leri yükle
npm run dev             # Frontend + Backend paralel başlat
npm run build           # Production build
npm run test            # Tüm testleri çalıştır
npm run lint            # Code linting
npm run format          # Code formatting
```

#### Backend Scripts
```bash
npm run dev             # Development server
npm run build           # TypeScript build
npm run start           # Production server
npm run test            # Backend tests
npm run db:init         # Database initialization
npm run db:migrate      # Database migration
npm run db:seed         # Test data seeding
```

#### Frontend Scripts
```bash
npm run dev             # Development server
npm run build           # Production build
npm run preview         # Preview production build
npm run test            # Frontend tests
npm run lint            # ESLint check
npm run type-check      # TypeScript check
```

## 📱 Kullanım

### 🌐 Ana Kullanım Senaryoları

#### 1. Genel Kullanıcı
```bash
# Ana sayfa ziyaret
http://localhost:3000

# Son duyuruları görüntüleme
/articles → Son duyurular listesi

# Kaynak bazlı filtreleme
/sources → TCMB, SPK, EPDK vb. kaynaklar

# Finansal verileri takip
/financial → Döviz kurları ve altın fiyatları
```

#### 2. Admin Kullanıcı
```bash
# Admin girişi
/login → admin@turkiyehaber.gov.tr / admin123

# Dashboard erişimi
/admin → Sistem genel durumu

# Kullanıcı yönetimi
/admin/users → Kullanıcı CRUD işlemleri

# İçerik yönetimi
/admin/articles → Makale moderasyonu
```

### 🔍 Arama ve Filtreleme

#### Gelişmiş Arama
- **Metin Arama**: Başlık ve içerik araması
- **Kaynak Filtresi**: Belirli kurumların duyuruları
- **Kategori Filtresi**: Finansal, yasal, enerji vb.
- **Tarih Aralığı**: Belirli dönem filtreleme
- **Etiket Bazlı**: Tag-based filtering

#### Örnek Arama Sorguları
```bash
# TCMB faiz kararları
GET /api/articles?sourceId=1&query=faiz

# Son 7 günün finansal duyuruları
GET /api/articles?category=financial&dateFrom=2024-01-15

# SPK düzenlemeleri
GET /api/articles?sourceId=2&category=regulation
```

### 📊 Dashboard Kullanımı

#### Sistem Metrikleri
- **Toplam Makale**: Platform geneli makale sayısı
- **Aktif Kaynaklar**: Çalışan RSS/scraping kaynakları
- **Günlük Görüntüleme**: Traffic metrikleri
- **Kullanıcı Aktivitesi**: Engagement istatistikleri

#### Real-time Monitoring
- **RSS Feed Status**: Kaynak durumu anlık takip
- **Scraping Health**: Web scraping başarı oranları
- **API Performance**: Endpoint yanıt süreleri
- **Error Logs**: Sistem hata kayıtları

## 🔌 API Dokümantasyonu

### Base URL
```
Production: https://api.turkiyeresmihaber.com
Development: http://localhost:5001
```

### Authentication
```bash
# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Response
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

### Articles Endpoints

#### Tüm Makaleleri Listele
```bash
GET /api/articles?page=1&limit=20&category=financial&sourceId=1

# Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "TCMB Faiz Kararı",
      "description": "Merkez bankası politika faizi açıklaması",
      "content": "Detaylı makale içeriği...",
      "source": "TCMB",
      "sourceId": 1,
      "category": "financial",
      "publishedDate": "2024-01-20T10:00:00Z",
      "tags": ["TCMB", "Faiz", "Para Politikası"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### Son Duyurular
```bash
GET /api/articles/latest?limit=10

# Response
{
  "success": true,
  "data": [
    // Son 10 makale
  ]
}
```

### Sources Endpoints

#### Kaynakları Listele
```bash
GET /api/sources

# Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "TCMB - Türkiye Cumhuriyet Merkez Bankası",
      "description": "Merkez bankası para politikası kararları",
      "category": "rss",
      "status": "active",
      "url": "https://tcmb.gov.tr",
      "rssUrl": "https://tcmb.gov.tr/rss/duyuru.xml",
      "articleCount": 15,
      "lastFetched": "2024-01-20T09:30:00Z"
    }
  ]
}
```

### Financial Endpoints

#### Döviz Kurları
```bash
GET /api/financial/exchange-rates

# Response
{
  "success": true,
  "data": {
    "rates": [
      {
        "currency": "USD",
        "buying": 34.15,
        "selling": 34.25,
        "change": 0.08,
        "changePercent": 0.23
      }
    ],
    "lastUpdate": "2024-01-20T10:00:00Z",
    "source": "TCMB"
  }
}
```

#### Altın Fiyatları
```bash
GET /api/financial/gold-prices

# Response
{
  "success": true,
  "data": {
    "prices": [
      {
        "type": "Gram Altın",
        "buying": 2845.50,
        "selling": 2847.20,
        "change": 12.30,
        "changePercent": 0.43
      }
    ],
    "lastUpdate": "2024-01-20T10:00:00Z",
    "source": "Kapalıçarşı"
  }
}
```

### Admin Endpoints

#### Dashboard İstatistikleri
```bash
GET /api/admin/dashboard
Authorization: Bearer <jwt-token>

# Response
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 1247,
      "totalArticles": 3580,
      "totalSources": 12,
      "dailyViews": 15420
    },
    "recentActivities": [
      {
        "id": 1,
        "type": "article",
        "action": "Yeni makale eklendi",
        "details": "TCMB Politika Faizi",
        "time": "5 dakika önce"
      }
    ],
    "systemHealth": {
      "rssFeeds": "healthy",
      "scraping": "warning",
      "database": "healthy",
      "api": "healthy"
    }
  }
}
```

### Error Responses
```bash
# 400 Bad Request
{
  "success": false,
  "message": "Geçersiz parametreler",
  "errors": {
    "email": "Geçerli email adresi gerekli"
  }
}

# 401 Unauthorized
{
  "success": false,
  "message": "Kimlik doğrulama gerekli"
}

# 403 Forbidden
{
  "success": false,
  "message": "Bu işlem için yetkiniz yok"
}

# 404 Not Found
{
  "success": false,
  "message": "Kaynak bulunamadı"
}

# 429 Too Many Requests
{
  "success": false,
  "message": "Çok fazla istek. Lütfen bekleyin."
}

# 500 Internal Server Error
{
  "success": false,
  "message": "Sunucu hatası"
}
```

## ⚖️ Hukuki Uyumluluk

### 📋 Legal Compliance Analizi

Bu platform, Türkiye Cumhuriyeti mevzuatına tam uyum sağlayacak şekilde tasarlanmıştır:

#### 🔒 KVKK (Kişisel Verilerin Korunması Kanunu) Uyumu
- **Minimal Veri Toplama**: Sadece gerekli kullanıcı bilgileri
- **Açık Rıza**: Kullanıcı onayı ile veri işleme
- **Veri Güvenliği**: Şifreleme ve güvenli saklama
- **Silme Hakkı**: Kullanıcı veri silme talepleri
- **Bilgilendirme**: Veri işleme süreçleri hakkında şeffaflık

#### 📚 Telif Hakları Koruması
- **Kaynak Gösterme**: Her içerik için orijinal kaynak linki
- **Fair Use**: Eğitim ve bilgilendirme amaçlı kullanım
- **Özet İçerik**: Tam kopyalama yerine özet bilgi
- **DMCA Compliance**: Telif ihlali bildirimleri için prosedür

#### 🌐 Web Scraping Etiği
- **robots.txt Uyumu**: Robot exclusion protocol'e uygun davranış
- **Rate Limiting**: Kaynak sistemlere aşırı yük bindirilmemesi
- **Kamu Bilgisi**: Sadece public bilgilerin toplanması
- **Teknik Sınırlar**: Belirli zaman aralıkları ve makul limitler

#### 🏛️ Resmi Kurum Politikaları
- **Public RSS Feeds**: Sadece public RSS beslemelerinin kullanımı
- **Resmi API'ler**: Mevcut olan resmi API'lerin tercih edilmesi
- **Güncelleme Politikası**: Kurumların güncelleme taleplerine uyum

### 🛡️ Güvenlik Protokolleri

#### 🔐 Veri Güvenliği
- **Şifreleme**: Tüm hassas verilerin AES-256 şifrelenmesi
- **HTTPS**: SSL/TLS ile güvenli veri iletimi
- **JWT Tokens**: Güvenli authentication token'ları
- **Input Validation**: SQL injection ve XSS koruması
- **Rate Limiting**: DDoS ve brute force koruması

#### 🏥 Backup ve Recovery
- **Otomatik Yedekleme**: Günlük veritabanı yedeklemeleri
- **Versiyon Kontrolü**: Git-based code versioning
- **Disaster Recovery**: Acil durum planları
- **Monitoring**: 7/24 sistem izleme

#### 📊 Privacy by Design
- **Veri Minimizasyonu**: Gereksiz veri toplanmıyor
- **Anonimization**: Kişisel verilerin anonimleştirilmesi
- **Şeffaflık**: Açık veri işleme politikaları
- **Kullanıcı Kontrolü**: Veri üzerinde tam kullanıcı kontrolü

### 📄 Yasal Belgeler

#### Kullanım Şartları
- Platform kullanım kuralları
- Sorumluluk sınırları
- İçerik politikaları
- Yasal uyumluluk gereksinimleri

#### Gizlilik Politikası
- Hangi verilerin toplandığı
- Verilerin nasıl kullanıldığı
- Üçüncü taraf paylaşımları
- Kullanıcı hakları

#### Çerez Politikası
- Çerez kullanım amaçları
- Çerez türleri
- Kullanıcı tercihleri
- Çerez yönetimi

## 🛡️ Güvenlik

### Güvenlik Katmanları

#### 1. Application Security
```javascript
// Helmet.js - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

#### 2. Authentication & Authorization
```javascript
// JWT verification
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token gerekli' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Geçersiz token' });
  }
};

// Role-based access control
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin yetkisi gerekli' });
  }
  next();
};
```

#### 3. Input Validation
```javascript
// Express validator
const { body, validationResult } = require('express-validator');

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli email gerekli'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalı'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
```

#### 4. Database Security
```javascript
// Parameterized queries (SQLite)
const getUserByEmail = (email) => {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
};

// Password hashing
const bcrypt = require('bcrypt');
const saltRounds = 12;

const hashPassword = async (password) => {
  return await bcrypt.hash(password, saltRounds);
};
```

### Security Best Practices

#### Environment Security
```bash
# .env güvenliği
NODE_ENV=production
JWT_SECRET=complex-random-string-min-32-chars
DATABASE_URL=encrypted-connection-string

# File permissions
chmod 600 .env
chmod 600 private-keys/*
```

#### HTTPS Configuration
```javascript
// Production HTTPS redirect
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## 📸 Ekran Görüntüleri

### 🏠 Ana Sayfa
![Ana Sayfa](./docs/screenshots/homepage.png)
*Modern, responsive ana sayfa tasarımı*

### 📰 Makaleler Sayfası
![Makaleler](./docs/screenshots/articles.png)
*Gelişmiş arama ve filtreleme özellikleri*

### 🏛️ Kaynaklar Sayfası
![Kaynaklar](./docs/screenshots/sources.png)
*Resmi kurumlar ve kaynak durumu takibi*

### 💰 Finansal Veriler
![Finansal](./docs/screenshots/financial.png)
*Döviz kurları ve altın fiyatları dashboard'u*

### ⚙️ Admin Paneli
![Admin Dashboard](./docs/screenshots/admin-dashboard.png)
*Kapsamlı admin yönetim paneli*

### 📱 Mobil Görünüm
![Mobil](./docs/screenshots/mobile.png)
*Responsive mobil tasarım*

## 🧪 Testing

### Test Stratejisi
```bash
# Unit Tests
npm run test:unit

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e

# Test Coverage
npm run test:coverage
```

### Test Örnekleri

#### Backend API Tests
```javascript
// articles.test.js
describe('Articles API', () => {
  test('GET /api/articles returns articles list', async () => {
    const response = await request(app)
      .get('/api/articles')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });
  
  test('GET /api/articles with filters', async () => {
    const response = await request(app)
      .get('/api/articles?category=financial&limit=5')
      .expect(200);
    
    expect(response.body.data.length).toBeLessThanOrEqual(5);
  });
});
```

#### Frontend Component Tests
```javascript
// HomePage.test.tsx
import { render, screen } from '@testing-library/react';
import HomePage from '../pages/HomePage';

test('renders homepage with latest articles', () => {
  render(<HomePage />);
  expect(screen.getByText('Son Duyurular')).toBeInTheDocument();
});
```

### Continuous Integration
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Check code coverage
        run: npm run test:coverage
```

## 🚀 Deployment

### Production Deployment

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 5001
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=/data/app.db
    volumes:
      - app_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  app_data:
```

#### Cloud Deployment (Vercel + Railway)
```bash
# Frontend (Vercel)
npm i -g vercel
vercel --prod

# Backend (Railway)
npm i -g @railway/cli
railway login
railway deploy
```

### Environment Configuration

#### Production Environment
```bash
# Production .env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=production-secret-key
REDIS_URL=redis://user:pass@host:6379

# SSL Configuration
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key
```

#### Scaling Configuration
```javascript
// cluster.js - Multi-process setup
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  require('./server');
  console.log(`Worker ${process.pid} started`);
}
```

## 📊 Monitoring & Analytics

### Performance Monitoring
```javascript
// Performance metrics
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
```

### Health Checks
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    checks: {
      database: checkDatabase(),
      rssFeeds: checkRSSFeeds(),
      externalAPIs: checkExternalAPIs()
    }
  };
  
  res.status(200).json(healthCheck);
});
```

### Logging
```javascript
// Winston logging setup
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## 🤝 Katkıda Bulunma

### Contribution Guidelines

#### 1. Development Setup
```bash
# Fork repository
git clone https://github.com/YOUR-USERNAME/turkiye-resmi-haber-platformu.git
cd turkiye-resmi-haber-platformu

# Create feature branch
git checkout -b feature/amazing-feature

# Install dependencies
npm run install:all

# Start development
npm run dev
```

#### 2. Code Standards
```bash
# Code formatting
npm run format

# Linting
npm run lint

# Type checking
npm run type-check

# Tests
npm run test
```

#### 3. Commit Guidelines
```bash
# Conventional commits
git commit -m "feat: add user notification system"
git commit -m "fix: resolve RSS parsing issue"
git commit -m "docs: update API documentation"
git commit -m "test: add integration tests for auth"
```

#### 4. Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Update documentation
5. Submit pull request
6. Code review process
7. Merge after approval

### Code Style Guidelines

#### TypeScript/JavaScript
```javascript
// Good practices
const fetchArticles = async (params: ArticleParams): Promise<Article[]> => {
  try {
    const response = await api.get('/articles', { params });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch articles:', error);
    throw new Error('Article fetch failed');
  }
};

// Use TypeScript interfaces
interface ArticleParams {
  page?: number;
  limit?: number;
  category?: string;
  sourceId?: number;
}
```

#### React Components
```tsx
// Functional components with TypeScript
interface Props {
  articles: Article[];
  onArticleClick: (id: number) => void;
}

const ArticleList: React.FC<Props> = ({ articles, onArticleClick }) => {
  return (
    <div className="article-list">
      {articles.map(article => (
        <ArticleCard
          key={article.id}
          article={article}
          onClick={() => onArticleClick(article.id)}
        />
      ))}
    </div>
  );
};
```

### Issue Templates

#### Bug Report
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. iOS]
 - Browser [e.g. chrome, safari]
 - Version [e.g. 22]
```

#### Feature Request
```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## 📈 Roadmap

### Q1 2024
- [ ] **Advanced Analytics Dashboard**
  - User behavior tracking
  - Content performance metrics
  - Real-time statistics

- [ ] **Mobile Application**
  - React Native mobile app
  - Push notifications
  - Offline reading capability

- [ ] **AI-Powered Features**
  - Content summarization
  - Sentiment analysis
  - Trend prediction

### Q2 2024
- [ ] **Multi-language Support**
  - English language option
  - Arabic language support
  - Automatic translation

- [ ] **Advanced Search**
  - Elasticsearch integration
  - Full-text search
  - Semantic search capabilities

- [ ] **API Enhancements**
  - GraphQL API
  - Webhook support
  - Rate limiting improvements

### Q3 2024
- [ ] **Enterprise Features**
  - White-label solutions
  - API access tiers
  - Custom integrations

- [ ] **Performance Optimizations**
  - CDN integration
  - Caching improvements
  - Database optimization

### Q4 2025
- [ ] **Advanced Monitoring**
  - APM integration
  - Error tracking
  - Performance metrics

- [ ] **Compliance Enhancements**
  - GDPR compliance
  - Accessibility improvements
  - Security auditing

## 📞 İletişim

### Geliştirici İletişim
- **Email**: k0d1rtalhaak@gmail.com
- **GitHub**: [Proje Repository](https://github.com/k0d1r/turkiye-resmi-haber-platformu)

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

```
MIT License

Copyright (c) 2025 Türkiye Resmi Haber Platformu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Teşekkürler

Bu proje aşağıdaki açık kaynak projelerden ilham almıştır:

- [React](https://reactjs.org/) - UI Framework
- [Express.js](https://expressjs.com/) - Backend Framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [TypeScript](https://www.typescriptlang.org/) - Type Safety

### Özel Teşekkürler

- Türkiye'nin resmi kurumlarına public RSS feed'leri sağladıkları için
- Açık kaynak topluluğuna katkıları için
- Beta test kullanıcılarına geri bildirimleri için

---

<div align="center">

**⭐ Bu projeyi beğendiyseniz GitHub'da yıldız vermeyi unutmayın!**

Made with ❤️ for Turkey 🇹🇷

</div> 