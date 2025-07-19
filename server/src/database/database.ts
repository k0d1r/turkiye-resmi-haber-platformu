import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

class Database {
  private db: sqlite3.Database | null = null;
  private isInitialized = false;

  constructor() {
    sqlite3.verbose();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database.sqlite');
      
      // Veritabanı dizinini oluştur
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error('Error opening database:', err);
          throw err;
        }
        logger.info(`Connected to SQLite database at ${dbPath}`);
      });

      // Promise wrapper'ları oluştur
      this.run = promisify(this.db.run.bind(this.db));
      this.get = promisify(this.db.get.bind(this.db));
      this.all = promisify(this.db.all.bind(this.db));

      // Schema'yı yükle
      await this.loadSchema();
      
      // Başlangıç verilerini yükle
      await this.loadInitialData();

      this.isInitialized = true;
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async loadSchema(): Promise<void> {
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // SQL komutlarını ayır ve çalıştır
      const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        await this.run(statement);
      }
      
      logger.info('Database schema loaded successfully');
    } catch (error) {
      logger.error('Failed to load database schema:', error);
      throw error;
    }
  }

  private async loadInitialData(): Promise<void> {
    try {
      // Varsayılan kaynakları kontrol et ve ekle
      const existingSources = await this.all('SELECT COUNT(*) as count FROM sources');
      
      if (existingSources[0].count === 0) {
        logger.info('Loading initial data sources...');
        await this.insertInitialSources();
      }
    } catch (error) {
      logger.error('Failed to load initial data:', error);
      throw error;
    }
  }

  private async insertInitialSources(): Promise<void> {
    const sources = [
      {
        name: 'Resmi Gazete',
        description: 'Türkiye Cumhuriyeti Resmi Gazete duyuruları',
        base_url: 'https://www.resmigazete.gov.tr',
        rss_url: 'https://www.resmigazete.gov.tr/rss.aspx',
        category: 'rss',
        icon_url: 'https://www.resmigazete.gov.tr/favicon.ico'
      },
      {
        name: 'TCMB - Türkiye Cumhuriyet Merkez Bankası',
        description: 'Merkez Bankası duyuru ve kararları',
        base_url: 'https://www.tcmb.gov.tr',
        rss_url: 'https://www.tcmb.gov.tr/rss/duyuru.xml',
        category: 'rss',
        icon_url: 'https://www.tcmb.gov.tr/favicon.ico'
      },
      {
        name: 'BDDK - Bankacılık Düzenleme ve Denetleme Kurumu',
        description: 'BDDK duyuru ve düzenlemeleri',
        base_url: 'https://www.bddk.org.tr',
        rss_url: 'https://www.bddk.org.tr/Rss/RssKategori/5',
        category: 'rss',
        icon_url: 'https://www.bddk.org.tr/favicon.ico'
      },
      {
        name: 'mevzuat.gov.tr',
        description: 'Türkiye mevzuat bilgi sistemi',
        base_url: 'https://www.mevzuat.gov.tr',
        rss_url: 'https://www.mevzuat.gov.tr/MevzuatMetin/RssXml.aspx',
        category: 'rss',
        icon_url: 'https://www.mevzuat.gov.tr/favicon.ico'
      },
      {
        name: 'TÜBİTAK',
        description: 'Türkiye Bilimsel ve Teknolojik Araştırma Kurumu',
        base_url: 'https://www.tubitak.gov.tr',
        category: 'scraping',
        icon_url: 'https://www.tubitak.gov.tr/favicon.ico'
      },
      {
        name: 'SPK - Sermaye Piyasası Kurulu',
        description: 'Sermaye Piyasası Kurulu duyuruları',
        base_url: 'https://www.spk.gov.tr',
        category: 'scraping',
        icon_url: 'https://www.spk.gov.tr/favicon.ico'
      },
      {
        name: 'EPDK - Enerji Piyasası Düzenleme Kurumu',
        description: 'Enerji piyasası düzenlemeleri',
        base_url: 'https://www.epdk.gov.tr',
        category: 'scraping',
        icon_url: 'https://www.epdk.gov.tr/favicon.ico'
      },
      {
        name: 'Meteoroloji Genel Müdürlüğü',
        description: 'Hava durumu ve meteoroloji duyuruları',
        base_url: 'https://www.mgm.gov.tr',
        rss_url: 'https://www.mgm.gov.tr/rss/duyuru.aspx',
        category: 'rss',
        icon_url: 'https://www.mgm.gov.tr/favicon.ico'
      }
    ];

    for (const source of sources) {
      await this.run(`
        INSERT INTO sources (name, description, base_url, rss_url, category, icon_url, robots_txt_checked)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        source.name,
        source.description,
        source.base_url,
        source.rss_url || null,
        source.category,
        source.icon_url,
        source.category === 'scraping' ? 0 : 1
      ]);
    }

    logger.info(`Inserted ${sources.length} initial data sources`);
  }

  // Promise wrapper methods
  public run!: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
  public get!: (sql: string, params?: any[]) => Promise<any>;
  public all!: (sql: string, params?: any[]) => Promise<any[]>;

  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
  }
}

// Singleton instance
const database = new Database();

export const initializeDatabase = () => database.initialize();
export const getDatabase = () => database;
export { database }; 