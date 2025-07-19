import cron from 'node-cron';
import { rssService } from './rssService';
import { SPKScraper } from './scrapers/spkScraper';
import { EPDKScraper } from './scrapers/epdkScraper';
import { ScrapingService } from './scrapingService';
import { logger } from '../utils/logger';
import { database } from '../database/database';

export class Scheduler {
  private static tasks: cron.ScheduledTask[] = [];
  private static isRunning = false;

  static start() {
    if (this.isRunning) {
      logger.warn('Scheduler zaten çalışıyor');
      return;
    }

    logger.info('Scheduler başlatılıyor...');
    this.isRunning = true;

    // RSS feedlerini her 30 dakikada bir kontrol et
    const rssTask = cron.schedule('*/30 * * * *', async () => {
      logger.info('RSS feedleri güncelleniyor...');
      try {
        await rssService.fetchAllRSSFeeds();
        logger.info('RSS feedleri başarıyla güncellendi');
      } catch (error: any) {
        logger.error(`RSS güncelleme hatası: ${error.message}`);
      }
    }, {
      scheduled: false,
      timezone: 'Europe/Istanbul'
    });

    // SPK scraping - her 2 saatte bir
    const spkTask = cron.schedule('0 */2 * * *', async () => {
      logger.info('SPK scraping başlatılıyor...');
      try {
        const results = await SPKScraper.scrapeAll();
        await this.saveScrapingResults(results, 'SPK');
        logger.info(`SPK scraping tamamlandı: ${results.length} sonuç`);
      } catch (error: any) {
        logger.error(`SPK scraping hatası: ${error.message}`);
      }
    }, {
      scheduled: false,
      timezone: 'Europe/Istanbul'
    });

    // EPDK scraping - her 3 saatte bir
    const epdkTask = cron.schedule('0 */3 * * *', async () => {
      logger.info('EPDK scraping başlatılıyor...');
      try {
        const results = await EPDKScraper.scrapeAll();
        await this.saveScrapingResults(results, 'EPDK');
        logger.info(`EPDK scraping tamamlandı: ${results.length} sonuç`);
      } catch (error: any) {
        logger.error(`EPDK scraping hatası: ${error.message}`);
      }
    }, {
      scheduled: false,
      timezone: 'Europe/Istanbul'
    });

    // Rate limiter cache temizleme - günde bir kez
    const cleanupTask = cron.schedule('0 2 * * *', async () => {
      logger.info('Cache temizliği başlatılıyor...');
      try {
        ScrapingService.clearRateLimitCache();
        await this.cleanupOldArticles();
        logger.info('Cache temizliği tamamlandı');
      } catch (error: any) {
        logger.error(`Cache temizlik hatası: ${error.message}`);
      }
    }, {
      scheduled: false,
      timezone: 'Europe/Istanbul'
    });

    // Manuel test için - her 5 dakikada bir (development için)
    const testTask = cron.schedule('*/5 * * * *', async () => {
      if (process.env.NODE_ENV === 'development') {
        logger.info('Test scraping başlatılıyor...');
        try {
          // Sadece birkaç URL test et
          const testUrls = [
            'https://www.spk.gov.tr/Sayfa/Dosya/1504', // SPK duyurular
            'https://www.epdk.gov.tr/Detay/Icerik/3-0-23-2/duyurular' // EPDK duyurular
          ];
          
          const results = await ScrapingService.scrapeUrls(testUrls.slice(0, 1)); // Sadece 1 URL test
          logger.info(`Test scraping: ${results.length} sonuç, ${results.filter(r => r.success).length} başarılı`);
        } catch (error: any) {
          logger.error(`Test scraping hatası: ${error.message}`);
        }
      }
    }, {
      scheduled: false,
      timezone: 'Europe/Istanbul'
    });

    // Task'ları kaydet ve başlat
    this.tasks = [rssTask, spkTask, epdkTask, cleanupTask];
    
    // Development mode'da test task'ı da ekle
    if (process.env.NODE_ENV === 'development') {
      this.tasks.push(testTask);
    }

    // Tüm task'ları başlat
    this.tasks.forEach(task => task.start());

    logger.info(`${this.tasks.length} scheduled task başlatıldı`);

    // İlk çalıştırmayı hemen yap
    setTimeout(async () => {
            logger.info('İlk RSS güncelleme başlatılıyor...');
       try {
         await rssService.fetchAllRSSFeeds();
      } catch (error: any) {
        logger.error(`İlk RSS güncelleme hatası: ${error.message}`);
      }
    }, 5000); // 5 saniye sonra başlat
  }

  static stop() {
    if (!this.isRunning) {
      logger.warn('Scheduler zaten durmuş');
      return;
    }

    logger.info('Scheduler durduruluyor...');
    
    this.tasks.forEach(task => {
      if (task) {
        task.stop();
      }
    });
    
    this.tasks = [];
    this.isRunning = false;
    
    logger.info('Scheduler durduruldu');
  }

  /**
   * Scraping sonuçlarını veritabanına kaydet
   */
  private static async saveScrapingResults(results: any[], sourceName: string): Promise<void> {
    let savedCount = 0;
    let errorCount = 0;

    for (const result of results) {
      try {
        if (!result.success || !result.title) {
          errorCount++;
          continue;
        }

        // Source ID'yi bul
        const sourceQuery = `
          SELECT id FROM sources 
          WHERE name LIKE ? OR baseUrl LIKE ?
          LIMIT 1
        `;
        const sourceResult = await database.get(sourceQuery, [`%${sourceName}%`, `%${sourceName.toLowerCase()}%`]);
        
        if (!sourceResult) {
          logger.warn(`Kaynak bulunamadı: ${sourceName}`);
          errorCount++;
          continue;
        }

        // Duplicate kontrolü
        const existingQuery = `
          SELECT id FROM articles 
          WHERE url = ? OR (title = ? AND sourceId = ?)
          LIMIT 1
        `;
        const existing = await database.get(existingQuery, [result.url, result.title, sourceResult.id]);
        
        if (existing) {
          continue; // Duplicate, atla
        }

        // Article'ı kaydet
        const insertQuery = `
          INSERT INTO articles (
            title, description, url, sourceId, category, 
            publishedDate, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;
        
        await database.run(insertQuery, [
          result.title,
          result.description || null,
          result.url,
          sourceResult.id,
          result.category || 'other',
          result.publishedDate ? result.publishedDate.toISOString() : null
        ]);

        savedCount++;

      } catch (error: any) {
        logger.error(`Article kaydetme hatası: ${error.message}`);
        errorCount++;
      }
    }

    logger.info(`${sourceName} scraping sonuçları: ${savedCount} kaydedildi, ${errorCount} hata`);
  }

  /**
   * Eski article'ları temizle (90 gün öncesi)
   */
  private static async cleanupOldArticles(): Promise<void> {
    try {
      const query = `
        DELETE FROM articles 
        WHERE createdAt < datetime('now', '-90 days')
      `;
      
      const result = await database.run(query);
      logger.info(`${result.changes || 0} eski article temizlendi`);
      
    } catch (error: any) {
      logger.error(`Article temizlik hatası: ${error.message}`);
    }
  }

  /**
   * Scheduler durumunu kontrol et
   */
  static getStatus(): {
    isRunning: boolean;
    taskCount: number;
    nextRuns: string[];
  } {
    const nextRuns = this.tasks.map((task, index) => {
      try {
        return `Task ${index + 1}: ${task.getStatus()}`;
      } catch {
        return `Task ${index + 1}: Bilinmeyen durum`;
      }
    });

    return {
      isRunning: this.isRunning,
      taskCount: this.tasks.length,
      nextRuns
    };
  }

  /**
   * Manuel RSS güncelleme
   */
  static async runRSSUpdate(): Promise<{ success: boolean; message: string }> {
    try {
      logger.info('Manuel RSS güncelleme başlatılıyor...');
      await rssService.fetchAllRSSFeeds();
      return { success: true, message: 'RSS feed\'leri başarıyla güncellendi' };
    } catch (error: any) {
      logger.error(`Manuel RSS güncelleme hatası: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  /**
   * Manuel scraping
   */
  static async runManualScraping(sources: string[] = ['SPK', 'EPDK']): Promise<{ 
    success: boolean; 
    message: string; 
    results: any[] 
  }> {
    try {
      logger.info(`Manuel scraping başlatılıyor: ${sources.join(', ')}`);
      const allResults: any[] = [];

      for (const source of sources) {
        try {
          let results: any[] = [];
          
          if (source.toUpperCase() === 'SPK') {
            results = await SPKScraper.scrapeAll();
          } else if (source.toUpperCase() === 'EPDK') {
            results = await EPDKScraper.scrapeAll();
          }

          if (results.length > 0) {
            await this.saveScrapingResults(results, source);
            allResults.push(...results);
          }

        } catch (error: any) {
          logger.error(`${source} scraping hatası: ${error.message}`);
        }
      }

      return { 
        success: true, 
        message: `${allResults.length} sonuç scrape edildi`,
        results: allResults 
      };
      
    } catch (error: any) {
      logger.error(`Manuel scraping hatası: ${error.message}`);
      return { 
        success: false, 
        message: error.message,
        results: [] 
      };
    }
  }
} 