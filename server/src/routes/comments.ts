import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { auth, AuthenticatedRequest } from '../middleware/auth';
import { database } from '../database/database';
import { ApiResponse } from '../types/types';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Makaleye ait yorumları listele (onaylanmış)
 */
router.get('/article/:articleId', asyncHandler(async (req, res) => {
  const articleId = parseInt(req.params.articleId);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  if (!articleId || articleId <= 0) {
    const response: ApiResponse = {
      success: false,
      error: 'Geçerli bir makale ID\'si gereklidir'
    };
    res.status(400).json(response);
    return;
  }

  try {
    // Toplam onaylanmış yorum sayısı
    const countResult = await database.get(
      'SELECT COUNT(*) as total FROM comments WHERE article_id = ? AND status = "approved"',
      [articleId]
    );
    const total = countResult.total;

    // Onaylanmış yorumları getir
    const comments = await database.all(`
      SELECT 
        c.id,
        c.content,
        c.created_at,
        c.parent_id,
        u.first_name,
        u.last_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.article_id = ? AND c.status = 'approved'
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `, [articleId, limit, offset]);

    // Hiyerarşik yapı oluştur (reply sistemi için)
    const commentsMap = new Map();
    const rootComments: any[] = [];

    comments.forEach(comment => {
      commentsMap.set(comment.id, { ...comment, replies: [] });
      if (!comment.parent_id) {
        rootComments.push(commentsMap.get(comment.id));
      }
    });

    comments.forEach(comment => {
      if (comment.parent_id && commentsMap.has(comment.parent_id)) {
        commentsMap.get(comment.parent_id).replies.push(commentsMap.get(comment.id));
      }
    });

    const response: ApiResponse = {
      success: true,
      data: {
        comments: rootComments,
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
    logger.error(`Get comments error: ${error.message}`, { articleId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Yorumlar alınamadı'
    };
    res.status(500).json(response);
  }
}));

/**
 * Yeni yorum ekle (moderasyon bekleyecek)
 */
router.post('/', [
  auth,
  body('articleId')
    .isInt({ min: 1 })
    .withMessage('Geçerli bir makale ID\'si gereklidir'),
  body('content')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Yorum 10-1000 karakter arasında olmalıdır')
    .trim(),
  body('parentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Geçerli bir parent ID\'si gereklidir')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: errors.array()[0].msg
    };
    res.status(400).json(response);
    return;
  }

  const userId = req.user!.id;
  const { articleId, content, parentId } = req.body;

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

    // Parent yorum var mı kontrol et (eğer reply ise)
    if (parentId) {
      const parentComment = await database.get(
        'SELECT id FROM comments WHERE id = ? AND article_id = ? AND status = "approved"',
        [parentId, articleId]
      );

      if (!parentComment) {
        const response: ApiResponse = {
          success: false,
          error: 'Ana yorum bulunamadı'
        };
        res.status(404).json(response);
        return;
      }
    }

    // Yorumu kaydet (pending durumunda)
    const result = await database.run(`
      INSERT INTO comments (user_id, article_id, content, parent_id, status) 
      VALUES (?, ?, ?, ?, 'pending')
    `, [userId, articleId, content, parentId || null]);

    logger.info(`Comment added for moderation: ${result.lastID}`, { 
      userId, 
      articleId, 
      parentId 
    });

    const response: ApiResponse = {
      success: true,
      message: 'Yorumunuz moderatör onayına gönderildi',
      data: {
        commentId: result.lastID
      }
    };
    res.status(201).json(response);

  } catch (error: any) {
    logger.error(`Add comment error: ${error.message}`, { userId, articleId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Yorum eklenirken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Kullanıcının yorumları (tüm durumlar)
 */
router.get('/my-comments', [auth], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  try {
    // Toplam yorum sayısı
    const countResult = await database.get(
      'SELECT COUNT(*) as total FROM comments WHERE user_id = ?',
      [userId]
    );
    const total = countResult.total;

    // Kullanıcının yorumları
    const comments = await database.all(`
      SELECT 
        c.id,
        c.content,
        c.status,
        c.created_at,
        c.parent_id,
        a.title as article_title,
        a.id as article_id,
        a.url as article_url
      FROM comments c
      JOIN articles a ON c.article_id = a.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const response: ApiResponse = {
      success: true,
      data: {
        comments,
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
    logger.error(`Get user comments error: ${error.message}`, { userId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Yorumlarınız alınamadı'
    };
    res.status(500).json(response);
  }
}));

/**
 * Yorum sil (sadece kendi yorumu)
 */
router.delete('/:id', [auth], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const commentId = parseInt(req.params.id);

  if (!commentId || commentId <= 0) {
    const response: ApiResponse = {
      success: false,
      error: 'Geçerli bir yorum ID\'si gereklidir'
    };
    res.status(400).json(response);
    return;
  }

  try {
    // Yorum var mı ve kullanıcıya ait mi kontrol et
    const comment = await database.get(
      'SELECT id FROM comments WHERE id = ? AND user_id = ?',
      [commentId, userId]
    );

    if (!comment) {
      const response: ApiResponse = {
        success: false,
        error: 'Yorum bulunamadı veya size ait değil'
      };
      res.status(404).json(response);
      return;
    }

    // Yorumu sil (cascade ile reply'lar da silinir)
    await database.run(
      'DELETE FROM comments WHERE id = ? AND user_id = ?',
      [commentId, userId]
    );

    logger.info(`Comment deleted: ${commentId}`, { userId });

    const response: ApiResponse = {
      success: true,
      message: 'Yorum silindi'
    };
    res.json(response);

  } catch (error: any) {
    logger.error(`Delete comment error: ${error.message}`, { userId, commentId });
    
    const response: ApiResponse = {
      success: false,
      error: 'Yorum silinirken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

export { router as commentsRoutes }; 