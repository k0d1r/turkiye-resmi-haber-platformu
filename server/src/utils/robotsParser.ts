import axios from 'axios';
import { Logger } from './logger';

export interface RobotsRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
  crawlDelay?: number;
  sitemap?: string[];
}

export interface RobotsInfo {
  rules: RobotsRule[];
  isAllowed: (userAgent: string, path: string) => boolean;
  getCrawlDelay: (userAgent: string) => number;
  getSitemaps: () => string[];
}

export class RobotsParser {
  private static logger = new Logger('RobotsParser');
  private static cache = new Map<string, RobotsInfo>();
  private static cacheTimeout = 24 * 60 * 60 * 1000; // 24 saat

  /**
   * Robots.txt dosyasını parse eder ve kuralları döner
   */
  static async parseRobots(baseUrl: string): Promise<RobotsInfo> {
    const robotsUrl = this.getRobotsUrl(baseUrl);
    
    // Cache kontrol
    const cached = this.cache.get(robotsUrl);
    if (cached) {
      this.logger.info(`Robots.txt cache'den okundu: ${robotsUrl}`);
      return cached;
    }

    try {
      this.logger.info(`Robots.txt indiriliyor: ${robotsUrl}`);
      
      const response = await axios.get(robotsUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'TurkiyeResmiHaber-Bot/1.0 (+https://turkiyeresmihaber.com/robots)'
        }
      });

      const robotsInfo = this.parseRobotsContent(response.data);
      
      // Cache'e kaydet
      this.cache.set(robotsUrl, robotsInfo);
      setTimeout(() => this.cache.delete(robotsUrl), this.cacheTimeout);
      
      this.logger.info(`Robots.txt başarıyla parse edildi: ${robotsUrl}`);
      return robotsInfo;
      
    } catch (error: any) {
      this.logger.warn(`Robots.txt okunamadı (${robotsUrl}): ${error.message}`);
      
      // Robots.txt yoksa, varsayılan olarak izin ver ama dikkatli ol
      const defaultRobots: RobotsInfo = {
        rules: [{
          userAgent: '*',
          disallow: [],
          allow: ['*'],
          crawlDelay: 5 // Varsayılan 5 saniye gecikme
        }],
        isAllowed: () => true,
        getCrawlDelay: () => 5,
        getSitemaps: () => []
      };
      
      return defaultRobots;
    }
  }

  /**
   * Robots.txt içeriğini parse eder
   */
  private static parseRobotsContent(content: string): RobotsInfo {
    const rules: RobotsRule[] = [];
    const sitemaps: string[] = [];
    
    const lines = content.split('\n').map(line => line.trim());
    let currentRule: Partial<RobotsRule> | null = null;

    for (const line of lines) {
      if (!line || line.startsWith('#')) continue;
      
      const [directive, ...valueParts] = line.split(':');
      if (valueParts.length === 0) continue;
      
      const value = valueParts.join(':').trim();
      const lowerDirective = directive.toLowerCase().trim();

      switch (lowerDirective) {
        case 'user-agent':
          // Önceki rule'u kaydet
          if (currentRule && currentRule.userAgent) {
            rules.push({
              userAgent: currentRule.userAgent,
              disallow: currentRule.disallow || [],
              allow: currentRule.allow || [],
              crawlDelay: currentRule.crawlDelay
            });
          }
          
          // Yeni rule başlat
          currentRule = {
            userAgent: value,
            disallow: [],
            allow: []
          };
          break;

        case 'disallow':
          if (currentRule) {
            if (!currentRule.disallow) currentRule.disallow = [];
            currentRule.disallow.push(value);
          }
          break;

        case 'allow':
          if (currentRule) {
            if (!currentRule.allow) currentRule.allow = [];
            currentRule.allow.push(value);
          }
          break;

        case 'crawl-delay':
          if (currentRule) {
            const delay = parseInt(value, 10);
            if (!isNaN(delay)) {
              currentRule.crawlDelay = delay;
            }
          }
          break;

        case 'sitemap':
          sitemaps.push(value);
          break;
      }
    }

    // Son rule'u kaydet
    if (currentRule && currentRule.userAgent) {
      rules.push({
        userAgent: currentRule.userAgent,
        disallow: currentRule.disallow || [],
        allow: currentRule.allow || [],
        crawlDelay: currentRule.crawlDelay
      });
    }

    return {
      rules,
      isAllowed: (userAgent: string, path: string) => this.isPathAllowed(rules, userAgent, path),
      getCrawlDelay: (userAgent: string) => this.getCrawlDelayForAgent(rules, userAgent),
      getSitemaps: () => sitemaps
    };
  }

  /**
   * Belirli bir path için izin kontrolü
   */
  private static isPathAllowed(rules: RobotsRule[], userAgent: string, path: string): boolean {
    // Uygun rule'u bul
    const applicableRules = rules.filter(rule => 
      this.matchesUserAgent(rule.userAgent, userAgent)
    );

    if (applicableRules.length === 0) {
      return true; // Kural yoksa izin ver
    }

    // En spesifik rule'u kullan
    const rule = applicableRules.find(r => r.userAgent.toLowerCase() === userAgent.toLowerCase()) ||
                 applicableRules.find(r => r.userAgent === '*') ||
                 applicableRules[0];

    // Allow kurallarını kontrol et
    for (const allowPattern of rule.allow) {
      if (this.matchesPath(allowPattern, path)) {
        return true;
      }
    }

    // Disallow kurallarını kontrol et
    for (const disallowPattern of rule.disallow) {
      if (this.matchesPath(disallowPattern, path)) {
        return false;
      }
    }

    return true; // Eşleşen kural yoksa izin ver
  }

  /**
   * User-Agent eşleşmesi kontrolü
   */
  private static matchesUserAgent(ruleAgent: string, requestAgent: string): boolean {
    const ruleAgentLower = ruleAgent.toLowerCase();
    const requestAgentLower = requestAgent.toLowerCase();
    
    if (ruleAgentLower === '*') return true;
    if (ruleAgentLower === requestAgentLower) return true;
    
    return requestAgentLower.includes(ruleAgentLower);
  }

  /**
   * Path pattern eşleşmesi kontrolü
   */
  private static matchesPath(pattern: string, path: string): boolean {
    if (pattern === '') return true;
    if (pattern === '/') return path === '/';
    
    // Wildcards için basit regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\$/g, '$');
    
    try {
      const regex = new RegExp('^' + regexPattern);
      return regex.test(path);
    } catch {
      // Regex hatası varsa exact match yap
      return path.startsWith(pattern);
    }
  }

  /**
   * Crawl delay bilgisini al
   */
  private static getCrawlDelayForAgent(rules: RobotsRule[], userAgent: string): number {
    const applicableRules = rules.filter(rule => 
      this.matchesUserAgent(rule.userAgent, userAgent)
    );

    const rule = applicableRules.find(r => r.userAgent.toLowerCase() === userAgent.toLowerCase()) ||
                 applicableRules.find(r => r.userAgent === '*') ||
                 applicableRules[0];

    return rule?.crawlDelay || 1; // Varsayılan 1 saniye
  }

  /**
   * Base URL'den robots.txt URL'ini oluştur
   */
  private static getRobotsUrl(baseUrl: string): string {
    try {
      const url = new URL(baseUrl);
      return `${url.protocol}//${url.host}/robots.txt`;
    } catch {
      return `${baseUrl}/robots.txt`;
    }
  }

  /**
   * Belirli bir URL'in crawl edilip edilemeyeceğini kontrol et
   */
  static async canCrawl(url: string, userAgent: string = 'TurkiyeResmiHaber-Bot'): Promise<{
    allowed: boolean;
    crawlDelay: number;
    reason?: string;
  }> {
    try {
      const baseUrl = new URL(url).origin;
      const path = new URL(url).pathname + new URL(url).search;
      
      const robotsInfo = await this.parseRobots(baseUrl);
      const allowed = robotsInfo.isAllowed(userAgent, path);
      const crawlDelay = robotsInfo.getCrawlDelay(userAgent);
      
      return {
        allowed,
        crawlDelay,
        reason: allowed ? undefined : 'Robots.txt tarafından yasaklandı'
      };
      
    } catch (error: any) {
      this.logger.error(`Robots kontrol hatası: ${error.message}`);
      return {
        allowed: false,
        crawlDelay: 5,
        reason: `Robots kontrol hatası: ${error.message}`
      };
    }
  }

  /**
   * Cache'i temizle
   */
  static clearCache(): void {
    this.cache.clear();
    this.logger.info('Robots.txt cache temizlendi');
  }
} 