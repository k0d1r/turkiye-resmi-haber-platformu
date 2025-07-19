import { ScrapingService, ScrapeResult } from '../scrapingService';
import { logger } from '../../utils/logger';
import * as cheerio from 'cheerio';

export interface SPKArticle {
  title: string;
  description?: string;
  url: string;
  publishedDate?: Date;
  category: string;
  documentType?: string;
}

export class SPKScraper {
  private static readonly BASE_URL = 'https://www.spk.gov.tr';
  private static readonly ENDPOINTS = {
    announcements: '/Sayfa/Dosya/1504', // Duyurular
    press_releases: '/Sayfa/Dosya/1501', // Basın Açıklamaları
    regulations: '/Sayfa/Dosya/1502', // Düzenlemeler
    decisions: '/Sayfa/Dosya/1503', // Kurul Kararları
    weekly_bulletins: '/Sayfa/Dosya/1505' // Haftalık Bültenler
  };

  /**
   * SPK'dan tüm kategorilerdeki son duyuruları çeker
   */
  static async scrapeAll(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    logger.info('SPK scraping başlatılıyor...');
    
    for (const [category, endpoint] of Object.entries(this.ENDPOINTS)) {
      try {
        logger.info(`SPK ${category} kategorisi scraping ediliyor...`);
        const categoryResults = await this.scrapeCategory(category, endpoint);
        results.push(...categoryResults);
        
        // Kategoriler arası kısa bekleme
        await this.delay(2000);
        
      } catch (error: any) {
        logger.error(`SPK ${category} scraping hatası: ${error.message}`);
      }
    }
    
    logger.info(`SPK scraping tamamlandı. Toplam ${results.length} sonuç.`);
    return results;
  }

  /**
   * Belirli bir kategoriyi scrape eder
   */
  private static async scrapeCategory(category: string, endpoint: string): Promise<ScrapeResult[]> {
    const url = this.BASE_URL + endpoint;
    const results: ScrapeResult[] = [];
    
    try {
      // Ana sayfa listesini al
      const listResult = await ScrapingService.scrapeUrl(url, {
        userAgent: 'TurkiyeResmiHaber-Bot/1.0 (+https://turkiyeresmihaber.com/robots)'
      });
      
      if (!listResult.success) {
        throw new Error(listResult.error || 'Liste sayfası yüklenemedi');
      }
      
      // Liste sayfasından article URL'lerini çıkar
      const articleUrls = await this.extractArticleUrls(url);
      
      if (articleUrls.length === 0) {
        logger.warn(`SPK ${category} kategorisinde makale bulunamadı`);
        return results;
      }
      
      logger.info(`SPK ${category} - ${articleUrls.length} makale bulundu`);
      
      // Her artikel için detay scraping yap (ilk 10 tanesi)
      const limitedUrls = articleUrls.slice(0, 10);
      for (const articleUrl of limitedUrls) {
        try {
          const articleResult = await this.scrapeArticle(articleUrl, category);
          if (articleResult.success) {
            results.push(articleResult);
          }
          
          // Makaleler arası kısa bekleme
          await this.delay(1500);
          
        } catch (error: any) {
          logger.warn(`SPK makale scraping hatası (${articleUrl}): ${error.message}`);
        }
      }
      
    } catch (error: any) {
      logger.error(`SPK kategori scraping hatası (${category}): ${error.message}`);
    }
    
    return results;
  }

  /**
   * Liste sayfasından makale URL'lerini çıkarır
   */
  private static async extractArticleUrls(listUrl: string): Promise<string[]> {
    try {
      const result = await ScrapingService.scrapeUrl(listUrl);
      if (!result.success) {
        return [];
      }

      // Bu metod ScrapingService'den HTML almak için kullanılıyor
      // Gerçek implementasyonda response.data'dan HTML alınacak
      const html = await this.fetchHtml(listUrl);
      const $ = cheerio.load(html);
      
      const urls: string[] = [];
      
      // SPK sitesinde makale linklerini bul
      // Bu selector'lar SPK sitesinin yapısına göre ayarlanmalı
      const linkSelectors = [
        '.item-list .views-row a',
        '.content-list a',
        '.document-list a',
        'table tbody tr td a',
        '.list-group-item a'
      ];
      
      for (const selector of linkSelectors) {
        $(selector).each((_, element) => {
          const href = $(element).attr('href');
          if (href) {
            let fullUrl = href;
            if (href.startsWith('/')) {
              fullUrl = this.BASE_URL + href;
            } else if (!href.startsWith('http')) {
              fullUrl = this.BASE_URL + '/' + href;
            }
            
            if (fullUrl.includes(this.BASE_URL) && !urls.includes(fullUrl)) {
              urls.push(fullUrl);
            }
          }
        });
        
        if (urls.length > 0) break; // İlk eşleşen selector'ı kullan
      }
      
      return urls;
      
    } catch (error: any) {
      logger.error(`SPK URL extraction hatası: ${error.message}`);
      return [];
    }
  }

  /**
   * Tek bir makaleyi scrape eder
   */
  private static async scrapeArticle(url: string, category: string): Promise<ScrapeResult> {
    try {
      const html = await this.fetchHtml(url);
      const $ = cheerio.load(html);
      
      // Başlık çekme (SPK sitesine özel)
      let title = '';
      const titleSelectors = [
        '.page-title',
        '.content-title',
        'h1.title',
        '.field-name-title h1',
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
        title = $('title').text().replace('SPK', '').trim() || 'Başlık bulunamadı';
      }

      // İçerik/açıklama çekme
      let description = '';
      const contentSelectors = [
        '.field-name-body .field-item',
        '.content-body',
        '.article-content',
        '.field-type-text-with-summary',
        '.node-content p'
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length && element.text().trim()) {
          description = element.text().trim();
          break;
        }
      }
      
      // Açıklamayı temizle ve kısalt
      if (description) {
        description = description
          .replace(/\s+/g, ' ')
          .replace(/[\n\r\t]/g, ' ')
          .trim()
          .substring(0, 500);
      }

      // Tarih çekme
      let publishedDate: Date | undefined;
      const dateSelectors = [
        '.field-name-post-date',
        '.submitted',
        '.date-display-single',
        '.publication-date',
        'time'
      ];
      
      for (const selector of dateSelectors) {
        const element = $(selector).first();
        if (element.length) {
          const dateText = element.text().trim();
          if (dateText) {
            // Türkçe tarih formatlarını parse et
            const parsed = this.parseTurkishDate(dateText);
            if (parsed) {
              publishedDate = parsed;
              break;
            }
          }
        }
      }

      // Doküman tipi belirleme
      let documentType = 'announcement';
      if (title.toLowerCase().includes('basın')) {
        documentType = 'press_release';
      } else if (title.toLowerCase().includes('düzenleme') || title.toLowerCase().includes('tebliğ')) {
        documentType = 'regulation';
      } else if (title.toLowerCase().includes('karar')) {
        documentType = 'decision';
      } else if (title.toLowerCase().includes('bülten')) {
        documentType = 'bulletin';
      }

      return {
        title: this.cleanText(title),
        description: description ? this.cleanText(description) : undefined,
        url,
        publishedDate,
        category: 'financial',
        success: true
      };
      
    } catch (error: any) {
      logger.error(`SPK makale parse hatası (${url}): ${error.message}`);
      return {
        title: '',
        url,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * HTML içeriğini fetch eder
   */
  private static async fetchHtml(url: string): Promise<string> {
    // Bu gerçek implementasyonda ScrapingService.fetchWithRetry kullanılmalı
    // Şimdilik placeholder
    const result = await ScrapingService.scrapeUrl(url);
    if (!result.success) {
      throw new Error(result.error || 'HTML fetch failed');
    }
    
    // ScrapingService'den HTML içeriğini almak için ek bir method gerekebilir
    // Bu sadece concept için placeholder
    return '<html></html>';
  }

  /**
   * Türkçe tarih formatlarını parse eder
   */
  private static parseTurkishDate(dateText: string): Date | null {
    try {
      // Türkçe ay isimleri mapping
      const turkishMonths: { [key: string]: number } = {
        'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
        'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
      };
      
      // "15 Mart 2024" formatı
      const turkishDateRegex = /(\d{1,2})\s+(\w+)\s+(\d{4})/i;
      const match = dateText.match(turkishDateRegex);
      
      if (match) {
        const [, day, monthName, year] = match;
        const monthIndex = turkishMonths[monthName.toLowerCase()];
        
        if (monthIndex !== undefined) {
          return new Date(parseInt(year), monthIndex, parseInt(day));
        }
      }
      
      // Standard formatları dene
      const standardDate = new Date(dateText);
      if (!isNaN(standardDate.getTime())) {
        return standardDate;
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Metni temizle
   */
  private static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\n\r\t]/g, ' ')
      .replace(/SPK\s*[-–—]\s*/gi, '')
      .trim();
  }

  /**
   * Bekle
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 