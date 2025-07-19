import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { 
  generateToken, 
  hashPassword, 
  verifyPassword, 
  generateVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  authenticate,
  AuthenticatedRequest
} from '../middleware/auth';
import { database } from '../database/database';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/types';

const router = Router();

/**
 * Kullanıcı kaydı
 */
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad 2-50 karakter arasında olmalıdır'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad 2-50 karakter arasında olmalıdır')
], asyncHandler(async (req, res) => {
  // Validation hatalarını kontrol et
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

  const { email, password, firstName, lastName } = req.body;

  try {
    // E-posta zaten kayıtlı mı kontrol et
    const existingUser = await database.get(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'Bu e-posta adresi zaten kayıtlı'
      };
      res.status(409).json(response);
      return;
    }

    // Şifreyi hashle
    const passwordHash = await hashPassword(password);
    
    // Verification token oluştur
    const verificationToken = generateVerificationToken();

    // Kullanıcıyı veritabanına kaydet
    const result = await database.run(
      `INSERT INTO users (
        email, password_hash, first_name, last_name, 
        verification_token, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [email, passwordHash, firstName, lastName, verificationToken]
    );

    logger.info(`New user registered: ${email}`, { userId: result.lastID });

    const response: ApiResponse = {
      success: true,
      message: 'Kullanıcı başarıyla kaydedildi. E-posta doğrulama linkini kontrol ediniz.',
      data: {
        userId: result.lastID,
        email,
        verificationRequired: true
      }
    };
    
    res.status(201).json(response);

  } catch (error: any) {
    logger.error(`Registration error: ${error.message}`, { email });
    
    const response: ApiResponse = {
      success: false,
      error: 'Kayıt işlemi sırasında bir hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Kullanıcı girişi
 */
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz'),
  body('password')
    .notEmpty()
    .withMessage('Şifre gereklidir')
], asyncHandler(async (req, res) => {
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

  const { email, password } = req.body;

  try {
    // Kullanıcıyı bul
    const user = await database.get(
      'SELECT id, email, password_hash, first_name, last_name, is_verified FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'E-posta veya şifre hatalı'
      };
      res.status(401).json(response);
      return;
    }

    // Şifreyi kontrol et
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      logger.warn(`Failed login attempt: ${email}`, { 
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      const response: ApiResponse = {
        success: false,
        error: 'E-posta veya şifre hatalı'
      };
      res.status(401).json(response);
      return;
    }

    // E-posta doğrulanmış mı kontrol et
    if (!user.is_verified) {
      const response: ApiResponse = {
        success: false,
        error: 'E-posta adresinizi doğrulamanız gerekiyor',
        data: { verificationRequired: true }
      };
      res.status(403).json(response);
      return;
    }

    // JWT token oluştur
    const token = generateToken(user.id, user.email);

    logger.info(`User logged in: ${email}`, { 
      userId: user.id,
      ip: req.ip 
    });

    const response: ApiResponse = {
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: user.is_verified === 1
        },
        token,
        expiresIn: '7d'
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Login error: ${error.message}`, { email });
    
    const response: ApiResponse = {
      success: false,
      error: 'Giriş işlemi sırasında bir hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * E-posta doğrulama
 */
router.post('/verify-email', [
  body('token')
    .notEmpty()
    .withMessage('Doğrulama token\'ı gereklidir')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Token gereklidir'
    };
    res.status(400).json(response);
    return;
  }

  const { token } = req.body;

  try {
    // Token'a sahip kullanıcıyı bul
    const user = await database.get(
      'SELECT id, email, first_name, last_name FROM users WHERE verification_token = ? AND is_verified = 0',
      [token]
    );

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Geçersiz veya süresi dolmuş doğrulama token\'ı'
      };
      res.status(400).json(response);
      return;
    }

    // Kullanıcıyı doğrulanmış olarak işaretle
    await database.run(
      'UPDATE users SET is_verified = 1, verification_token = NULL, updated_at = datetime(\"now\") WHERE id = ?',
      [user.id]
    );

    logger.info(`Email verified: ${user.email}`, { userId: user.id });

    const response: ApiResponse = {
      success: true,
      message: 'E-posta başarıyla doğrulandı',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: true
        }
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Email verification error: ${error.message}`);
    
    const response: ApiResponse = {
      success: false,
      error: 'Doğrulama işlemi sırasında bir hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Şifre sıfırlama isteği
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi giriniz')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Geçerli bir e-posta adresi gereklidir'
    };
    res.status(400).json(response);
    return;
  }

  const { email } = req.body;

  try {
    const user = await database.get(
      'SELECT id FROM users WHERE email = ? AND is_verified = 1',
      [email]
    );

    // Security: E-posta bulunamasa bile başarılı mesaj döndür
    const response: ApiResponse = {
      success: true,
      message: 'Eğer e-posta adresiniz kayıtlıysa, şifre sıfırlama linki gönderildi'
    };

    if (user) {
      // Reset token oluştur
      const resetToken = generatePasswordResetToken(user.id);
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

      // Token'ı veritabanına kaydet
      await database.run(
        'UPDATE users SET reset_token = ?, reset_token_expires = ?, updated_at = datetime(\"now\") WHERE id = ?',
        [resetToken, resetTokenExpires.toISOString(), user.id]
      );

      logger.info(`Password reset requested: ${email}`, { userId: user.id });
      
      // TODO: E-posta gönderme servisi entegrasyonu
      // await emailService.sendPasswordResetEmail(email, resetToken);
    }
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Forgot password error: ${error.message}`, { email });
    
    const response: ApiResponse = {
      success: false,
      error: 'İşlem sırasında bir hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Şifre sıfırlama
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token\'ı gereklidir'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Yeni şifre en az 6 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir')
], asyncHandler(async (req, res) => {
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

  const { token, newPassword } = req.body;

  try {
    // Token'ı doğrula
    const { userId } = verifyPasswordResetToken(token);

    // Kullanıcıyı ve token'ı kontrol et
    const user = await database.get(
      'SELECT id, email, reset_token, reset_token_expires FROM users WHERE id = ? AND reset_token = ?',
      [userId, token]
    );

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Geçersiz reset token\'ı'
      };
      res.status(400).json(response);
      return;
    }

    // Token süresi dolmuş mu kontrol et
    if (user.reset_token_expires && new Date() > new Date(user.reset_token_expires)) {
      const response: ApiResponse = {
        success: false,
        error: 'Reset token\'ının süresi dolmuş'
      };
      res.status(400).json(response);
      return;
    }

    // Yeni şifreyi hashle
    const newPasswordHash = await hashPassword(newPassword);

    // Şifreyi güncelle ve token'ı temizle
    await database.run(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = datetime(\"now\") WHERE id = ?',
      [newPasswordHash, user.id]
    );

    logger.info(`Password reset completed: ${user.email}`, { userId: user.id });

    const response: ApiResponse = {
      success: true,
      message: 'Şifre başarıyla sıfırlandı'
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Reset password error: ${error.message}`);
    
    const response: ApiResponse = {
      success: false,
      error: 'Şifre sıfırlama işlemi sırasında bir hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Profil bilgilerini getir (authenticated)
 */
router.get('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!; // authenticate middleware'den geldiği için kesin var

  try {
    // Kullanıcı istatistiklerini al
    const stats = await database.all(`
      SELECT 
        (SELECT COUNT(*) FROM favorites WHERE user_id = ?) as favoriteCount,
        (SELECT COUNT(*) FROM subscriptions WHERE user_id = ? AND is_active = 1) as subscriptionCount,
        (SELECT COUNT(*) FROM comments WHERE user_id = ?) as commentCount
    `, [user.id, user.id, user.id]);

    const response: ApiResponse = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified
        },
        stats: stats[0] || { favoriteCount: 0, subscriptionCount: 0, commentCount: 0 }
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Profile fetch error: ${error.message}`, { userId: user.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Profil bilgileri alınırken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

/**
 * Profil güncelleme (authenticated)
 */
router.put('/profile', [
  authenticate,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Ad 2-50 karakter arasında olmalıdır'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Soyad 2-50 karakter arasında olmalıdır')
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
  const { firstName, lastName } = req.body;

  try {
    // Güncelleme alanlarını hazırla
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

    if (updates.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Güncellenecek alan bulunamadı'
      };
      res.status(400).json(response);
      return;
    }

    updates.push('updated_at = datetime(\"now\")');
    values.push(user.id);

    // Profili güncelle
    await database.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    logger.info(`Profile updated: ${user.email}`, { userId: user.id });

    const response: ApiResponse = {
      success: true,
      message: 'Profil başarıyla güncellendi'
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Profile update error: ${error.message}`, { userId: user.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Profil güncellenirken hata oluştu'
    };
    res.status(500).json(response);
  }
}));

export { router as authRoutes }; 