import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { database } from '../database/database';
import { logger } from '../utils/logger';

// JWT secret key (production'da environment variable'dan alınmalı)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
  };
}

export interface TokenPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT token oluştur
 */
export const generateToken = (userId: number, email: string): string => {
  const payload: TokenPayload = {
    userId,
    email
  };
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'turkiye-resmi-haber',
    audience: 'user'
  });
};

/**
 * JWT token'ı doğrula
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'turkiye-resmi-haber',
      audience: 'user'
    }) as TokenPayload;
    
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token süresi dolmuş');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Geçersiz token');
    } else {
      throw new Error('Token doğrulama hatası');
    }
  }
};

/**
 * Şifre hashleme
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Şifre doğrulama
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Authentication middleware - token'ı kontrol eder
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Yetkilendirme tokenı gerekli',
        code: 'NO_TOKEN'
      });
      return;
    }

    const token = authHeader.substring(7); // "Bearer " kısmını çıkar
    
    // Token'ı doğrula
    const decoded = verifyToken(token);
    
    // Kullanıcıyı veritabanından al
    const user = await database.get(
      'SELECT id, email, first_name, last_name, is_verified FROM users WHERE id = ? AND is_verified = 1',
      [decoded.userId]
    );
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Kullanıcı bulunamadı veya doğrulanmamış',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Request'e kullanıcı bilgilerini ekle
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isVerified: user.is_verified === 1
    };

    next();
    
  } catch (error: any) {
    logger.warn(`Authentication failed: ${error.message}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });
    
    res.status(401).json({
      success: false,
      error: error.message || 'Kimlik doğrulama başarısız',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Optional authentication middleware - token varsa doğrular, yoksa devam eder
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Token yok, ama devam et
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const user = await database.get(
      'SELECT id, email, first_name, last_name, is_verified FROM users WHERE id = ? AND is_verified = 1',
      [decoded.userId]
    );
    
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isVerified: user.is_verified === 1
      };
    }

    next();
    
  } catch (error) {
    // Token geçersiz ama optional olduğu için devam et
    next();
  }
};

/**
 * Admin authentication middleware
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Önce normal auth'u çalıştır
  await authenticate(req, res, () => {});
  
  if (!req.user) {
    return; // authenticate middleware zaten error döndü
  }

  try {
    // Admin rolü kontrolü (basit implementasyon - daha karmaşık role sistemi eklenebilir)
    const adminEmails = [
      'admin@turkiyeresmihaber.com',
      'superadmin@turkiyeresmihaber.com'
    ];
    
    if (!adminEmails.includes(req.user.email)) {
      res.status(403).json({
        success: false,
        error: 'Admin yetkisi gerekli',
        code: 'ADMIN_REQUIRED'
      });
      return;
    }

    next();
    
  } catch (error: any) {
    logger.error(`Admin auth error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Yetkilendirme kontrol hatası'
    });
  }
};

/**
 * Verification token oluştur
 */
export const generateVerificationToken = (): string => {
  return jwt.sign(
    { type: 'email_verification', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Password reset token oluştur
 */
export const generatePasswordResetToken = (userId: number): string => {
  return jwt.sign(
    { userId, type: 'password_reset', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

/**
 * Reset token'ı doğrula
 */
export const verifyPasswordResetToken = (token: string): { userId: number } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (decoded.type !== 'password_reset') {
      throw new Error('Geçersiz token tipi');
    }
    
    return { userId: decoded.userId };
  } catch (error: any) {
    throw new Error('Geçersiz veya süresi dolmuş reset token\'ı');
  }
}; 