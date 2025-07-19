import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { auth, AuthenticatedRequest } from '../middleware/auth';
import { database } from '../database/database';
import { ApiResponse } from '../types/types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Kullanıcının bildirimlerini listele
 */
router.get('/', [auth], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  
  try {
    // Toplam bildirim sayısı
    const countResult = await database.get(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
      [userId]
    );
    const total = countResult.total;

    // Bildirimleri getir
    const notifications = await database.all(`
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.article_id,
        n.is_read,
        n.created_at,
        a.title as article_title,
        a.url as article_url,
        s.name as source_name
      FROM notifications n
      LEFT JOIN articles a ON n.article_id = a.id
      LEFT JOIN sources s ON a.source_id = s.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const response: ApiResponse = {
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Get notifications error: ${error.message}`, { userId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Bildirimler alınamadı'
    };
    res.status(500).json(response);
  }
}));

/**
 * Bildirimi okundu olarak işaretle
 */
router.patch('/:id/read', [auth], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const notificationId = parseInt(req.params.id);

  if (!notificationId || notificationId <= 0) {
    const response: ApiResponse = {
      success: false,
      error: 'Geçerli bir bildirim ID\'si gereklidir'
    };
    res.status(400).json(response);
    return;
  }

  try {
    // Bildirim var mı ve kullanıcıya ait mi kontrol et
    const notification = await database.get(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (!notification) {
      const response: ApiResponse = {
        success: false,
        error: 'Bildirim bulunamadı'
      };
      res.status(404).json(response);
      return;
    }

    // Okundu olarak işaretle
    await database.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    logger.info(`Notification marked as read: ${notificationId}`, { userId });

    const response: ApiResponse = {
      success: true,
      message: 'Bildirim okundu olarak işaretlendi'
    };
    res.json(response);

  } catch (error: any) {
    logger.error(`Mark notification read error: ${error.message}`, { userId, notificationId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Bildirim işaretlenirken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Tüm bildirimleri okundu olarak işaretle
 */
router.patch('/read-all', [auth], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  try {
    const result = await database.run(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    logger.info(`All notifications marked as read for user: ${userId}`, { count: result.changes });

    const response: ApiResponse = {
      success: true,
      message: `${result.changes} bildirim okundu olarak işaretlendi`
    };
    res.json(response);

  } catch (error: any) {
    logger.error(`Mark all notifications read error: ${error.message}`, { userId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Bildirimler işaretlenirken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Bildirimi sil
 */
router.delete('/:id', [auth], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const notificationId = parseInt(req.params.id);

  if (!notificationId || notificationId <= 0) {
    const response: ApiResponse = {
      success: false,
      error: 'Geçerli bir bildirim ID\'si gereklidir'
    };
    res.status(400).json(response);
    return;
  }

  try {
    // Bildirim var mı ve kullanıcıya ait mi kontrol et
    const notification = await database.get(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (!notification) {
      const response: ApiResponse = {
        success: false,
        error: 'Bildirim bulunamadı'
      };
      res.status(404).json(response);
      return;
    }

    // Bildirimi sil
    await database.run(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    logger.info(`Notification deleted: ${notificationId}`, { userId });

    const response: ApiResponse = {
      success: true,
      message: 'Bildirim silindi'
    };
    res.json(response);

  } catch (error: any) {
    logger.error(`Delete notification error: ${error.message}`, { userId, notificationId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Bildirim silinirken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Okunmamış bildirim sayısı
 */
router.get('/unread-count', [auth], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  try {
    const result = await database.get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    const response: ApiResponse = {
      success: true,
      data: {
        unreadCount: result.count
      }
    };
    res.json(response);

  } catch (error: any) {
    logger.error(`Get unread count error: ${error.message}`, { userId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Okunmamış bildirim sayısı alınamadı'
    };
    res.status(500).json(response);
  }
}));

export { router as notificationsRoutes }; 