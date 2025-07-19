import axios from 'axios';
import * as feedparser from 'feedparser';
import { Readable } from 'stream';
import crypto from 'crypto';
import { database } from '../database/database';
import { logger } from '../utils/logger';
import { Source, Article, RSSItem, RSSFeed } from '../types/types';

export class RSSService {
  private readonly userAgent = 'Turkiye-Resmi-Haber-Bot/1.0 (+https://turkiyeresmihaber.com)';
  private readonly timeout = 30000; // 30 saniye

  /**
   * Tüm aktif RSS kaynaklarını çek
   */
  async fetchAllRSSFeeds(): Promise<void> {
    try {
      logger.info('Starting RSS feed fetch for all sources...');
      
      const sources = await database.all(`
        SELECT * FROM sources 
        WHERE category = 'rss' AND status = 'active' AND rss_url IS NOT NULL
      `);

      logger.info(`Found ${sources.length} RSS sources to process`);

      for (const source of sources) {
        try {
          await this.fetchRSSFeed(source);
          await this.updateSourceLastFetched(source.id);
        } catch (error) {
          logger.error(`Failed to fetch RSS for ${source.name}:`, error);
          await this.updateSourceStatus(source.id, 'error');
        }
      }

      logger.info('Completed RSS feed fetch for all sources');
    } catch (error) {
      logger.error('Error in fetchAllRSSFeeds:', error);
      throw error;
    }
  }

  /**
   * Tek bir RSS kaynağını çek
   */
  async fetchRSSFeed(source: Source): Promise<Article[]> {
    try {
      logger.info(`Fetching RSS feed from ${source.name}: ${source.rssUrl}`);

      if (!source.rssUrl) {
        throw new Error('RSS URL is not defined for this source');
      }

      // RSS feed'i çek
      const response = await axios.get(source.rssUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        timeout: this.timeout,
        maxRedirects: 3
      });

      // Feed'i parse et
      const feed = await this.parseRSSFeed(response.data);
      
      // Yeni makaleleri veritabanına kaydet
      const savedArticles = await this.saveArticlesToDatabase(source, feed.items);
      
      logger.info(`Successfully processed ${savedArticles.length} new articles from ${source.name}`);
      
      return savedArticles;
    } catch (error) {
      logger.error(`Error fetching RSS feed for ${source.name}:`, error);
      throw error;
    }
  }

  /**
   * RSS XML'ini parse et
   */
  private async parseRSSFeed(xmlContent: string): Promise<RSSFeed> {
    return new Promise((resolve, reject) => {
      const items: RSSItem[] = [];
      const feedInfo: Partial<RSSFeed> = {};

      const feedParser = new feedparser({
        normalize: true,
        addmeta: false
      });

      feedParser.on('error', reject);

      feedParser.on('readable', function() {
        const stream = this as any;
        
        if (!feedInfo.title && stream.meta) {
          feedInfo.title = stream.meta.title || '';
          feedInfo.description = stream.meta.description || '';
          feedInfo.link = stream.meta.link || '';
        }

        let item;
        while (item = stream.read()) {
          items.push({
            title: item.title || '',
            description: item.description || item.summary || '',
            link: item.link || '',
            pubDate: item.pubdate || item.date || new Date().toISOString(),
            author: item.author || '',
            categories: item.categories || [],
            content: item['content:encoded'] || item.description || '',
            guid: item.guid || item.link || ''
          });
        }
      });

      feedParser.on('end', () => {
        resolve({
          title: feedInfo.title || '',
          description: feedInfo.description || '',
          link: feedInfo.link || '',
          items
        });
      });

      // XML'i stream olarak feedparser'a gönder
      const stream = new Readable();
      stream.push(xmlContent);
      stream.push(null);
      stream.pipe(feedParser);
    });
  }

  /**
   * Makaleleri veritabanına kaydet
   */
  private async saveArticlesToDatabase(source: Source, items: RSSItem[]): Promise<Article[]> {
    const savedArticles: Article[] = [];

    for (const item of items) {
      try {
        // Duplicate kontrolü için hash oluştur
        const hash = this.generateArticleHash(item.title, item.link);
        
        // Zaten var mı kontrol et
        const existing = await database.get(
          'SELECT id FROM articles WHERE hash = ?',
          [hash]
        );

        if (existing) {
          continue; // Zaten var, atla
        }

        // Yeni makaleyi kaydet
        const result = await database.run(`
          INSERT INTO articles (
            source_id, title, description, content, url, author, 
            published_date, hash, category, tags, language
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          source.id,
          item.title.trim(),
          item.description?.trim() || null,
          item.content?.trim() || null,
          item.link,
          item.author?.trim() || null,
          item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          hash,
          this.categorizeArticle(item.title, item.description),
          JSON.stringify(item.categories || []),
          'tr'
        ]);

        if (result.lastID) {
          const savedArticle = await database.get(
            'SELECT * FROM articles WHERE id = ?',
            [result.lastID]
          );
          
          if (savedArticle) {
            savedArticles.push(this.mapDatabaseRowToArticle(savedArticle));
          }
        }
      } catch (error) {
        logger.error(`Error saving article "${item.title}":`, error);
      }
    }

    return savedArticles;
  }

  /**
   * Makale kategorisini otomatik belirle
   */
  private categorizeArticle(title: string, description?: string): string {
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    if (text.includes('duyuru') || text.includes('announcement')) {
      return 'announcement';
    }
    if (text.includes('kanun') || text.includes('yönetmelik') || text.includes('tebliğ') || text.includes('genelge')) {
      return 'regulation';
    }
    if (text.includes('faiz') || text.includes('kur') || text.includes('ekonomi') || text.includes('finansal')) {
      return 'financial';
    }
    if (text.includes('teknoloji') || text.includes('ar-ge') || text.includes('inovasyon')) {
      return 'technology';
    }
    if (text.includes('hukuk') || text.includes('mevzuat') || text.includes('yasal')) {
      return 'legal';
    }
    
    return 'other';
  }

  /**
   * Makale hash'i oluştur (duplicate kontrolü için)
   */
  private generateArticleHash(title: string, url: string): string {
    return crypto
      .createHash('sha256')
      .update(title + '|' + url)
      .digest('hex');
  }

  /**
   * Veritabanı satırını Article tipine dönüştür
   */
  private mapDatabaseRowToArticle(row: any): Article {
    return {
      id: row.id,
      sourceId: row.source_id,
      title: row.title,
      description: row.description,
      content: row.content,
      summary: row.summary,
      url: row.url,
      author: row.author,
      publishedDate: row.published_date,
      fetchedDate: row.fetched_date,
      hash: row.hash,
      category: row.category,
      tags: row.tags ? JSON.parse(row.tags) : [],
      language: row.language,
      viewCount: row.view_count,
      isFeatured: Boolean(row.is_featured),
      metadata: row.metadata ? JSON.parse(row.metadata) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Kaynak son çekilme tarihini güncelle
   */
  private async updateSourceLastFetched(sourceId: number): Promise<void> {
    await database.run(
      'UPDATE sources SET last_fetched = ?, status = ? WHERE id = ?',
      [new Date().toISOString(), 'active', sourceId]
    );
  }

  /**
   * Kaynak durumunu güncelle
   */
  private async updateSourceStatus(sourceId: number, status: string): Promise<void> {
    await database.run(
      'UPDATE sources SET status = ? WHERE id = ?',
      [status, sourceId]
    );
  }

  /**
   * Belirli bir kaynağın son makalelerini getir
   */
  async getArticlesBySource(sourceId: number, limit: number = 20): Promise<Article[]> {
    const rows = await database.all(`
      SELECT a.*, s.name as source_name, s.icon_url as source_icon
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      WHERE a.source_id = ?
      ORDER BY a.published_date DESC, a.created_at DESC
      LIMIT ?
    `, [sourceId, limit]);

    return rows.map(row => ({
      ...this.mapDatabaseRowToArticle(row),
      source: {
        id: sourceId,
        name: row.source_name,
        iconUrl: row.source_icon
      } as any
    }));
  }

  /**
   * En son makaleleri getir
   */
  async getLatestArticles(limit: number = 50): Promise<Article[]> {
    const rows = await database.all(`
      SELECT a.*, s.name as source_name, s.icon_url as source_icon
      FROM articles a
      LEFT JOIN sources s ON a.source_id = s.id
      ORDER BY a.published_date DESC, a.created_at DESC
      LIMIT ?
    `, [limit]);

    return rows.map(row => ({
      ...this.mapDatabaseRowToArticle(row),
      source: {
        id: row.source_id,
        name: row.source_name,
        iconUrl: row.source_icon
      } as any
    }));
  }
}

// Singleton instance
export const rssService = new RSSService(); 