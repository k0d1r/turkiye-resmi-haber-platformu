import { ScrapingService, ScrapeResult } from '../scrapingService';
import { logger } from '../../utils/logger';
import * as cheerio from 'cheerio';

export interface EPDKArticle {
  title: string;
  description?: string;
  url: string;
  publishedDate?: Date;
  category: string;
  sector?: string;
}

export class EPDKScraper {
  private static readonly BASE_URL = 'https://www.epdk.gov.tr';
  private static readonly ENDPOINTS = {
    announcements: '/Detay/Icerik/3-0-23-2/duyurular', // Duyurular
    press_releases: '/Detay/Icerik/3-0-94/basin-aciklamalari', // Basın Açıklamaları  
    decisions: '/Detay/Icerik/3-0-24-2/kararlar', // Kurul Kararları
    regulations: '/Detay/Icerik/3-0-17/mevzuat', // Mevzuat
    electricity: '/Detay/Icerik/3-0-25-3/elektrik', // Elektrik
    natural_gas: '/Detay/Icerik/3-0-26-4/dogalgaz', // Doğalgaz
    petroleum: '/Detay/Icerik/3-0-27-5/petrol' // Petrol
  };

  /**
   * EPDK'dan tüm kategorilerdeki son duyuruları çeker
   */
  static async scrapeAll(): Promise<ScrapeResult[]> {
    const results: ScrapeResult[] = [];
    
    logger.info('EPDK scraping başlatılıyor...');
    
    for (const [category, endpoint] of Object.entries(this.ENDPOINTS)) {
      try {
        logger.info(`EPDK ${category} kategorisi scraping ediliyor...`);
        const categoryResults = await this.scrapeCategory(category, endpoint);
        results.push(...categoryResults);
        
        // Kategoriler arası kısa bekleme
        await this.delay(2000);
        
      } catch (error: any) {
        logger.error(`EPDK ${category} scraping hatası: ${error.message}`);
      }
    }
    
    logger.info(`EPDK scraping tamamlandı. Toplam ${results.length} sonuç.`);
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
        logger.warn(`EPDK ${category} kategorisinde makale bulunamadı`);
        return results;
      }
      
      logger.info(`EPDK ${category} - ${articleUrls.length} makale bulundu`);
      
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
          logger.warn(`EPDK makale scraping hatası (${articleUrl}): ${error.message}`);
        }
      }
      
    } catch (error: any) {
      logger.error(`EPDK kategori scraping hatası (${category}): ${error.message}`);
    }
    
    return results;
  }

  /**
   * Liste sayfasından makale URL'lerini çıkarır
   */
  private static async extractArticleUrls(listUrl: string): Promise<string[]> {
    try {
      const html = await this.fetchHtml(listUrl);
      const $ = cheerio.load(html);
      
      const urls: string[] = [];
      
      // EPDK sitesinde makale linklerini bul
      // Bu selector'lar EPDK sitesinin yapısına göre ayarlanmalı
      const linkSelectors = [
        '.content-list .list-item a',
        '.news-list .news-item a',
        '.document-list .document-item a',
        'table.table tbody tr td a',
        '.row .col a[href*="/Detay/"]',
        'a[href*="/Detay/Icerik/"]'
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
            
            // EPDK detay sayfalarını filtrele
            if (fullUrl.includes(this.BASE_URL) && 
                fullUrl.includes('/Detay/') && 
                !urls.includes(fullUrl)) {
              urls.push(fullUrl);
            }
          }
        });
        
        if (urls.length > 0) break; // İlk eşleşen selector'ı kullan
      }
      
      return urls;
      
    } catch (error: any) {
      logger.error(`EPDK URL extraction hatası: ${error.message}`);
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
      
      // Başlık çekme (EPDK sitesine özel)
      let title = '';
      const titleSelectors = [
        '.page-header h1',
        '.content-header h1',
        '.detail-title',
        'h1.title',
        '.main-content h1',
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
        title = $('title').text().replace('EPDK', '').replace('|', '').trim() || 'Başlık bulunamadı';
      }

      // İçerik/açıklama çekme
      let description = '';
      const contentSelectors = [
        '.detail-content',
        '.content-body',
        '.main-content .content',
        '.article-content',
        '.news-content',
        '.page-content p'
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
        '.detail-date',
        '.publish-date',
        '.content-date',
        '.date-info',
        'time',
        '.created-date'
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

      // Sektör belirleme
      let sector = 'energy';
      if (url.includes('elektrik') || title.toLowerCase().includes('elektrik')) {
        sector = 'electricity';
      } else if (url.includes('dogalgaz') || title.toLowerCase().includes('doğalgaz')) {
        sector = 'natural_gas';
      } else if (url.includes('petrol') || title.toLowerCase().includes('petrol')) {
        sector = 'petroleum';
      } else if (title.toLowerCase().includes('karar')) {
        sector = 'decision';
      }

      // Kategori belirleme
      let articleCategory = 'regulatory';
      if (category.includes('announcement')) {
        articleCategory = 'announcement';
      } else if (category.includes('press')) {
        articleCategory = 'announcement';
      } else if (category.includes('decision')) {
        articleCategory = 'legal';
      } else if (category.includes('regulation')) {
        articleCategory = 'legal';
      }

      return {
        title: this.cleanText(title),
        description: description ? this.cleanText(description) : undefined,
        url,
        publishedDate,
        category: articleCategory,
        success: true
      };
      
    } catch (error: any) {
      logger.error(`EPDK makale parse hatası (${url}): ${error.message}`);
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
        'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11,
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
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
      
      // "15.03.2024" formatı
      const numericDateRegex = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;
      const numericMatch = dateText.match(numericDateRegex);
      
      if (numericMatch) {
        const [, day, month, year] = numericMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
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
      .replace(/EPDK\s*[-–—]\s*/gi, '')
      .replace(/Enerji Piyasası Düzenleme Kurumu\s*[-–—]\s*/gi, '')
      .trim();
  }

  /**
   * Bekle
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 