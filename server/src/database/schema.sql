-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    preferences TEXT, -- JSON formatında kullanıcı tercihleri
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Kaynaklar tablosu (RSS/XML feed kaynakları)
CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_url VARCHAR(500) NOT NULL,
    rss_url VARCHAR(500),
    category VARCHAR(100) NOT NULL, -- 'rss' veya 'scraping'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'error'
    last_fetched DATETIME,
    fetch_interval INTEGER DEFAULT 30, -- dakika cinsinden
    robots_txt_checked BOOLEAN DEFAULT FALSE,
    is_official BOOLEAN DEFAULT TRUE,
    icon_url VARCHAR(500),
    metadata TEXT, -- JSON formatında ek bilgiler
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Duyurular/Haberler tablosu
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content TEXT, -- Tam içerik (eğer mevcut ise)
    summary TEXT, -- AI ile oluşturulan özet
    url VARCHAR(1000) NOT NULL,
    author VARCHAR(255),
    published_date DATETIME,
    fetched_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    hash VARCHAR(64) UNIQUE, -- Duplicate kontrolü için
    category VARCHAR(100),
    tags TEXT, -- JSON array formatında
    language VARCHAR(10) DEFAULT 'tr',
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    metadata TEXT, -- JSON formatında ek bilgiler
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

-- Kullanıcı abonelikleri
CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source_id INTEGER,
    keywords TEXT, -- JSON array formatında anahtar kelimeler
    notification_type VARCHAR(50) DEFAULT 'email', -- 'email', 'push', 'both'
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

-- Kullanıcı favorileri
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    article_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    UNIQUE(user_id, article_id)
);

-- Finansal veriler (TCMB döviz kurları vs.)
CREATE TABLE IF NOT EXISTS financial_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_type VARCHAR(50) NOT NULL, -- 'exchange_rate', 'gold_price', etc.
    currency_code VARCHAR(10), -- USD, EUR, GBP vb.
    value DECIMAL(15, 6) NOT NULL,
    unit VARCHAR(20), -- TRY, gr, oz vb.
    date DATE NOT NULL,
    source VARCHAR(100) DEFAULT 'TCMB',
    metadata TEXT, -- JSON formatında ek bilgiler
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(data_type, currency_code, date)
);

-- Kullanıcı yorumları (moderasyonlu)
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    article_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    moderated_by INTEGER,
    moderation_date DATETIME,
    parent_id INTEGER, -- Reply sistemi için
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- Bildirimler tablosu
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'new_article', 'keyword_match', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    article_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE, -- Email/push gönderildi mi?
    scheduled_for DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
);

-- Log tablosu (sistem logları)
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error'
    message TEXT NOT NULL,
    source VARCHAR(100), -- Hangi kaynak/servis
    metadata TEXT, -- JSON formatında ek bilgiler
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Cache tablosu (özetler ve analiz sonuçları)
CREATE TABLE IF NOT EXISTS ai_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key VARCHAR(255) UNIQUE NOT NULL,
    data TEXT NOT NULL, -- JSON formatında cache verisi
    cache_type VARCHAR(50) DEFAULT 'summary', -- 'summary', 'analysis', 'keywords'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    hit_count INTEGER DEFAULT 0
);

-- Admin activity log
CREATE TABLE IF NOT EXISTS admin_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50), -- 'user', 'source', 'article', 'system'
    target_id INTEGER,
    details TEXT, -- JSON formatında detaylar
    ip_address VARCHAR(45),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indeksler
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles(published_date);
CREATE INDEX IF NOT EXISTS idx_articles_hash ON articles(hash);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_type_date ON financial_data(data_type, date);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_logs_level_created ON logs(level, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_created ON ai_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin ON admin_activity(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_timestamp ON admin_activity(timestamp); 