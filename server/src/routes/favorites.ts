import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { auth, AuthenticatedRequest } from '../middleware/auth';
import { database } from '../database/database';
import { ApiResponse } from '../types/types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Kullanıcının favorilerini listele
 */
router.get('/', [auth], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  
  try {
    const favorites = await database.all(`
      SELECT 
        f.id,
        f.created_at,
        a.id as article_id,
        a.title,
        a.description,
        a.url,
        a.published_date,
        s.name as source_name,
        s.icon_url as source_icon
      FROM favorites f
      JOIN articles a ON f.article_id = a.id
      JOIN sources s ON a.source_id = s.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [userId]);

    const response: ApiResponse = {
      success: true,
      data: {
        favorites,
        count: favorites.length
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Get favorites error: ${error.message}`, { userId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Favoriler alınamadı'
    };
    res.status(500).json(response);
  }
}));

/**
 * Makaleyi favorilere ekle
 */
router.post('/', [
  auth,
  body('articleId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir makale ID\'si gereklidir')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Geçerli bir makale ID\'si gereklidir'
    };
    res.status(400).json(response);
    return;
  }

  const userId = req.user!.id;
  const { articleId } = req.body;

  try {
    // Makale var mı kontrol et
    const article = await database.get(
      'SELECT id FROM articles WHERE id = ?',
      [articleId]
    );

    if (!article) {
      const response: ApiResponse = {
        success: false,
        error: 'Makale bulunamadı'
      };
      res.status(404).json(response);
      return;
    }

    // Zaten favorilerde mi kontrol et
    const existingFavorite = await database.get(
      'SELECT id FROM favorites WHERE user_id = ? AND article_id = ?',
      [userId, articleId]
    );

    if (existingFavorite) {
      const response: ApiResponse = {
        success: false,
        error: 'Makale zaten favorilerde'
      };
      res.status(400).json(response);
      return;
    }

    // Favorilere ekle
    const result = await database.run(
      'INSERT INTO favorites (user_id, article_id) VALUES (?, ?)',
      [userId, articleId]
    );

    logger.info(`Article added to favorites: ${articleId}`, { userId });

    const response: ApiResponse = {
      success: true,
      message: 'Makale favorilere eklendi',
      data: {
        favoriteId: result.lastID
      }
    };
    res.status(201).json(response);

  } catch (error: any) {
    logger.error(`Add favorite error: ${error.message}`, { userId, articleId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Favori eklenirken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Favorilerden kaldır
 */
router.delete('/:articleId', [auth], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const articleId = parseInt(req.params.articleId);

  if (!articleId || articleId <= 0) {
    const response: ApiResponse = {
      success: false,
      error: 'Geçerli bir makale ID\'si gereklidir'
    };
    res.status(400).json(response);
    return;
  }

  try {
    // Favori var mı kontrol et
    const favorite = await database.get(
      'SELECT id FROM favorites WHERE user_id = ? AND article_id = ?',
      [userId, articleId]
    );

    if (!favorite) {
      const response: ApiResponse = {
        success: false,
        error: 'Favori bulunamadı'
      };
      res.status(404).json(response);
      return;
    }

    // Favorilerden kaldır
    await database.run(
      'DELETE FROM favorites WHERE user_id = ? AND article_id = ?',
      [userId, articleId]
    );

    logger.info(`Article removed from favorites: ${articleId}`, { userId });

    const response: ApiResponse = {
      success: true,
      message: 'Makale favorilerden kaldırıldı'
    };
    res.json(response);

  } catch (error: any) {
    logger.error(`Remove favorite error: ${error.message}`, { userId, articleId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Favori kaldırılırken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Makale favori durumunu kontrol et
 */
router.get('/check/:articleId', [auth], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const articleId = parseInt(req.params.articleId);

  if (!articleId || articleId <= 0) {
    const response: ApiResponse = {
      success: false,
      error: 'Geçerli bir makale ID\'si gereklidir'
    };
    res.status(400).json(response);
    return;
  }

  try {
    const favorite = await database.get(
      'SELECT id FROM favorites WHERE user_id = ? AND article_id = ?',
      [userId, articleId]
    );

    const response: ApiResponse = {
      success: true,
      data: {
        isFavorite: !!favorite,
        favoriteId: favorite?.id || null
      }
    };
    res.json(response);

  } catch (error: any) {
    logger.error(`Check favorite error: ${error.message}`, { userId, articleId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Favori durumu kontrol edilemedi'
    };
    res.status(500).json(response);
  }
}));

export { router as favoritesRoutes }; 