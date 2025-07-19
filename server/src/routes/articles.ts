import { Router } from 'express';
import { query, param, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { searchRateLimit } from '../middleware/rateLimiter';
import { database } from '../database/database';
import { logger } from '../utils/logger';
import { ApiResponse, PaginatedResponse } from '../types/types';

const router = Router();

/**
 * Son makaleleri getir (ana sayfa için)
 */
router.get('/', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('Sayfa numarası pozitif integer olmalıdır'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit 1-50 arasında olmalıdır')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    };
    res.status(400).json(response);
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  try {
    // Toplam makale sayısını al
    const countResult = await database.get(
      'SELECT COUNT(*) as total FROM articles WHERE published_date IS NOT NULL'
    );
    const total = countResult?.total || 0;

    // Makaleleri al
    const articles = await database.all(`
      SELECT 
        a.id, a.title, a.description, a.summary, a.url, a.category,
        a.published_date, a.created_at, a.view_count, a.is_featured,
        s.id as source_id, s.name as source_name, s.icon_url as source_icon
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      WHERE a.published_date IS NOT NULL
      ORDER BY 
        CASE WHEN a.is_featured = 1 THEN 0 ELSE 1 END,
        a.published_date DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const response: PaginatedResponse<any> = {
      success: true,
      data: articles.map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        summary: article.summary,
        url: article.url,
        category: article.category,
        publishedDate: article.published_date,
        createdAt: article.created_at,
        viewCount: article.view_count,
        isFeatured: article.is_featured === 1,
        source: article.source_id ? {
          id: article.source_id,
          name: article.source_name,
          iconUrl: article.source_icon
        } : null
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Articles fetch error: ${error.message}`);
    
    const response: ApiResponse = {
      success: false,
      error: 'Makaleler alınırken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Gelişmiş arama
 */
router.get('/search', [
  searchRateLimit,
  optionalAuth,
  query('q').optional().isLength({ min: 1, max: 100 }).withMessage('Arama terimi 1-100 karakter arasında olmalıdır'),
  query('sourceId').optional().isInt({ min: 1 }).withMessage('Kaynak ID pozitif integer olmalıdır'),
  query('category').optional().isIn(['announcement', 'regulation', 'financial', 'legal', 'technology', 'other']).withMessage('Geçersiz kategori'),
  query('dateFrom').optional().isISO8601().withMessage('Geçersiz başlangıç tarihi'),
  query('dateTo').optional().isISO8601().withMessage('Geçersiz bitiş tarihi'),
  query('page').optional().isInt({ min: 1 }).withMessage('Sayfa numarası pozitif integer olmalıdır'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit 1-50 arasında olmalıdır'),
  query('sortBy').optional().isIn(['date', 'relevance', 'views']).withMessage('Geçersiz sıralama'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Geçersiz sıralama yönü')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    };
    res.status(400).json(response);
    return;
  }

  const {
    q: searchQuery,
    sourceId,
    category,
    dateFrom,
    dateTo,
    page = '1',
    limit = '20',
    sortBy = 'date',
    sortOrder = 'desc'
  } = req.query;

  try {
    // Query builder
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Text search
    if (searchQuery) {
      whereClause += ` AND (
        a.title LIKE ? OR 
        a.description LIKE ? OR 
        a.summary LIKE ? OR
        s.name LIKE ?
      )`;
      const searchTerm = `%${searchQuery}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Source filter
    if (sourceId) {
      whereClause += ' AND a.source_id = ?';
      params.push(parseInt(sourceId as string));
    }

    // Category filter
    if (category) {
      whereClause += ' AND a.category = ?';
      params.push(category);
    }

    // Date range filter
    if (dateFrom) {
      whereClause += ' AND a.published_date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND a.published_date <= ?';
      params.push(dateTo);
    }

    // Sort clause
    let orderClause = 'ORDER BY ';
    switch (sortBy) {
      case 'relevance':
        if (searchQuery) {
          orderClause += `(
            CASE 
              WHEN a.title LIKE ? THEN 3
              WHEN a.description LIKE ? THEN 2  
              WHEN a.summary LIKE ? THEN 1
              ELSE 0
            END
          ) DESC, a.published_date DESC`;
          const searchTerm = `%${searchQuery}%`;
          params.push(searchTerm, searchTerm, searchTerm);
        } else {
          orderClause += 'a.published_date DESC';
        }
        break;
      case 'views':
        orderClause += `a.view_count ${sortOrder.toUpperCase()}, a.published_date DESC`;
        break;
      case 'date':
      default:
        orderClause += `a.published_date ${sortOrder.toUpperCase()}`;
        break;
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      ${whereClause}
    `;
    
    const countParams = params.slice(); // Copy params array
    const countResult = await database.get(countQuery, countParams);
    const total = countResult?.total || 0;

    // Main query
    const articlesQuery = `
      SELECT 
        a.id, a.title, a.description, a.summary, a.url, a.category,
        a.published_date, a.created_at, a.view_count, a.is_featured,
        s.id as source_id, s.name as source_name, s.icon_url as source_icon
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    params.push(limitNum, offset);
    const articles = await database.all(articlesQuery, params);

    // Log search query
    logger.info('Search performed', {
      query: searchQuery,
      sourceId,
      category,
      dateFrom,
      dateTo,
      resultCount: articles.length,
      userId: req.user?.id
    });

    const response: PaginatedResponse<any> = {
      success: true,
      data: articles.map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        summary: article.summary,
        url: article.url,
        category: article.category,
        publishedDate: article.published_date,
        createdAt: article.created_at,
        viewCount: article.view_count,
        isFeatured: article.is_featured === 1,
        source: article.source_id ? {
          id: article.source_id,
          name: article.source_name,
          iconUrl: article.source_icon
        } : null
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      meta: {
        searchQuery,
        filters: {
          sourceId: sourceId ? parseInt(sourceId as string) : undefined,
          category,
          dateFrom,
          dateTo
        },
        sorting: {
          sortBy,
          sortOrder
        }
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Search error: ${error.message}`, { 
      query: searchQuery,
      userId: req.user?.id 
    });
    
    const response: ApiResponse = {
      success: false,
      error: 'Arama işlemi sırasında hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Kaynak bazlı makaleler
 */
router.get('/source/:sourceId', [
  optionalAuth,
  param('sourceId').isInt({ min: 1 }).withMessage('Geçersiz kaynak ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Sayfa numarası pozitif integer olmalıdır'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit 1-50 arasında olmalıdır')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    };
    res.status(400).json(response);
    return;
  }

  const sourceId = parseInt(req.params.sourceId);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  try {
    // Kaynak kontrolü
    const source = await database.get(
      'SELECT id, name, description, icon_url FROM sources WHERE id = ?',
      [sourceId]
    );

    if (!source) {
      const response: ApiResponse = {
        success: false,
        error: 'Kaynak bulunamadı'
      };
      res.status(404).json(response);
      return;
    }

    // Toplam makale sayısını al
    const countResult = await database.get(
      'SELECT COUNT(*) as total FROM articles WHERE source_id = ?',
      [sourceId]
    );
    const total = countResult?.total || 0;

    // Makaleleri al
    const articles = await database.all(`
      SELECT 
        a.id, a.title, a.description, a.summary, a.url, a.category,
        a.published_date, a.created_at, a.view_count, a.is_featured
      FROM articles a
      WHERE a.source_id = ?
      ORDER BY a.published_date DESC
      LIMIT ? OFFSET ?
    `, [sourceId, limit, offset]);

    const response: PaginatedResponse<any> = {
      success: true,
      data: articles.map(article => ({
        id: article.id,
        title: article.title,
        description: article.description,
        summary: article.summary,
        url: article.url,
        category: article.category,
        publishedDate: article.published_date,
        createdAt: article.created_at,
        viewCount: article.view_count,
        isFeatured: article.is_featured === 1,
        source: {
          id: source.id,
          name: source.name,
          iconUrl: source.icon_url
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      meta: {
        source: {
          id: source.id,
          name: source.name,
          description: source.description,
          iconUrl: source.icon_url
        }
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Source articles fetch error: ${error.message}`, { sourceId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Kaynak makaleleri alınırken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Makale detayı
 */
router.get('/:id', [
  optionalAuth,
  param('id').isInt({ min: 1 }).withMessage('Geçersiz makale ID')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Geçersiz makale ID'
    };
    res.status(400).json(response);
    return;
  }

  const articleId = parseInt(req.params.id);

  try {
    // Makaleyi al
    const article = await database.get(`
      SELECT 
        a.id, a.title, a.description, a.content, a.summary, a.url, 
        a.category, a.published_date, a.created_at, a.view_count, 
        a.is_featured, a.author, a.tags,
        s.id as source_id, s.name as source_name, s.description as source_description,
        s.icon_url as source_icon, s.base_url as source_base_url
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      WHERE a.id = ?
    `, [articleId]);

    if (!article) {
      const response: ApiResponse = {
        success: false,
        error: 'Makale bulunamadı'
      };
      res.status(404).json(response);
      return;
    }

    // View count artır
    await database.run(
      'UPDATE articles SET view_count = view_count + 1 WHERE id = ?',
      [articleId]
    );

    // Related articles (aynı kategori veya kaynak)
    const relatedArticles = await database.all(`
      SELECT 
        a.id, a.title, a.url, a.published_date,
        s.name as source_name
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      WHERE a.id != ? AND (
        a.category = ? OR a.source_id = ?
      )
      ORDER BY a.published_date DESC
      LIMIT 5
    `, [articleId, article.category, article.source_id]);

    const response: ApiResponse = {
      success: true,
      data: {
        article: {
          id: article.id,
          title: article.title,
          description: article.description,
          content: article.content,
          summary: article.summary,
          url: article.url,
          category: article.category,
          publishedDate: article.published_date,
          createdAt: article.created_at,
          viewCount: article.view_count + 1, // Updated view count
          isFeatured: article.is_featured === 1,
          author: article.author,
          tags: article.tags ? JSON.parse(article.tags) : [],
          source: article.source_id ? {
            id: article.source_id,
            name: article.source_name,
            description: article.source_description,
            iconUrl: article.source_icon,
            baseUrl: article.source_base_url
          } : null
        },
        relatedArticles: relatedArticles.map(related => ({
          id: related.id,
          title: related.title,
          url: related.url,
          publishedDate: related.published_date,
          sourceName: related.source_name
        }))
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Article detail fetch error: ${error.message}`, { articleId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Makale detayları alınırken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Trending/popüler makaleler
 */
router.get('/trending/popular', [
  optionalAuth,
  query('period').optional().isIn(['today', 'week', 'month']).withMessage('Geçersiz period'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit 1-20 arasında olmalıdır')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    };
    res.status(400).json(response);
    return;
  }

  const period = req.query.period || 'week';
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = "AND a.published_date >= date('now', '-1 day')";
        break;
      case 'week':
        dateFilter = "AND a.published_date >= date('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "AND a.published_date >= date('now', '-30 days')";
        break;
    }

    const articles = await database.all(`
      SELECT 
        a.id, a.title, a.description, a.url, a.category,
        a.published_date, a.view_count, a.is_featured,
        s.id as source_id, s.name as source_name, s.icon_url as source_icon
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      WHERE a.view_count > 0 ${dateFilter}
      ORDER BY a.view_count DESC, a.published_date DESC
      LIMIT ?
    `, [limit]);

    const response: ApiResponse = {
      success: true,
      data: {
        period,
        articles: articles.map(article => ({
          id: article.id,
          title: article.title,
          description: article.description,
          url: article.url,
          category: article.category,
          publishedDate: article.published_date,
          viewCount: article.view_count,
          isFeatured: article.is_featured === 1,
          source: article.source_id ? {
            id: article.source_id,
            name: article.source_name,
            iconUrl: article.source_icon
          } : null
        }))
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Trending articles fetch error: ${error.message}`, { period });
    
    const response: ApiResponse = {
      success: false,
      error: 'Popüler makaleler alınırken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

export { router as articlesRoutes }; 