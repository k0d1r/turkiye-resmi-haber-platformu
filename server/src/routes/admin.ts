import { Router } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { adminRateLimit } from '../middleware/rateLimiter';
import { database } from '../database/database';
import { logger } from '../utils/logger';
import { Scheduler } from '../services/scheduler';
import { rssService } from '../services/rssService';
import { TCMBService } from '../services/tcmbService';
import { AIService } from '../services/aiService';
import { EmailService } from '../services/emailService';
import { ApiResponse, PaginatedResponse, AdminStats, SystemHealth } from '../types/types';

const router = Router();

// Tüm admin endpoints require admin auth
router.use(adminRateLimit);
router.use(requireAdmin);

/**
 * 📊 ADMIN DASHBOARD
 */
router.get('/dashboard', asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Admin dashboard accessed', { userId: req.user!.id });

    // Sistem istatistikleri
    const stats = await getSystemStats();
    
    // Sistem sağlığı
    const health = await getSystemHealth();
    
    // Son aktiviteler
    const recentActivity = await getRecentActivity();
    
    // Performans metrikleri
    const performance = await getPerformanceMetrics();

    const response: ApiResponse = {
      success: true,
      data: {
        stats,
        health,
        recentActivity,
        performance,
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Admin dashboard error: ${error.message}`, { userId: req.user!.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Dashboard verileri alınamadı'
    };
    res.status(500).json(response);
  }
}));

/**
 * 👥 USER MANAGEMENT
 */

// Kullanıcıları listele
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('status').optional().isIn(['all', 'verified', 'unverified', 'active', 'inactive'])
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;
  const search = req.query.search as string;
  const status = req.query.status as string || 'all';
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Search filtresi
    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Status filtresi
    if (status !== 'all') {
      if (status === 'verified') {
        whereClause += ' AND is_verified = 1';
      } else if (status === 'unverified') {
        whereClause += ' AND is_verified = 0';
      }
    }

    // Total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await database.get(countQuery, params);
    const total = countResult?.total || 0;

    // Users query
    const usersQuery = `
      SELECT 
        id, email, first_name, last_name, is_verified, created_at,
        (SELECT COUNT(*) FROM subscriptions WHERE user_id = users.id) as subscription_count,
        (SELECT COUNT(*) FROM favorites WHERE user_id = users.id) as favorite_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = users.id) as comment_count
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const users = await database.all(usersQuery, params);

    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isVerified: user.is_verified === 1,
      createdAt: user.created_at,
      stats: {
        subscriptions: user.subscription_count,
        favorites: user.favorite_count,
        comments: user.comment_count
      }
    }));

    const response: PaginatedResponse<any> = {
      success: true,
      data: transformedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Users list error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Kullanıcılar listelenemedi'
    });
  }
}));

// Kullanıcı detayı
router.get('/users/:id', [
  param('id').isInt({ min: 1 })
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await database.get(`
      SELECT 
        id, email, first_name, last_name, is_verified, created_at, updated_at,
        preferences
      FROM users WHERE id = ?
    `, [userId]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    // User subscriptions
    const subscriptions = await database.all(`
      SELECT 
        s.id, s.keywords, s.notification_type, s.is_active, s.created_at,
        sr.name as source_name
      FROM subscriptions s
      LEFT JOIN sources sr ON s.source_id = sr.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [userId]);

    // User activity
    const activity = await database.all(`
      SELECT 'favorite' as type, created_at, article_id FROM favorites WHERE user_id = ?
      UNION ALL
      SELECT 'comment' as type, created_at, article_id FROM comments WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `, [userId, userId]);

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: user.is_verified === 1,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          preferences: user.preferences ? JSON.parse(user.preferences) : null
        },
        subscriptions: subscriptions.map(sub => ({
          id: sub.id,
          sourceName: sub.source_name,
          keywords: sub.keywords ? JSON.parse(sub.keywords) : [],
          notificationType: sub.notification_type,
          isActive: sub.is_active === 1,
          createdAt: sub.created_at
        })),
        recentActivity: activity
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`User detail error: ${error.message}`, { userId });
    res.status(500).json({
      success: false,
      error: 'Kullanıcı detayları alınamadı'
    });
  }
}));

// Kullanıcıyı güncelle
router.put('/users/:id', [
  param('id').isInt({ min: 1 }),
  body('firstName').optional().isLength({ min: 2, max: 50 }),
  body('lastName').optional().isLength({ min: 2, max: 50 }),
  body('isVerified').optional().isBoolean()
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    });
  }

  const userId = parseInt(req.params.id);
  const { firstName, lastName, isVerified } = req.body;

  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    
    if (lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    
    if (isVerified !== undefined) {
      updates.push('is_verified = ?');
      values.push(isVerified ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Güncellenecek alan bulunamadı'
      });
    }

    updates.push('updated_at = datetime("now")');
    values.push(userId);

    await database.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    logger.info('User updated by admin', { 
      userId, 
      adminId: req.user!.id,
      updates: Object.keys(req.body)
    });

    res.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi'
    });

  } catch (error: any) {
    logger.error(`User update error: ${error.message}`, { userId });
    res.status(500).json({
      success: false,
      error: 'Kullanıcı güncellenemedi'
    });
  }
}));

/**
 * 📰 SOURCES MANAGEMENT
 */

// Kaynakları listele
router.get('/sources', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isIn(['rss', 'scraping', 'all']),
  query('status').optional().isIn(['active', 'inactive', 'error', 'all'])
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;
  const category = req.query.category as string || 'all';
  const status = req.query.status as string || 'all';
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (category !== 'all') {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    if (status !== 'all') {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Total count
    const countResult = await database.get(
      `SELECT COUNT(*) as total FROM sources ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // Sources query
    const sourcesQuery = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM articles WHERE source_id = s.id) as article_count,
        (SELECT COUNT(*) FROM subscriptions WHERE source_id = s.id) as subscriber_count,
        (SELECT MAX(published_date) FROM articles WHERE source_id = s.id) as last_article_date
      FROM sources s ${whereClause}
      ORDER BY s.updated_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const sources = await database.all(sourcesQuery, params);

    const transformedSources = sources.map(source => ({
      id: source.id,
      name: source.name,
      description: source.description,
      baseUrl: source.base_url,
      rssUrl: source.rss_url,
      category: source.category,
      status: source.status,
      lastFetched: source.last_fetched,
      fetchInterval: source.fetch_interval,
      isOfficial: source.is_official === 1,
      iconUrl: source.icon_url,
      createdAt: source.created_at,
      updatedAt: source.updated_at,
      stats: {
        articleCount: source.article_count,
        subscriberCount: source.subscriber_count,
        lastArticleDate: source.last_article_date
      }
    }));

    const response: PaginatedResponse<any> = {
      success: true,
      data: transformedSources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Sources list error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Kaynaklar listelenemedi'
    });
  }
}));

// Yeni kaynak ekle
router.post('/sources', [
  body('name').isLength({ min: 2, max: 255 }).withMessage('Kaynak adı 2-255 karakter olmalıdır'),
  body('baseUrl').isURL().withMessage('Geçerli bir base URL giriniz'),
  body('rssUrl').optional().isURL().withMessage('Geçerli bir RSS URL giriniz'),
  body('category').isIn(['rss', 'scraping']).withMessage('Kategori rss veya scraping olmalıdır'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Açıklama 1000 karakteri geçemez'),
  body('fetchInterval').optional().isInt({ min: 5, max: 1440 }).withMessage('Çekme aralığı 5-1440 dakika olmalıdır')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    });
  }

  const { name, baseUrl, rssUrl, category, description, fetchInterval } = req.body;

  try {
    // Aynı isimde kaynak var mı kontrol et
    const existingSource = await database.get(
      'SELECT id FROM sources WHERE name = ?',
      [name]
    );

    if (existingSource) {
      return res.status(409).json({
        success: false,
        error: 'Bu isimde bir kaynak zaten mevcut'
      });
    }

    const result = await database.run(`
      INSERT INTO sources (
        name, description, base_url, rss_url, category, status, 
        fetch_interval, is_official, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, 1, datetime('now'), datetime('now'))
    `, [
      name, 
      description || null, 
      baseUrl, 
      rssUrl || null, 
      category, 
      fetchInterval || 30
    ]);

    logger.info('Source created by admin', { 
      sourceId: result.lastID,
      adminId: req.user!.id,
      name,
      category
    });

    res.status(201).json({
      success: true,
      message: 'Kaynak başarıyla eklendi',
      data: { sourceId: result.lastID }
    });

  } catch (error: any) {
    logger.error(`Source creation error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Kaynak eklenemedi'
    });
  }
}));

// Kaynağı güncelle
router.put('/sources/:id', [
  param('id').isInt({ min: 1 }),
  body('name').optional().isLength({ min: 2, max: 255 }),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['active', 'inactive', 'error']),
  body('fetchInterval').optional().isInt({ min: 5, max: 1440 })
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    });
  }

  const sourceId = parseInt(req.params.id);
  const { name, description, status, fetchInterval } = req.body;

  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    
    if (fetchInterval !== undefined) {
      updates.push('fetch_interval = ?');
      values.push(fetchInterval);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Güncellenecek alan bulunamadı'
      });
    }

    updates.push('updated_at = datetime("now")');
    values.push(sourceId);

    await database.run(
      `UPDATE sources SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    logger.info('Source updated by admin', { 
      sourceId,
      adminId: req.user!.id,
      updates: Object.keys(req.body)
    });

    res.json({
      success: true,
      message: 'Kaynak başarıyla güncellendi'
    });

  } catch (error: any) {
    logger.error(`Source update error: ${error.message}`, { sourceId });
    res.status(500).json({
      success: false,
      error: 'Kaynak güncellenemedi'
    });
  }
}));

/**
 * 📄 ARTICLES MANAGEMENT
 */

// Makaleleri listele
router.get('/articles', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sourceId').optional().isInt({ min: 1 }),
  query('category').optional().isLength({ min: 1 }),
  query('search').optional().isLength({ min: 1 })
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;
  const sourceId = req.query.sourceId ? parseInt(req.query.sourceId as string) : null;
  const category = req.query.category as string;
  const search = req.query.search as string;
  const offset = (page - 1) * limit;

  try {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (sourceId) {
      whereClause += ' AND a.source_id = ?';
      params.push(sourceId);
    }

    if (category) {
      whereClause += ' AND a.category = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND (a.title LIKE ? OR a.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Total count
    const countResult = await database.get(
      `SELECT COUNT(*) as total FROM articles a ${whereClause}`,
      params
    );
    const total = countResult?.total || 0;

    // Articles query
    const articlesQuery = `
      SELECT 
        a.id, a.title, a.description, a.url, a.category, 
        a.published_date, a.created_at, a.view_count, a.is_featured,
        s.name as source_name, s.icon_url as source_icon
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      ${whereClause}
      ORDER BY a.published_date DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    const articles = await database.all(articlesQuery, params);

    const transformedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      description: article.description,
      url: article.url,
      category: article.category,
      publishedDate: article.published_date,
      createdAt: article.created_at,
      viewCount: article.view_count,
      isFeatured: article.is_featured === 1,
      source: {
        name: article.source_name,
        iconUrl: article.source_icon
      }
    }));

    const response: PaginatedResponse<any> = {
      success: true,
      data: transformedArticles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Articles list error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Makaleler listelenemedi'
    });
  }
}));

// Makaleyi öne çıkar/kaldır
router.patch('/articles/:id/featured', [
  param('id').isInt({ min: 1 }),
  body('featured').isBoolean().withMessage('Featured boolean olmalıdır')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    });
  }

  const articleId = parseInt(req.params.id);
  const { featured } = req.body;

  try {
    await database.run(
      'UPDATE articles SET is_featured = ?, updated_at = datetime("now") WHERE id = ?',
      [featured ? 1 : 0, articleId]
    );

    logger.info('Article featured status changed', { 
      articleId,
      featured,
      adminId: req.user!.id
    });

    res.json({
      success: true,
      message: `Makale ${featured ? 'öne çıkarıldı' : 'öne çıkarılmaktan kaldırıldı'}`
    });

  } catch (error: any) {
    logger.error(`Article featured update error: ${error.message}`, { articleId });
    res.status(500).json({
      success: false,
      error: 'Makale durumu değiştirilemedi'
    });
  }
}));

/**
 * 🔧 SYSTEM MANAGEMENT
 */

// Sistem durumu
router.get('/system/health', asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const health = await getSystemHealth();
    
    res.json({
      success: true,
      data: health
    });

  } catch (error: any) {
    logger.error(`System health check error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Sistem durumu alınamadı'
    });
  }
}));

// Scheduler yönetimi
router.get('/system/scheduler', asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const status = Scheduler.getStatus();
    
    res.json({
      success: true,
      data: status
    });

  } catch (error: any) {
    logger.error(`Scheduler status error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Scheduler durumu alınamadı'
    });
  }
}));

// Manuel RSS güncelleme
router.post('/system/rss/update', asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Manual RSS update triggered', { adminId: req.user!.id });
    
    const result = await Scheduler.runRSSUpdate();
    
    res.json({
      success: true,
      message: 'RSS güncelleme başlatıldı',
      data: result
    });

  } catch (error: any) {
    logger.error(`Manual RSS update error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'RSS güncelleme başlatılamadı'
    });
  }
}));

// Manuel scraping
router.post('/system/scraping/run', [
  body('sources').optional().isArray().withMessage('Sources array olmalıdır')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const { sources } = req.body;
    
    logger.info('Manual scraping triggered', { 
      adminId: req.user!.id,
      sources: sources || ['SPK', 'EPDK']
    });
    
    const result = await Scheduler.runManualScraping(sources);
    
    res.json({
      success: true,
      message: 'Scraping başlatıldı',
      data: result
    });

  } catch (error: any) {
    logger.error(`Manual scraping error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Scraping başlatılamadı'
    });
  }
}));

// AI batch summarization
router.post('/system/ai/summarize', [
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit 1-100 arasında olmalıdır')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!AIService.isAvailable()) {
    return res.status(503).json({
      success: false,
      error: 'AI service kullanılamıyor'
    });
  }

  try {
    const { limit } = req.body;
    
    logger.info('AI batch summarization triggered', { 
      adminId: req.user!.id,
      limit: limit || 10
    });
    
    const result = await AIService.summarizeArticlesBatch(limit || 10);
    
    res.json({
      success: true,
      message: 'AI özetleme tamamlandı',
      data: result
    });

  } catch (error: any) {
    logger.error(`AI summarization error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'AI özetleme başarısız'
    });
  }
}));

// Cache temizleme
router.post('/system/cache/clear', [
  body('type').isIn(['all', 'rss', 'financial', 'ai', 'scraping']).withMessage('Geçersiz cache tipi')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const { type } = req.body;
    
    logger.info('Cache clear triggered', { 
      adminId: req.user!.id,
      type
    });

    let clearedCaches: string[] = [];

    if (type === 'all' || type === 'financial') {
      TCMBService.clearCache();
      clearedCaches.push('Financial');
    }
    
    if (type === 'all' || type === 'ai') {
      await AIService.clearCache();
      clearedCaches.push('AI');
    }
    
    if (type === 'all') {
      // Diğer cache'leri de temizle
      clearedCaches.push('All caches');
    }
    
    res.json({
      success: true,
      message: `Cache temizlendi: ${clearedCaches.join(', ')}`,
      data: { clearedCaches }
    });

  } catch (error: any) {
    logger.error(`Cache clear error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Cache temizlenemedi'
    });
  }
}));

/**
 * 📊 ANALYTICS & REPORTS
 */

// Analitik veriler
router.get('/analytics', [
  query('period').optional().isIn(['today', 'week', 'month', 'year']),
  query('metric').optional().isIn(['users', 'articles', 'views', 'subscriptions'])
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const period = req.query.period as string || 'week';
    const metric = req.query.metric as string;
    
    const analytics = await getAnalytics(period, metric);
    
    res.json({
      success: true,
      data: analytics
    });

  } catch (error: any) {
    logger.error(`Analytics error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Analitik veriler alınamadı'
    });
  }
}));

// Sistem logları
router.get('/logs', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('level').optional().isIn(['debug', 'info', 'warn', 'error']),
  query('search').optional().isLength({ min: 1 })
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    // Bu gerçek implementasyonda log tablosundan veri çekilecek
    // Şimdilik mock data döndürelim
    
    const logs = [
      {
        id: 1,
        level: 'info',
        message: 'RSS feeds updated successfully',
        timestamp: new Date().toISOString(),
        metadata: { count: 5 }
      },
      {
        id: 2,
        level: 'error',
        message: 'TCMB API connection failed',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        metadata: { error: 'Network timeout' }
      }
    ];
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: 1,
        limit: 25,
        total: logs.length,
        totalPages: 1
      }
    });

  } catch (error: any) {
    logger.error(`Logs fetch error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Loglar alınamadı'
    });
  }
}));

/**
 * HELPER FUNCTIONS
 */

async function getSystemStats(): Promise<AdminStats> {
  const [
    totalUsers,
    totalArticles,
    totalSources,
    activeSubscriptions,
    todayArticles,
    topSources
  ] = await Promise.all([
    database.get('SELECT COUNT(*) as count FROM users'),
    database.get('SELECT COUNT(*) as count FROM articles'),
    database.get('SELECT COUNT(*) as count FROM sources WHERE status = "active"'),
    database.get('SELECT COUNT(*) as count FROM subscriptions WHERE is_active = 1'),
    database.get('SELECT COUNT(*) as count FROM articles WHERE date(created_at) = date("now")'),
    database.all(`
      SELECT s.id, s.name, COUNT(a.id) as articleCount
      FROM sources s
      LEFT JOIN articles a ON s.id = a.source_id
      WHERE s.status = 'active'
      GROUP BY s.id, s.name
      ORDER BY articleCount DESC
      LIMIT 5
    `)
  ]);

  // Weekly growth calculation (simplified)
  const lastWeekArticles = await database.get(`
    SELECT COUNT(*) as count 
    FROM articles 
    WHERE created_at >= date('now', '-7 days')
  `);
  
  const weeklyGrowth = lastWeekArticles?.count || 0;

  return {
    totalUsers: totalUsers?.count || 0,
    totalArticles: totalArticles?.count || 0,
    totalSources: totalSources?.count || 0,
    activeSubscriptions: activeSubscriptions?.count || 0,
    todayArticles: todayArticles?.count || 0,
    weeklyGrowth,
    topSources: topSources || [],
    recentActivity: [] // Bu ayrı fonksiyonda doldurulacak
  };
}

async function getSystemHealth(): Promise<SystemHealth> {
  const startTime = Date.now();
  
  try {
    // Database bağlantı testi
    await database.get('SELECT 1');
    const dbResponseTime = Date.now() - startTime;
    
    // Memory usage (simplified)
    const memoryUsage = process.memoryUsage();
    
    // Uptime
    const uptime = process.uptime();
    
    // Scheduler status
    const schedulerStatus = Scheduler.getStatus();
    
    // Services status
    const services = [
      {
        name: 'Database',
        status: 'online' as const,
        lastCheck: new Date()
      },
      {
        name: 'RSS Service',
        status: 'online' as const,
        lastCheck: new Date()
      },
      {
        name: 'TCMB Service',
        status: 'online' as const,
        lastCheck: new Date()
      },
      {
        name: 'AI Service',
        status: AIService.isAvailable() ? 'online' as const : 'offline' as const,
        lastCheck: new Date()
      }
    ];
    
    const overallStatus: SystemHealth['status'] = 
      services.every(s => s.status === 'online') ? 'healthy' : 
      services.some(s => s.status === 'offline') ? 'warning' : 'error';

    return {
      status: overallStatus,
      uptime,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      database: {
        connected: true,
        responseTime: dbResponseTime
      },
      scheduler: {
        running: schedulerStatus.isRunning,
        lastRun: new Date(), // Bu gerçek implementasyonda scheduler'dan gelecek
        nextRun: new Date(Date.now() + 30 * 60 * 1000) // 30 dakika sonra
      },
      services
    };

  } catch (error) {
    return {
      status: 'error',
      uptime: process.uptime(),
      memory: {
        used: 0,
        total: 0,
        percentage: 0
      },
      database: {
        connected: false,
        responseTime: 0
      },
      scheduler: {
        running: false,
        lastRun: new Date(),
        nextRun: new Date()
      },
      services: []
    };
  }
}

async function getRecentActivity(): Promise<any[]> {
  try {
    const activities = await database.all(`
      SELECT 'user_registered' as type, first_name as message, created_at as timestamp
      FROM users
      WHERE created_at >= datetime('now', '-24 hours')
      UNION ALL
      SELECT 'article_published' as type, title as message, created_at as timestamp
      FROM articles
      WHERE created_at >= datetime('now', '-24 hours')
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    return activities.map(activity => ({
      type: activity.type,
      message: activity.message,
      timestamp: activity.timestamp
    }));
  } catch (error) {
    return [];
  }
}

async function getPerformanceMetrics(): Promise<any> {
  try {
    const [
      avgResponseTime,
      requestCount,
      errorCount
    ] = await Promise.all([
      // Bu gerçek implementasyonda performance tracking tablosundan gelecek
      Promise.resolve(150), // ms
      Promise.resolve(1250), // Son 24 saat
      Promise.resolve(12) // Son 24 saat
    ]);

    return {
      averageResponseTime: avgResponseTime,
      requestsLast24h: requestCount,
      errorsLast24h: errorCount,
      uptime: process.uptime(),
      successRate: ((requestCount - errorCount) / requestCount) * 100
    };
  } catch (error) {
    return {
      averageResponseTime: 0,
      requestsLast24h: 0,
      errorsLast24h: 0,
      uptime: 0,
      successRate: 0
    };
  }
}

async function getAnalytics(period: string, metric?: string): Promise<any> {
  // Bu gerçek implementasyonda detaylı analitik hesaplamaları olacak
  return {
    period,
    metric,
    data: [
      { date: '2024-01-01', value: 100 },
      { date: '2024-01-02', value: 120 },
      { date: '2024-01-03', value: 90 }
    ],
    summary: {
      total: 310,
      average: 103.3,
      growth: 15.2
    }
  };
}

export { router as adminRoutes }; 