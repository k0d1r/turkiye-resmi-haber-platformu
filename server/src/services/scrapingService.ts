import axios from 'axios';
import * as cheerio from 'cheerio';
import { RobotsParser } from '../utils/robotsParser';
import { logger } from '../utils/logger';

export interface ScrapeResult {
  title: string;
  description?: string;
  url: string;
  publishedDate?: Date;
  author?: string;
  category?: string;
  success: boolean;
  error?: string;
}

export interface ScrapingConfig {
  userAgent: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  respectCrawlDelay: boolean;
  maxContentLength: number;
}

export class ScrapingService {
  private static defaultConfig: ScrapingConfig = {
    userAgent: 'TurkiyeResmiHaber-Bot/1.0 (+https://turkiyeresmihaber.com/robots)',
    timeout: 15000,
    maxRetries: 3,
    retryDelay: 2000,
    respectCrawlDelay: true,
    maxContentLength: 1024 * 1024 // 1MB
  };

  private static rateLimiter = new Map<string, number>();
  private static crawlDelays = new Map<string, number>();

  /**
   * Tek bir URL'yi scrape eder
   */
  static async scrapeUrl(
    url: string, 
    config: Partial<ScrapingConfig> = {}
  ): Promise<ScrapeResult> {
    const fullConfig = { ...this.defaultConfig, ...config };
    
    try {
      // URL geçerliliği kontrolü
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      logger.info(`Scraping başlatılıyor: ${url}`);
      
      // Robots.txt kontrolü
      const robotsCheck = await RobotsParser.canCrawl(url, fullConfig.userAgent);
      if (!robotsCheck.allowed) {
        logger.warn(`Robots.txt tarafından yasaklandı: ${url} - ${robotsCheck.reason}`);
        return {
          title: '',
          url,
          success: false,
          error: robotsCheck.reason || 'Robots.txt tarafından yasaklandı'
        };
      }

      // Rate limiting kontrolü
      if (fullConfig.respectCrawlDelay) {
        await this.respectRateLimit(domain, robotsCheck.crawlDelay);
      }

      // HTTP isteği gönder
      const html = await this.fetchWithRetry(url, fullConfig);
      
      // HTML parse et
      const result = this.parseHtml(html, url);
      
      logger.info(`Scraping tamamlandı: ${url} - ${result.title.substring(0, 50)}...`);
      return result;
      
    } catch (error: any) {
      logger.error(`Scraping hatası (${url}): ${error.message}`);
      return {
        title: '',
        url,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Birden fazla URL'yi batch olarak scrape eder
   */
  static async scrapeUrls(
    urls: string[], 
    config: Partial<ScrapingConfig> = {},
    concurrency: number = 2
  ): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    // URLs'leri domain'e göre grupla
    const urlsByDomain = this.groupUrlsByDomain(urls);
    
    // Her domain için sırayla işle (rate limiting için)
    for (const [domain, domainUrls] of urlsByDomain) {
      logger.info(`Domain scraping başlatılıyor: ${domain} (${domainUrls.length} URL)`);
      
      // Domain içinde concurrency ile işle
      for (let i = 0; i < domainUrls.length; i += concurrency) {
        const batch = domainUrls.slice(i, i + concurrency);
        const batchPromises = batch.map(url => this.scrapeUrl(url, config));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Batch'ler arası kısa bekleme
        if (i + concurrency < domainUrls.length) {
          await this.delay(1000);
        }
      }
    }
    
    return results;
  }

  /**
   * HTTP isteğini retry logic ile gönder
   */
  private static async fetchWithRetry(
    url: string, 
    config: ScrapingConfig
  ): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        logger.debug(`HTTP isteği (deneme ${attempt}/${config.maxRetries}): ${url}`);
        
        const response = await axios.get(url, {
          timeout: config.timeout,
          maxContentLength: config.maxContentLength,
          headers: {
            'User-Agent': config.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          validateStatus: (status) => status >= 200 && status < 400
        });

        if (typeof response.data !== 'string') {
          throw new Error('Response is not HTML content');
        }

        return response.data;
        
      } catch (error: any) {
        lastError = error;
        logger.warn(`HTTP isteği başarısız (deneme ${attempt}): ${error.message}`);
        
        if (attempt < config.maxRetries) {
          await this.delay(config.retryDelay * attempt);
        }
      }
    }
    
    throw lastError || new Error('Maximum retry attempts reached');
  }

  /**
   * HTML içeriğini parse eder
   */
  private static parseHtml(html: string, url: string): ScrapeResult {
    try {
      const $ = cheerio.load(html);
      
      // Title çekme (öncelik sırasına göre)
      let title = '';
      const titleSelectors = [
        'h1.title',
        'h1.entry-title', 
        'h1.post-title',
        'h1.article-title',
        '.page-title h1',
        '.content-title',
        'h1',
        'title'
      ];
      
      for (const selector of titleSelectors) {
        const element = $(selector).first();
        if (element.length && element.text().trim()) {
          title = element.text().trim();
          break;
        }
      }
      
      if (!title) {
        title = $('title').text().trim() || 'Başlık bulunamadı';
      }

      // Description çekme
      let description = '';
      const descriptionSelectors = [
        'meta[name="description"]',
        'meta[property="og:description"]',
        '.lead',
        '.summary',
        '.excerpt',
        '.entry-summary',
        'p'
      ];
      
      for (const selector of descriptionSelectors) {
        let element;
        if (selector.startsWith('meta')) {
          element = $(selector);
          if (element.length) {
            description = element.attr('content')?.trim() || '';
          }
        } else {
          element = $(selector).first();
          if (element.length && element.text().trim()) {
            description = element.text().trim();
            break;
          }
        }
        
        if (description) break;
      }
      
      // Description'ı temizle ve kısalt
      if (description) {
        description = description
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 500);
      }

      // Tarih çekme
      let publishedDate: Date | undefined;
      const dateSelectors = [
        'meta[property="article:published_time"]',
        'meta[name="publishdate"]',
        'time[datetime]',
        '.date',
        '.published'
      ];
      
      for (const selector of dateSelectors) {
        const element = $(selector).first();
        if (element.length) {
          let dateText = '';
          if (selector.startsWith('meta')) {
            dateText = element.attr('content') || '';
          } else if (selector === 'time[datetime]') {
            dateText = element.attr('datetime') || element.text().trim();
          } else {
            dateText = element.text().trim();
          }
          
          if (dateText) {
            const parsed = new Date(dateText);
            if (!isNaN(parsed.getTime())) {
              publishedDate = parsed;
              break;
            }
          }
        }
      }

      // Category çekme
      let category = '';
      const categorySelectors = [
        'meta[property="article:section"]',
        '.category',
        '.post-category',
        '.entry-category'
      ];
      
      for (const selector of categorySelectors) {
        const element = $(selector).first();
        if (element.length) {
          if (selector.startsWith('meta')) {
            category = element.attr('content')?.trim() || '';
          } else {
            category = element.text().trim();
          }
          if (category) break;
        }
      }

      return {
        title: this.cleanText(title),
        description: description ? this.cleanText(description) : undefined,
        url,
        publishedDate,
        category: category ? this.cleanText(category) : undefined,
        success: true
      };
      
    } catch (error: any) {
      logger.error(`HTML parse hatası: ${error.message}`);
      return {
        title: '',
        url,
        success: false,
        error: `HTML parse hatası: ${error.message}`
      };
    }
  }

  /**
   * Rate limiting uygula
   */
  private static async respectRateLimit(domain: string, crawlDelay: number): Promise<void> {
    const now = Date.now();
    const lastRequest = this.rateLimiter.get(domain) || 0;
    const minInterval = Math.max(crawlDelay * 1000, 1000); // En az 1 saniye
    
    const timeSinceLastRequest = now - lastRequest;
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      logger.debug(`Rate limiting: ${domain} için ${waitTime}ms bekleniyor`);
      await this.delay(waitTime);
    }
    
    this.rateLimiter.set(domain, Date.now());
  }

  /**
   * URLs'leri domain'e göre grupla
   */
  private static groupUrlsByDomain(urls: string[]): Map<string, string[]> {
    const grouped = new Map<string, string[]>();
    
    for (const url of urls) {
      try {
        const domain = new URL(url).hostname;
        if (!grouped.has(domain)) {
          grouped.set(domain, []);
        }
        grouped.get(domain)!.push(url);
      } catch (error) {
        logger.warn(`Geçersiz URL atlandı: ${url}`);
      }
    }
    
    return grouped;
  }

  /**
   * Metni temizle
   */
  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\n\r\t]/g, ' ')
      .trim();
  }

  /**
   * Bekle
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Rate limiter cache'i temizle
   */
  static clearRateLimitCache(): void {
    this.rateLimiter.clear();
    this.crawlDelays.clear();
    logger.info('Rate limiter cache temizlendi');
  }
} 