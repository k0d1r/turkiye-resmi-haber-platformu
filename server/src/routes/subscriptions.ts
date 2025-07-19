import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { database } from '../database/database';
import { logger } from '../utils/logger';
import { ApiResponse, PaginatedResponse } from '../types/types';

const router = Router();

/**
 * Kullanıcının aboneliklerini listele
 */
router.get('/', [
  authenticate,
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

  const user = req.user!;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  try {
    // Toplam abonelik sayısını al
    const countResult = await database.get(
      'SELECT COUNT(*) as total FROM subscriptions WHERE user_id = ?',
      [user.id]
    );
    const total = countResult?.total || 0;

    // Abonelikleri al
    const subscriptions = await database.all(`
      SELECT 
        s.id, s.source_id, s.keywords, s.notification_type, s.is_active, s.created_at,
        sr.name as source_name, sr.description as source_description, 
        sr.icon_url as source_icon
      FROM subscriptions s
      LEFT JOIN sources sr ON s.source_id = sr.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [user.id, limit, offset]);

    // Transform data
    const transformedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      source: sub.source_id ? {
        id: sub.source_id,
        name: sub.source_name,
        description: sub.source_description,
        iconUrl: sub.source_icon
      } : null,
      keywords: sub.keywords ? JSON.parse(sub.keywords) : [],
      notificationType: sub.notification_type,
      isActive: sub.is_active === 1,
      createdAt: sub.created_at
    }));

    const response: PaginatedResponse<any> = {
      success: true,
      data: transformedSubscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Subscriptions fetch error: ${error.message}`, { userId: user.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Abonelikler alınırken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Yeni abonelik oluştur
 */
router.post('/', [
  authenticate,
  body('sourceId').optional().isInt({ min: 1 }).withMessage('Geçersiz kaynak ID'),
  body('keywords').optional().isArray().withMessage('Keywords bir dizi olmalıdır'),
  body('keywords.*').optional().isLength({ min: 2, max: 50 }).withMessage('Her keyword 2-50 karakter olmalıdır'),
  body('notificationType').isIn(['email', 'push', 'both']).withMessage('Geçersiz bildirim tipi'),
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

  const user = req.user!;
  const { sourceId, keywords, notificationType } = req.body;

  // En az bir abonelik kriteri olmalı
  if (!sourceId && (!keywords || keywords.length === 0)) {
    const response: ApiResponse = {
      success: false,
      error: 'En az bir kaynak veya keyword belirtmelisiniz'
    };
    res.status(400).json(response);
    return;
  }

  try {
    // Source varsa kontrol et
    if (sourceId) {
      const source = await database.get(
        'SELECT id FROM sources WHERE id = ?',
        [sourceId]
      );
      
      if (!source) {
        const response: ApiResponse = {
          success: false,
          error: 'Belirtilen kaynak bulunamadı'
        };
        res.status(404).json(response);
        return;
      }

      // Aynı kaynak için zaten abonelik var mı?
      const existingSubscription = await database.get(
        'SELECT id FROM subscriptions WHERE user_id = ? AND source_id = ?',
        [user.id, sourceId]
      );

      if (existingSubscription) {
        const response: ApiResponse = {
          success: false,
          error: 'Bu kaynak için zaten aboneliğiniz bulunuyor'
        };
        res.status(409).json(response);
        return;
      }
    }

    // Abonelik oluştur
    const keywordsJson = keywords && keywords.length > 0 ? JSON.stringify(keywords) : null;
    
    const result = await database.run(`
      INSERT INTO subscriptions (
        user_id, source_id, keywords, notification_type, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `, [user.id, sourceId || null, keywordsJson, notificationType]);

    logger.info('Subscription created', { 
      userId: user.id, 
      subscriptionId: result.lastID,
      sourceId,
      keywordCount: keywords?.length || 0
    });

    const response: ApiResponse = {
      success: true,
      message: 'Abonelik başarıyla oluşturuldu',
      data: {
        subscriptionId: result.lastID,
        sourceId,
        keywords: keywords || [],
        notificationType
      }
    };
    
    res.status(201).json(response);

  } catch (error: any) {
    logger.error(`Subscription creation error: ${error.message}`, { userId: user.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Abonelik oluşturulurken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Abonelik güncelle
 */
router.put('/:id', [
  authenticate,
  param('id').isInt({ min: 1 }).withMessage('Geçersiz abonelik ID'),
  body('keywords').optional().isArray().withMessage('Keywords bir dizi olmalıdır'),
  body('keywords.*').optional().isLength({ min: 2, max: 50 }).withMessage('Her keyword 2-50 karakter olmalıdır'),
  body('notificationType').optional().isIn(['email', 'push', 'both']).withMessage('Geçersiz bildirim tipi'),
  body('isActive').optional().isBoolean().withMessage('isActive boolean olmalıdır')
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

  const user = req.user!;
  const subscriptionId = parseInt(req.params.id);
  const { keywords, notificationType, isActive } = req.body;

  try {
    // Abonelik var mı ve kullanıcıya ait mi kontrol et
    const subscription = await database.get(
      'SELECT id FROM subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, user.id]
    );

    if (!subscription) {
      const response: ApiResponse = {
        success: false,
        error: 'Abonelik bulunamadı'
      };
      res.status(404).json(response);
      return;
    }

    // Güncelleme alanlarını hazırla
    const updates: string[] = [];
    const values: any[] = [];

    if (keywords !== undefined) {
      updates.push('keywords = ?');
      values.push(keywords.length > 0 ? JSON.stringify(keywords) : null);
    }

    if (notificationType !== undefined) {
      updates.push('notification_type = ?');
      values.push(notificationType);
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Güncellenecek alan bulunamadı'
      };
      res.status(400).json(response);
      return;
    }

    updates.push('updated_at = datetime("now")');
    values.push(subscriptionId);

    // Aboneliği güncelle
    await database.run(
      `UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    logger.info('Subscription updated', { 
      userId: user.id, 
      subscriptionId,
      updates: Object.keys(req.body)
    });

    const response: ApiResponse = {
      success: true,
      message: 'Abonelik başarıyla güncellendi'
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Subscription update error: ${error.message}`, { 
      userId: user.id, 
      subscriptionId 
    });
    
    const response: ApiResponse = {
      success: false,
      error: 'Abonelik güncellenirken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Abonelik sil
 */
router.delete('/:id', [
  authenticate,
  param('id').isInt({ min: 1 }).withMessage('Geçersiz abonelik ID')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Geçersiz abonelik ID'
    };
    res.status(400).json(response);
    return;
  }

  const user = req.user!;
  const subscriptionId = parseInt(req.params.id);

  try {
    // Abonelik var mı ve kullanıcıya ait mi kontrol et
    const subscription = await database.get(
      'SELECT id FROM subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, user.id]
    );

    if (!subscription) {
      const response: ApiResponse = {
        success: false,
        error: 'Abonelik bulunamadı'
      };
      res.status(404).json(response);
      return;
    }

    // Aboneliği sil
    await database.run(
      'DELETE FROM subscriptions WHERE id = ?',
      [subscriptionId]
    );

    logger.info('Subscription deleted', { 
      userId: user.id, 
      subscriptionId 
    });

    const response: ApiResponse = {
      success: true,
      message: 'Abonelik başarıyla silindi'
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Subscription deletion error: ${error.message}`, { 
      userId: user.id, 
      subscriptionId 
    });
    
    const response: ApiResponse = {
      success: false,
      error: 'Abonelik silinirken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Kullanılabilir kaynaklar (abonelik için)
 */
router.get('/sources', [
  authenticate
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  try {
    // Aktif kaynakları al
    const sources = await database.all(`
      SELECT 
        s.id, s.name, s.description, s.icon_url, s.category,
        (SELECT COUNT(*) FROM subscriptions sub WHERE sub.source_id = s.id AND sub.user_id = ?) as is_subscribed,
        (SELECT COUNT(*) FROM articles WHERE source_id = s.id AND published_date >= date('now', '-7 days')) as recent_articles
      FROM sources s
      WHERE s.status = 'active'
      ORDER BY s.name
    `, [user.id]);

    const transformedSources = sources.map(source => ({
      id: source.id,
      name: source.name,
      description: source.description,
      iconUrl: source.icon_url,
      category: source.category,
      isSubscribed: source.is_subscribed > 0,
      recentArticles: source.recent_articles
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        sources: transformedSources,
        totalSources: transformedSources.length,
        subscribedCount: transformedSources.filter(s => s.isSubscribed).length
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Available sources error: ${error.message}`, { userId: user.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Kaynaklar alınırken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Abonelik istatistikleri
 */
router.get('/stats', [
  authenticate
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  try {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as totalSubscriptions,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeSubscriptions,
        SUM(CASE WHEN source_id IS NOT NULL THEN 1 ELSE 0 END) as sourceSubscriptions,
        SUM(CASE WHEN keywords IS NOT NULL THEN 1 ELSE 0 END) as keywordSubscriptions,
        SUM(CASE WHEN notification_type = 'email' THEN 1 ELSE 0 END) as emailNotifications,
        SUM(CASE WHEN notification_type = 'push' THEN 1 ELSE 0 END) as pushNotifications,
        SUM(CASE WHEN notification_type = 'both' THEN 1 ELSE 0 END) as bothNotifications
      FROM subscriptions 
      WHERE user_id = ?
    `, [user.id]);

    // Son bildirim tarihi
    const lastNotification = await database.get(`
      SELECT created_at 
      FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [user.id]);

    const response: ApiResponse = {
      success: true,
      data: {
        subscriptions: {
          total: stats?.totalSubscriptions || 0,
          active: stats?.activeSubscriptions || 0,
          sourcesBased: stats?.sourceSubscriptions || 0,
          keywordsBased: stats?.keywordSubscriptions || 0
        },
        notifications: {
          email: stats?.emailNotifications || 0,
          push: stats?.pushNotifications || 0,
          both: stats?.bothNotifications || 0,
          lastNotification: lastNotification?.created_at || null
        },
        recommendations: getSubscriptionRecommendations(stats)
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Subscription stats error: ${error.message}`, { userId: user.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'İstatistikler alınırken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Abonelik önerileri helper function
 */
function getSubscriptionRecommendations(stats: any): string[] {
  const recommendations: string[] = [];
  
  if (!stats || stats.totalSubscriptions === 0) {
    recommendations.push('İlk aboneliğinizi oluşturmak için bir kaynak seçin');
    recommendations.push('Özel konularda bildirim almak için keyword aboneliği oluşturun');
  } else {
    if (stats.activeSubscriptions === 0) {
      recommendations.push('Pasif aboneliklerinizi aktif hale getirin');
    }
    
    if (stats.keywordSubscriptions === 0) {
      recommendations.push('İlgilendiğiniz konular için keyword aboneliği oluşturun');
    }
    
    if (stats.emailNotifications === 0 && stats.pushNotifications === 0) {
      recommendations.push('Bildirim türünü seçerek haberlerden haberdar olun');
    }
  }
  
  return recommendations;
}

export { router as subscriptionsRoutes }; 