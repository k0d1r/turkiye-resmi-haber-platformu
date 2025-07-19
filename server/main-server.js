const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock Database - Daha detaylı ve gerçekçi veriler
const mockData = {
  // Detaylı makaleler - 300+ karakter içerikler
  articles: [
    {
      id: 1,
      title: "TCMB Politika Faizi %50'de Sabit Tutuldu",
      description: "Merkez Bankası Para Politikası Kurulu, enflasyonla mücadele kapsamında politika faizini %50 seviyesinde tutma kararı aldı.",
      content: "Türkiye Cumhuriyet Merkez Bankası (TCMB) Para Politikası Kurulu (PPK), politika faizi olan bir hafta vadeli repo ihale faiz oranını yüzde 50'de sabit tutma kararı almıştır. PPK toplantısında alınan kararda, enflasyonun ana eğilimindeki iyileşmenin sürdürülmesi ve enflasyon beklentilerinin çıpalanması için sıkı para politikası duruşunun korunmasının uygun görüldüğü belirtilmiştir. Merkez Bankası, enflasyonda kalıcı düşüş sağlanana kadar mevcut politika duruşunu sürdüreceğini açıklamıştır.",
      source: "TCMB",
      sourceId: 1,
      url: "https://tcmb.gov.tr/wps/wcm/connect/tr/tcmb+tr/main+menu/duyurular",
      publishedDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 saat önce
      category: "financial",
      tags: ["TCMB", "Faiz", "Para Politikası", "Enflasyon"]
    },
    {
      id: 2,
      title: "SPK'dan Yapay Zeka Destekli Denetim Sistemi",
      description: "Sermaye Piyasası Kurulu, piyasa manipülasyonlarını önlemek için yapay zeka destekli yeni denetim sistemi kurduğunu açıkladı.",
      content: "Sermaye Piyasası Kurulu (SPK), sermaye piyasalarında manipülasyon ve insider trading vakalarını tespit etmek amacıyla geliştirilen yapay zeka destekli denetim sisteminin devreye alındığını duyurdu. Sistem, anormal işlem akışlarını gerçek zamanlı olarak analiz edebiliyor ve şüpheli aktiviteleri otomatik olarak raporluyor. SPK Başkanı yaptığı açıklamada, bu sistemin piyasa güvenilirliğini artıracağını ve yatırımcı korumasını güçlendireceğini belirtti. Yeni sistem ayrıca makine öğrenmesi algoritmalarıyla kendini sürekli geliştiriyor.",
      source: "SPK",
      sourceId: 2,
      url: "https://spk.gov.tr/Sayfa/Dosya/1504",
      publishedDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 saat önce
      category: "regulation",
      tags: ["SPK", "Yapay Zeka", "Denetim", "Sermaye Piyasası", "Teknoloji"]
    },
    {
      id: 3,
      title: "EPDK Elektrik Tarifelerinde Düzenleme",
      description: "Enerji Piyasası Düzenleme Kurumu, elektrik dağıtım tarifelerinde yeni düzenlemeler yapıldığını ve tüketici lehine değişiklikler getirdiğini açıkladı.",
      content: "Enerji Piyasası Düzenleme Kurumu (EPDK), elektrik dağıtım tarifelerinde önemli düzenlemeler yaptığını açıkladı. Yeni düzenleme kapsamında, konut tüketicileri için kademeli tarife yapısı iyileştirildi ve düşük tüketim seviyelerindeki vatandaşlar için daha uygun fiyatlandırma getirildi. EPDK Başkanı, bu düzenlemenin özellikle dar gelirli aileleri desteklemeyi amaçladığını ve enerji verimliliğini teşvik edeceğini belirtti. Ayrıca, yenilenebilir enerji kullanımını artıran tüketiciler için özel indirimler de devreye alındı.",
      source: "EPDK",
      sourceId: 3,
      url: "https://epdk.gov.tr/Detay/Icerik/3-0-23-2/duyurular",
      publishedDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 saat önce
      category: "energy",
      tags: ["EPDK", "Elektrik", "Tarife", "Düzenleme", "Enerji"]
    },
    {
      id: 4,
      title: "Resmi Gazete'de Yeni Vergi Düzenlemesi",
      description: "KDV ve kurumlar vergisinde önemli değişiklikler içeren yeni düzenleme Resmi Gazete'de yayımlandı.",
      content: "Gelir İdaresi Başkanlığı tarafından hazırlanan ve Resmi Gazete'de yayımlanan yeni vergi düzenlemesi, KDV ve kurumlar vergisinde önemli değişiklikler getiriyor. Düzenleme kapsamında, küçük ve orta ölçekli işletmeler (KOBİ) için vergi oranlarında indirimler yapılırken, dijital hizmet vergisi kapsamı genişletildi. Ayrıca, e-fatura ve e-defter uygulamalarına geçen işletmeler için teşvik paketi devreye alındı. Maliye Bakanı, bu düzenlemelerin ekonomik büyümeyi destekleyeceğini ve vergi adaletini güçlendireceğini açıkladı.",
      source: "Resmi Gazete",
      sourceId: 4,
      url: "https://resmigazete.gov.tr",
      publishedDate: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 saat önce
      category: "legal",
      tags: ["Vergi", "KDV", "Kurumlar Vergisi", "Resmi Gazete", "Düzenleme"]
    },
    {
      id: 5,
      title: "BDDK'dan Bankalara Kredi Düzenlemesi",
      description: "Bankacılık Düzenleme ve Denetleme Kurumu, konut kredilerinde yeni düzenlemeler yaparak tüketici korumasını güçlendirdi.",
      content: "Bankacılık Düzenleme ve Denetleme Kurumu (BDDK), konut kredilerinde tüketici haklarını korumaya yönelik yeni düzenlemeler yayımladı. Düzenleme kapsamında, kredi faiz oranlarının değişken olması durumunda bankaların müşterilerini önceden bilgilendirme yükümlülüğü getirildi. Ayrıca, erken ödeme cezalarında üst limit belirlendi ve kredi dosya masraflarında standardizasyon sağlandı. BDDK Başkanı, bu düzenlemelerin finansal tüketici haklarını güçlendireceğini ve bankacılık sektöründe şeffaflığı artıracağını belirtti.",
      source: "BDDK",
      sourceId: 5,
      url: "https://bddk.org.tr",
      publishedDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 saat önce
      category: "financial",
      tags: ["BDDK", "Kredi", "Konut Kredisi", "Bankacılık", "Tüketici Hakları"]
    },
    {
      id: 6,
      title: "TÜBİTAK'tan Yapay Zeka Ar-Ge Desteği",
      description: "TÜBİTAK, yerli yapay zeka teknolojilerinin geliştirilmesi için 500 milyon TL'lik destek paketi açıkladı.",
      content: "Türkiye Bilimsel ve Teknolojik Araştırma Kurumu (TÜBİTAK), ülkenin yapay zeka alanındaki teknolojik bağımsızlığını artırmak amacıyla 500 milyon TL'lik kapsamlı bir destek paketi başlattı. Program kapsamında, üniversiteler ve özel sektör işbirliğinde yapılacak Ar-Ge projelerine finansman sağlanacak. TÜBİTAK Başkanı, bu desteğin özellikle sağlık, eğitim, tarım ve savunma sanayi alanlarında yapay zeka uygulamalarının geliştirilmesini hızlandıracağını açıkladı. Başvurular gelecek ay başlayacak ve projeler 3 yıl süreyle desteklenecek.",
      source: "TÜBİTAK",
      sourceId: 6,
      url: "https://tubitak.gov.tr",
      publishedDate: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 saat önce
      category: "technology",
      tags: ["TÜBİTAK", "Yapay Zeka", "Ar-Ge", "Destek", "Teknoloji"]
    }
  ],

  // Genişletilmiş kaynak listesi
  sources: [
    {
      id: 1,
      name: "TCMB - Türkiye Cumhuriyet Merkez Bankası",
      description: "Merkez bankası para politikası kararları, enflasyon raporları ve ekonomik göstergeler",
      category: "rss",
      status: "active",
      url: "https://tcmb.gov.tr",
      rssUrl: "https://tcmb.gov.tr/rss/duyuru.xml",
      baseUrl: "https://tcmb.gov.tr",
      lastFetched: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 dk önce
      articleCount: 15,
      iconUrl: "https://tcmb.gov.tr/favicon.ico"
    },
    {
      id: 2,
      name: "SPK - Sermaye Piyasası Kurulu",
      description: "Sermaye piyasası düzenlemeleri, halka arz duyuruları ve yatırımcı koruması",
      category: "scraping",
      status: "active",
      url: "https://spk.gov.tr",
      baseUrl: "https://spk.gov.tr",
      lastFetched: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 dk önce
      articleCount: 12,
      iconUrl: "https://spk.gov.tr/favicon.ico"
    },
    {
      id: 3,
      name: "EPDK - Enerji Piyasası Düzenleme Kurumu",
      description: "Enerji sektörü düzenlemeleri, elektrik-doğalgaz tarifeleri ve yenilenebilir enerji",
      category: "scraping",
      status: "active",
      url: "https://epdk.gov.tr",
      baseUrl: "https://epdk.gov.tr",
      lastFetched: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 saat önce
      articleCount: 8,
      iconUrl: "https://epdk.gov.tr/favicon.ico"
    },
    {
      id: 4,
      name: "Resmi Gazete",
      description: "T.C. Resmi Gazete duyuruları, kanun ve yönetmelik değişiklikleri",
      category: "rss",
      status: "active",
      url: "https://resmigazete.gov.tr",
      rssUrl: "https://resmigazete.gov.tr/rss.aspx",
      baseUrl: "https://resmigazete.gov.tr",
      lastFetched: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 dk önce
      articleCount: 25,
      iconUrl: "https://resmigazete.gov.tr/favicon.ico"
    },
    {
      id: 5,
      name: "BDDK - Bankacılık Düzenleme ve Denetleme Kurumu",
      description: "Bankacılık sektörü düzenlemeleri, tüketici koruması ve finansal istikrar",
      category: "rss",
      status: "active",
      url: "https://bddk.org.tr",
      rssUrl: "https://bddk.org.tr/rss/duyuru.xml",
      baseUrl: "https://bddk.org.tr",
      lastFetched: new Date(Date.now() - 40 * 60 * 1000).toISOString(), // 40 dk önce
      articleCount: 10,
      iconUrl: "https://bddk.org.tr/favicon.ico"
    },
    {
      id: 6,
      name: "TÜBİTAK",
      description: "Bilim ve teknoloji politikaları, Ar-Ge destekleri ve akademik duyurular",
      category: "scraping",
      status: "active",
      url: "https://tubitak.gov.tr",
      baseUrl: "https://tubitak.gov.tr",
      lastFetched: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 saat önce
      articleCount: 7,
      iconUrl: "https://tubitak.gov.tr/favicon.ico"
    },
    {
      id: 7,
      name: "Meteoroloji Genel Müdürlüğü",
      description: "Hava durumu tahminleri, iklim değişikliği ve afet uyarıları",
      category: "rss",
      status: "active",
      url: "https://mgm.gov.tr",
      rssUrl: "https://mgm.gov.tr/rss/uyari.xml",
      baseUrl: "https://mgm.gov.tr",
      lastFetched: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 dk önce
      articleCount: 5,
      iconUrl: "https://mgm.gov.tr/favicon.ico"
    },
    {
      id: 8,
      name: "TÜİK - Türkiye İstatistik Kurumu",
      description: "Resmi istatistikler, nüfus sayımları ve ekonomik veriler",
      category: "rss",
      status: "active",
      url: "https://tuik.gov.tr",
      rssUrl: "https://tuik.gov.tr/rss/bultens.xml",
      baseUrl: "https://tuik.gov.tr",
      lastFetched: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 saat önce
      articleCount: 18,
      iconUrl: "https://tuik.gov.tr/favicon.ico"
    }
  ],

  // Gerçek zamanlı finansal veriler (gerçekçi değerler)
  financial: {
    exchangeRates: {
      rates: [
        {
          currency: "USD",
          buying: 34.15,
          selling: 34.25,
          change: 0.08,
          changePercent: 0.23
        },
        {
          currency: "EUR",
          buying: 36.82,
          selling: 36.92,
          change: -0.15,
          changePercent: -0.41
        },
        {
          currency: "GBP",
          buying: 43.21,
          selling: 43.31,
          change: 0.12,
          changePercent: 0.28
        },
        {
          currency: "CHF",
          buying: 37.45,
          selling: 37.55,
          change: 0.03,
          changePercent: 0.08
        },
        {
          currency: "JPY",
          buying: 0.2289,
          selling: 0.2295,
          change: 0.0005,
          changePercent: 0.22
        },
        {
          currency: "SEK",
          buying: 3.18,
          selling: 3.22,
          change: -0.02,
          changePercent: -0.62
        },
        {
          currency: "NOK",
          buying: 3.09,
          selling: 3.13,
          change: 0.01,
          changePercent: 0.32
        },
        {
          currency: "CAD",
          buying: 24.67,
          selling: 24.75,
          change: 0.05,
          changePercent: 0.20
        }
      ],
      lastUpdate: new Date().toISOString(),
      source: "TCMB"
    },
    goldPrices: {
      prices: [
        {
          type: "Gram Altın",
          buying: 2845.50,
          selling: 2847.20,
          change: 12.30,
          changePercent: 0.43
        },
        {
          type: "Çeyrek Altın",
          buying: 4698.75,
          selling: 4702.15,
          change: 20.45,
          changePercent: 0.44
        },
        {
          type: "Yarım Altın",
          buying: 9397.50,
          selling: 9404.30,
          change: 40.90,
          changePercent: 0.44
        },
        {
          type: "Tam Altın",
          buying: 18795.00,
          selling: 18808.60,
          change: 81.80,
          changePercent: 0.44
        },
        {
          type: "Gümüş (Gr)",
          buying: 36.85,
          selling: 37.15,
          change: 0.25,
          changePercent: 0.68
        }
      ],
      lastUpdate: new Date().toISOString(),
      source: "Kapalıçarşı"
    }
  },

  // Kullanıcılar
  users: [
    {
      id: 1,
      firstName: "Admin",
      lastName: "User",
      email: "admin@turkiyehaber.gov.tr",
      password: "admin123", // Gerçek uygulamada hash'lenmeli
      role: "admin",
      createdAt: "2024-01-01T00:00:00.000Z",
      isActive: true
    },
    {
      id: 2,
      firstName: "Test",
      lastName: "User",
      email: "user@test.com",
      password: "test123", // Gerçek uygulamada hash'lenmeli
      role: "user",
      createdAt: "2024-01-15T00:00:00.000Z",
      isActive: true
    }
  ]
};

// Helper Functions
const generateToken = (user) => {
  return `token_${user.id}_${Date.now()}`;
};

// Routes

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Articles API
app.get('/api/articles', (req, res) => {
  const { limit = 20, page = 1, sourceId, category, query } = req.query;
  let articles = [...mockData.articles];

  // Filtrele
  if (sourceId) {
    articles = articles.filter(article => article.sourceId == sourceId);
  }
  if (category) {
    articles = articles.filter(article => article.category === category);
  }
  if (query) {
    articles = articles.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Sayfalama
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedArticles = articles.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedArticles,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: articles.length,
      totalPages: Math.ceil(articles.length / limit)
    }
  });
});

app.get('/api/articles/latest', (req, res) => {
  const { limit = 10 } = req.query;
  const latestArticles = mockData.articles
    .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
    .slice(0, parseInt(limit));

  res.json({
    success: true,
    data: latestArticles
  });
});

app.get('/api/articles/trending', (req, res) => {
  const { limit = 10 } = req.query;
  // Trend kriterleri: son 24 saat içindeki makaleler
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const trendingArticles = mockData.articles
    .filter(article => new Date(article.publishedDate) > oneDayAgo)
    .slice(0, parseInt(limit));

  res.json({
    success: true,
    data: trendingArticles
  });
});

// Sources API
app.get('/api/sources', (req, res) => {
  res.json({
    success: true,
    data: mockData.sources
  });
});

// Financial API
app.get('/api/financial/exchange-rates', (req, res) => {
  res.json({
    success: true,
    data: mockData.financial.exchangeRates
  });
});

app.get('/api/financial/gold-prices', (req, res) => {
  res.json({
    success: true,
    data: mockData.financial.goldPrices
  });
});

app.get('/api/financial/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      exchangeRates: mockData.financial.exchangeRates,
      goldPrices: mockData.financial.goldPrices,
      summary: {
        usdTrend: "up",
        goldTrend: "up",
        marketStatus: "open"
      }
    }
  });
});

// Auth API
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockData.users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz email veya şifre'
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Hesabınız deaktif durumda'
    });
  }

  const token = generateToken(user);
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: {
      token,
      user: userWithoutPassword
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  // Email kontrolü
  const existingUser = mockData.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Bu email adresi zaten kullanılıyor'
    });
  }

  const newUser = {
    id: mockData.users.length + 1,
    firstName,
    lastName,
    email,
    password, // Gerçek uygulamada hash'lenmeli
    role: "user",
    createdAt: new Date().toISOString(),
    isActive: true
  };

  mockData.users.push(newUser);

  const token = generateToken(newUser);
  const { password: _, ...userWithoutPassword } = newUser;

  res.json({
    success: true,
    data: {
      token,
      user: userWithoutPassword
    }
  });
});

app.get('/api/auth/profile', (req, res) => {
  // Basit token kontrolü
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token gerekli'
    });
  }

  // Mock token validation
  const userId = token.split('_')[1];
  const user = mockData.users.find(u => u.id == userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    data: userWithoutPassword
  });
});

// Admin API
app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalUsers: 1247,
        totalArticles: 3580,
        totalSources: 12,
        dailyViews: 15420,
        totalCategories: 6,
        activeAlerts: 3
      },
      recentActivities: [
        {
          id: 1,
          type: 'article',
          action: 'Yeni makale eklendi',
          details: 'TCMB Politika Faizi',
          time: '5 dakika önce',
          user: 'System'
        },
        {
          id: 2,
          type: 'user',
          action: 'Kullanıcı kaydı',
          details: 'user@test.com',
          time: '12 dakika önce',
          user: 'System'
        },
        {
          id: 3,
          type: 'source',
          action: 'Kaynak güncellendi',
          details: 'SPK RSS feed',
          time: '1 saat önce',
          user: 'Admin'
        },
        {
          id: 4,
          type: 'alert',
          action: 'Sistem uyarısı',
          details: 'EPDK scraping timeout',
          time: '2 saat önce',
          user: 'System'
        }
      ],
      systemHealth: {
        rssFeeds: 'healthy',
        scraping: 'warning',
        database: 'healthy',
        api: 'healthy'
      }
    }
  });
});

app.get('/api/admin/users', (req, res) => {
  const usersWithoutPasswords = mockData.users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });

  res.json({
    success: true,
    data: usersWithoutPasswords
  });
});

app.get('/api/admin/articles', (req, res) => {
  res.json({
    success: true,
    data: mockData.articles
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ========================================`);
  console.log(`   TÜRKİYE RESMİ HABER SİTESİ - FULL API`);
  console.log(`========================================`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
  console.log(`📰 ARTICLES:`);
  console.log(`   • Tüm Makaleler: http://localhost:${PORT}/api/articles`);
  console.log(`   • Son Duyurular: http://localhost:${PORT}/api/articles/latest`);
  console.log(`   • Trend Makaleler: http://localhost:${PORT}/api/articles/trending`);
  console.log(`🏛️ KAYNAKLAR:`);
  console.log(`   • Tüm Kaynaklar: http://localhost:${PORT}/api/sources`);
  console.log(`💰 FİNANSAL:`);
  console.log(`   • Döviz Kurları: http://localhost:${PORT}/api/financial/exchange-rates`);
  console.log(`   • Altın Fiyatları: http://localhost:${PORT}/api/financial/gold-prices`);
  console.log(`   • Dashboard: http://localhost:${PORT}/api/financial/dashboard`);
  console.log(`👤 ÜYELİK:`);
  console.log(`   • Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   • Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   • Profile: http://localhost:${PORT}/api/auth/profile`);
  console.log(`⚙️ ADMIN:`);
  console.log(`   • Dashboard: http://localhost:${PORT}/api/admin/dashboard`);
  console.log(`   • Users: http://localhost:${PORT}/api/admin/users`);
  console.log(`   • Articles: http://localhost:${PORT}/api/admin/articles`);
  console.log(`========================================`);
}); 