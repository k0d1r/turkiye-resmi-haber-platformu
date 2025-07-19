import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * Genel API rate limiting
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına maksimum 100 istek
  message: {
    error: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} - ${req.method} ${req.path}`);
    res.status(429).json({
      error: 'Çok fazla istek gönderildi. Lütfen 15 dakika sonra tekrar deneyin.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60
    });
  }
});

/**
 * Scraping API için sıkı rate limiting
 */
export const scrapingRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 10, // IP başına maksimum 10 scraping isteği
  message: {
    error: 'Scraping işlemleri için çok fazla istek. Lütfen 1 saat sonra tekrar deneyin.',
    code: 'SCRAPING_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Scraping rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Scraping işlemleri için çok fazla istek. Lütfen 1 saat sonra tekrar deneyin.',
      code: 'SCRAPING_RATE_LIMIT_EXCEEDED',
      retryAfter: 60 * 60
    });
  }
});

/**
 * API key veya admin için daha gevşek rate limiting
 */
export const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 1000, // Çok daha yüksek limit
  message: {
    error: 'Admin rate limit aşıldı.',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * RSS feed endpoints için özel rate limiting
 */
export const rssRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 dakika
  max: 30, // IP başına maksimum 30 RSS isteği
  message: {
    error: 'RSS feed istekleri için rate limit aşıldı.',
    code: 'RSS_RATE_LIMIT_EXCEEDED',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Search endpoints için rate limiting
 */
export const searchRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 dakika
  max: 50, // IP başına maksimum 50 arama isteği
  message: {
    error: 'Arama istekleri için rate limit aşıldı.',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED',
    retryAfter: 10 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Contact form için rate limiting
 */
export const contactRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 5, // IP başına maksimum 5 iletişim formu
  message: {
    error: 'İletişim formu için çok fazla istek. Lütfen 1 saat sonra tekrar deneyin.',
    code: 'CONTACT_RATE_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Contact form rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'İletişim formu için çok fazla istek. Lütfen 1 saat sonra tekrar deneyin.',
      code: 'CONTACT_RATE_LIMIT_EXCEEDED',
      retryAfter: 60 * 60
    });
  }
});

/**
 * Rate limit middleware'lerini route'lara göre uygulayan yardımcı fonksiyon
 */
export const applyRateLimits = (app: any) => {
  // Genel rate limit - tüm isteklere uygulanır
  app.use(generalRateLimit);

  // Specific route rate limits
  app.use('/api/scraping', scrapingRateLimit);
  app.use('/api/rss', rssRateLimit);
  app.use('/api/articles/search', searchRateLimit);
  app.use('/api/contact', contactRateLimit);
  
  // Admin routes için daha gevşek limit
  app.use('/api/admin', adminRateLimit);

  logger.info('Rate limiting middleware uygulandı');
};

/**
 * Custom rate limiting - domain bazlı
 */
export class DomainRateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  private static readonly WINDOW_MS = 60 * 1000; // 1 dakika
  private static readonly MAX_REQUESTS = 30; // Dakikada maksimum 30 istek

  static isAllowed(domain: string): boolean {
    const now = Date.now();
    const domainData = this.requests.get(domain);

    if (!domainData || now > domainData.resetTime) {
      // Yeni window veya süresi dolmuş
      this.requests.set(domain, {
        count: 1,
        resetTime: now + this.WINDOW_MS
      });
      return true;
    }

    if (domainData.count >= this.MAX_REQUESTS) {
      logger.warn(`Domain rate limit exceeded: ${domain}`);
      return false;
    }

    // Count'u artır
    domainData.count++;
    return true;
  }

  static getRemainingRequests(domain: string): number {
    const domainData = this.requests.get(domain);
    if (!domainData || Date.now() > domainData.resetTime) {
      return this.MAX_REQUESTS;
    }
    return Math.max(0, this.MAX_REQUESTS - domainData.count);
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [domain, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(domain);
      }
    }
  }

  static getStats(): { [domain: string]: { count: number; remaining: number } } {
    const stats: { [domain: string]: { count: number; remaining: number } } = {};
    const now = Date.now();

    for (const [domain, data] of this.requests.entries()) {
      if (now <= data.resetTime) {
        stats[domain] = {
          count: data.count,
          remaining: Math.max(0, this.MAX_REQUESTS - data.count)
        };
      }
    }

    return stats;
  }
} 