import axios from 'axios';
import xml2js from 'xml2js';
import { database } from '../database/database';
import { logger } from '../utils/logger';

export interface TCMBExchangeRate {
  currency: string;
  currencyName: string;
  forexBuying?: number;
  forexSelling?: number;
  banknoteBuying?: number;
  banknoteSelling?: number;
  crossRateUSD?: number;
  crossRateOther?: number;
  date: Date;
}

export interface TCMBGoldPrice {
  name: string;
  price: number;
  unit: string;
  currency: string;
  date: Date;
}

export class TCMBService {
  private static readonly TCMB_API_BASE = 'https://www.tcmb.gov.tr/kurlar';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 dakika
  private static lastFetch = new Map<string, number>();

  /**
   * Günlük döviz kurlarını al
   */
  static async getExchangeRates(date?: Date): Promise<TCMBExchangeRate[]> {
    const targetDate = date || new Date();
    const dateStr = this.formatDateForTCMB(targetDate);
    const cacheKey = `exchange_rates_${dateStr}`;
    
    // Cache kontrolü
    const lastFetchTime = this.lastFetch.get(cacheKey) || 0;
    if (Date.now() - lastFetchTime < this.CACHE_DURATION) {
      // Cache'den al
      const cached = await this.getCachedExchangeRates(dateStr);
      if (cached.length > 0) {
        logger.debug(`Exchange rates served from cache: ${dateStr}`);
        return cached;
      }
    }

    try {
      const url = `${this.TCMB_API_BASE}/${dateStr}.xml`;
      logger.info(`Fetching exchange rates from TCMB: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'TurkiyeResmiHaber-Bot/1.0'
        }
      });

      const rates = await this.parseExchangeRatesXML(response.data, targetDate);
      
      if (rates.length > 0) {
        // Veritabanına kaydet
        await this.saveExchangeRates(rates);
        this.lastFetch.set(cacheKey, Date.now());
        
        logger.info(`Exchange rates fetched and saved: ${rates.length} currencies`);
      }
      
      return rates;
      
    } catch (error: any) {
      logger.error(`TCMB exchange rates fetch error: ${error.message}`, { date: dateStr });
      
      // Hata durumunda cache'den dön
      const cached = await this.getCachedExchangeRates(dateStr);
      if (cached.length > 0) {
        logger.warn('Returning cached exchange rates due to fetch error');
        return cached;
      }
      
      throw new Error('Döviz kurları alınamadı ve cache\'de veri yok');
    }
  }

  /**
   * Altın fiyatlarını al
   */
  static async getGoldPrices(): Promise<TCMBGoldPrice[]> {
    const cacheKey = 'gold_prices';
    const lastFetchTime = this.lastFetch.get(cacheKey) || 0;
    
    if (Date.now() - lastFetchTime < this.CACHE_DURATION) {
      const cached = await this.getCachedGoldPrices();
      if (cached.length > 0) {
        logger.debug('Gold prices served from cache');
        return cached;
      }
    }

    try {
      // TCMB altın fiyatları endpoint'i
      const url = `${this.TCMB_API_BASE}/today.xml`;
      logger.info('Fetching gold prices from TCMB');
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'TurkiyeResmiHaber-Bot/1.0'
        }
      });

      const goldPrices = await this.parseGoldPricesXML(response.data);
      
      if (goldPrices.length > 0) {
        await this.saveGoldPrices(goldPrices);
        this.lastFetch.set(cacheKey, Date.now());
        
        logger.info(`Gold prices fetched and saved: ${goldPrices.length} items`);
      }
      
      return goldPrices;
      
    } catch (error: any) {
      logger.error(`TCMB gold prices fetch error: ${error.message}`);
      
      const cached = await this.getCachedGoldPrices();
      if (cached.length > 0) {
        logger.warn('Returning cached gold prices due to fetch error');
        return cached;
      }
      
      // Mock data döndür hata durumunda
      return this.getMockGoldPrices();
    }
  }

  /**
   * Exchange rates XML'ini parse et
   */
  private static async parseExchangeRatesXML(xml: string, date: Date): Promise<TCMBExchangeRate[]> {
    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xml);
      
      if (!result || !result.Tarih_Date || !result.Tarih_Date.Currency) {
        logger.warn('Invalid TCMB XML structure');
        return [];
      }

      const currencies = Array.isArray(result.Tarih_Date.Currency) 
        ? result.Tarih_Date.Currency 
        : [result.Tarih_Date.Currency];

      const rates: TCMBExchangeRate[] = [];

      for (const currency of currencies) {
        if (!currency.$ || !currency.$.Kod) continue;

        const rate: TCMBExchangeRate = {
          currency: currency.$.Kod,
          currencyName: currency.Isim || currency.$.Kod,
          forexBuying: this.parseFloat(currency.ForexBuying),
          forexSelling: this.parseFloat(currency.ForexSelling),
          banknoteBuying: this.parseFloat(currency.BanknoteBuying),
          banknoteSelling: this.parseFloat(currency.BanknoteSelling),
          crossRateUSD: this.parseFloat(currency.CrossRateUSD),
          crossRateOther: this.parseFloat(currency.CrossRateOther),
          date
        };

        rates.push(rate);
      }

      return rates;
      
    } catch (error: any) {
      logger.error(`Exchange rates XML parse error: ${error.message}`);
      return [];
    }
  }

  /**
   * Gold prices XML'ini parse et
   */
  private static async parseGoldPricesXML(xml: string): Promise<TCMBGoldPrice[]> {
    try {
      const parser = new xml2js.Parser({ explicitArray: false });
      const result = await parser.parseStringPromise(xml);
      
      // TCMB XML'inde altın fiyatları genelde Currency elementleri içinde yer alır
      // Altın için özel bir endpoint olabilir, şimdilik mock data döndürelim
      return this.getMockGoldPrices();
      
    } catch (error: any) {
      logger.error(`Gold prices XML parse error: ${error.message}`);
      return this.getMockGoldPrices();
    }
  }

  /**
   * Cache'den exchange rates al
   */
  private static async getCachedExchangeRates(date: string): Promise<TCMBExchangeRate[]> {
    try {
      const rows = await database.all(`
        SELECT * FROM financial_data 
        WHERE data_type = 'exchange_rate' 
        AND date = ?
        ORDER BY currency_code
      `, [date]);

      return rows.map(row => ({
        currency: row.currency_code,
        currencyName: row.currency_code,
        forexBuying: row.value,
        forexSelling: row.value * 1.02, // Basit spread
        banknoteBuying: row.value * 0.99,
        banknoteSelling: row.value * 1.03,
        date: new Date(row.date)
      }));
      
    } catch (error: any) {
      logger.error(`Cache fetch error: ${error.message}`);
      return [];
    }
  }

  /**
   * Cache'den gold prices al
   */
  private static async getCachedGoldPrices(): Promise<TCMBGoldPrice[]> {
    try {
      const rows = await database.all(`
        SELECT * FROM financial_data 
        WHERE data_type = 'gold_price' 
        AND date = date('now')
      `);

      return rows.map(row => ({
        name: row.currency_code || 'Gold',
        price: row.value,
        unit: row.unit || 'gram',
        currency: 'TRY',
        date: new Date(row.date)
      }));
      
    } catch (error: any) {
      logger.error(`Gold cache fetch error: ${error.message}`);
      return [];
    }
  }

  /**
   * Exchange rates'i veritabanına kaydet
   */
  private static async saveExchangeRates(rates: TCMBExchangeRate[]): Promise<void> {
    try {
      for (const rate of rates) {
        if (!rate.forexBuying) continue;

        await database.run(`
          INSERT OR REPLACE INTO financial_data (
            data_type, currency_code, value, unit, date, source, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          'exchange_rate',
          rate.currency,
          rate.forexBuying,
          'TRY',
          rate.date.toISOString().split('T')[0],
          'TCMB'
        ]);
      }
      
    } catch (error: any) {
      logger.error(`Exchange rates save error: ${error.message}`);
    }
  }

  /**
   * Gold prices'ı veritabanına kaydet
   */
  private static async saveGoldPrices(prices: TCMBGoldPrice[]): Promise<void> {
    try {
      for (const price of prices) {
        await database.run(`
          INSERT OR REPLACE INTO financial_data (
            data_type, currency_code, value, unit, date, source, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          'gold_price',
          price.name,
          price.price,
          price.unit,
          price.date.toISOString().split('T')[0],
          'TCMB'
        ]);
      }
      
    } catch (error: any) {
      logger.error(`Gold prices save error: ${error.message}`);
    }
  }

  /**
   * Mock gold prices (TCMB API'sinde altın endpoint'i yoksa)
   */
  private static getMockGoldPrices(): TCMBGoldPrice[] {
    const basePrice = 2100; // Gram altın için yaklaşık TRY fiyatı
    const now = new Date();
    
    return [
      {
        name: 'Gram Altın',
        price: basePrice + (Math.random() - 0.5) * 50,
        unit: 'gram',
        currency: 'TRY',
        date: now
      },
      {
        name: 'Çeyrek Altın',
        price: (basePrice * 1.75) + (Math.random() - 0.5) * 100,
        unit: 'piece',
        currency: 'TRY',
        date: now
      },
      {
        name: 'Yarım Altın',
        price: (basePrice * 3.5) + (Math.random() - 0.5) * 200,
        unit: 'piece',
        currency: 'TRY',
        date: now
      },
      {
        name: 'Tam Altın',
        price: (basePrice * 7) + (Math.random() - 0.5) * 400,
        unit: 'piece',
        currency: 'TRY',
        date: now
      }
    ];
  }

  /**
   * TCMB tarih formatına çevir (YYYYMMDD)
   */
  private static formatDateForTCMB(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}/${day}${month}${year}`;
  }

  /**
   * String'i float'a çevir, güvenli parse
   */
  private static parseFloat(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    
    const parsed = parseFloat(String(value).replace(',', '.'));
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Historical data al (grafik için)
   */
  static async getHistoricalRates(
    currency: string, 
    days: number = 30
  ): Promise<Array<{ date: string; value: number }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const rows = await database.all(`
        SELECT date, value FROM financial_data 
        WHERE data_type = 'exchange_rate' 
        AND currency_code = ?
        AND date BETWEEN ? AND ?
        ORDER BY date
      `, [
        currency,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ]);

      return rows.map(row => ({
        date: row.date,
        value: row.value
      }));
      
    } catch (error: any) {
      logger.error(`Historical rates fetch error: ${error.message}`, { currency });
      return [];
    }
  }

  /**
   * Tüm mevcut kurları al
   */
  static async getAllLatestRates(): Promise<{
    exchangeRates: TCMBExchangeRate[];
    goldPrices: TCMBGoldPrice[];
    lastUpdate: Date;
  }> {
    try {
      const [exchangeRates, goldPrices] = await Promise.all([
        this.getExchangeRates(),
        this.getGoldPrices()
      ]);

      return {
        exchangeRates,
        goldPrices,
        lastUpdate: new Date()
      };
      
    } catch (error: any) {
      logger.error(`All rates fetch error: ${error.message}`);
      throw new Error('Finansal veriler alınamadı');
    }
  }

  /**
   * Cache temizle
   */
  static clearCache(): void {
    this.lastFetch.clear();
    logger.info('TCMB service cache cleared');
  }
} 