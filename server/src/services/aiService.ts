import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { database } from '../database/database';

export interface SummarizationOptions {
  maxLength?: number;
  language?: 'tr' | 'en';
  style?: 'formal' | 'simple' | 'technical';
  includeKeywords?: boolean;
}

export interface SummarizationResult {
  summary: string;
  keywords: string[];
  confidence: number;
  processingTime: number;
  tokensUsed: number;
}

export interface ContentAnalysis {
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  importance: 'low' | 'medium' | 'high';
  topics: string[];
  entities: string[];
}

export class AIService {
  private static openai: OpenAI | null = null;
  private static initialized = false;
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat

  /**
   * AI service'i başlat
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.warn('OpenAI API key not found, AI features will be disabled');
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey
      });

      // API bağlantı testi
      await this.testConnection();
      this.initialized = true;
      logger.info('AI service initialized successfully');

    } catch (error: any) {
      logger.error(`AI service initialization failed: ${error.message}`);
      this.openai = null;
    }
  }

  /**
   * OpenAI bağlantı testi
   */
  private static async testConnection(): Promise<void> {
    if (!this.openai) throw new Error('OpenAI not initialized');

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 10
      });

      if (!response.choices?.[0]?.message) {
        throw new Error('Invalid OpenAI response');
      }

      logger.info('OpenAI connection test successful');
    } catch (error: any) {
      throw new Error(`OpenAI connection test failed: ${error.message}`);
    }
  }

  /**
   * İçerik özetleme
   */
  static async summarizeContent(
    content: string, 
    options: SummarizationOptions = {}
  ): Promise<SummarizationResult | null> {
    if (!this.isAvailable()) {
      logger.warn('AI service not available for summarization');
      return null;
    }

    const startTime = Date.now();

    try {
      // Cache kontrolü
      const cacheKey = this.generateCacheKey(content, options);
      const cached = await this.getCachedSummary(cacheKey);
      if (cached) {
        logger.debug('Summary served from cache');
        return cached;
      }

      const {
        maxLength = 200,
        language = 'tr',
        style = 'formal',
        includeKeywords = true
      } = options;

      // Prompt oluştur
      const prompt = this.buildSummarizationPrompt(content, {
        maxLength,
        language,
        style,
        includeKeywords
      });

      // OpenAI API çağrısı
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Sen Türkiye\'deki resmi kurumların duyurularını özetleyen bir asistansın. Objektif, net ve özlü özetler hazırlarsın.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: Math.max(maxLength * 2, 150),
        temperature: 0.3,
        presence_penalty: 0.1
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) {
        throw new Error('No completion received from OpenAI');
      }

      // Yanıtı parse et
      const result = this.parseSummarizationResponse(completion, maxLength);
      result.processingTime = Date.now() - startTime;
      result.tokensUsed = response.usage?.total_tokens || 0;

      // Cache'e kaydet
      await this.cacheSummary(cacheKey, result);

      logger.info('Content summarized successfully', {
        contentLength: content.length,
        summaryLength: result.summary.length,
        tokensUsed: result.tokensUsed,
        processingTime: result.processingTime
      });

      return result;

    } catch (error: any) {
      logger.error(`Summarization failed: ${error.message}`, {
        contentLength: content.length,
        processingTime: Date.now() - startTime
      });
      return null;
    }
  }

  /**
   * İçerik analizi
   */
  static async analyzeContent(content: string): Promise<ContentAnalysis | null> {
    if (!this.isAvailable()) {
      logger.warn('AI service not available for content analysis');
      return null;
    }

    try {
      const prompt = `
Aşağıdaki Türk resmi kurum duyurusunu analiz et ve JSON formatında sonuç ver:

İçerik: "${content}"

Analiz et:
1. Kategori (announcement, regulation, financial, legal, technology, other)
2. Duygu (positive, neutral, negative)
3. Önem (low, medium, high)
4. Ana konular (maksimum 5)
5. Varlık/kurum isimleri (maksimum 5)

JSON formatı:
{
  "category": "kategori",
  "sentiment": "duygu",
  "importance": "önem",
  "topics": ["konu1", "konu2"],
  "entities": ["varlık1", "varlık2"]
}
      `;

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Sen bir metin analizi uzmanısın. Sadece JSON formatında yanıt verirsin.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) {
        throw new Error('No completion received for analysis');
      }

      // JSON parse et
      const analysis = JSON.parse(completion.trim());
      
      logger.info('Content analyzed successfully', {
        category: analysis.category,
        sentiment: analysis.sentiment,
        importance: analysis.importance
      });

      return analysis;

    } catch (error: any) {
      logger.error(`Content analysis failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Keyword çıkarma
   */
  static async extractKeywords(content: string, maxKeywords: number = 10): Promise<string[]> {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const prompt = `
Aşağıdaki Türk resmi kurum duyurusundan en önemli ${maxKeywords} anahtar kelimeyi çıkar.
Sadece virgülle ayrılmış anahtar kelimeleri ver, başka açıklama yapma.

İçerik: "${content}"

Anahtar kelimeler:
      `;

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Sen anahtar kelime çıkarma uzmanısın. Sadece virgülle ayrılmış anahtar kelimeleri verirsin.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.2
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) {
        return [];
      }

      const keywords = completion
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 2)
        .slice(0, maxKeywords);

      return keywords;

    } catch (error: any) {
      logger.error(`Keyword extraction failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Makale için otomatik özet oluştur
   */
  static async summarizeArticle(articleId: number): Promise<boolean> {
    try {
      // Makaleyi al
      const article = await database.get(
        'SELECT id, title, description, content, summary FROM articles WHERE id = ?',
        [articleId]
      );

      if (!article) {
        logger.warn(`Article not found for summarization: ${articleId}`);
        return false;
      }

      // Zaten özet varsa atla
      if (article.summary) {
        logger.debug(`Article already has summary: ${articleId}`);
        return true;
      }

      // Özetlenecek içeriği hazırla
      const contentToSummarize = [
        article.title,
        article.description,
        article.content
      ].filter(Boolean).join('\n\n');

      if (contentToSummarize.length < 100) {
        logger.debug(`Article too short for summarization: ${articleId}`);
        return true;
      }

      // AI ile özetle
      const summaryResult = await this.summarizeContent(contentToSummarize, {
        maxLength: 150,
        language: 'tr',
        style: 'formal'
      });

      if (!summaryResult) {
        logger.warn(`Failed to generate summary for article: ${articleId}`);
        return false;
      }

      // Özeti veritabanına kaydet
      await database.run(
        'UPDATE articles SET summary = ?, updated_at = datetime("now") WHERE id = ?',
        [summaryResult.summary, articleId]
      );

      logger.info(`Article summarized successfully: ${articleId}`, {
        originalLength: contentToSummarize.length,
        summaryLength: summaryResult.summary.length,
        tokensUsed: summaryResult.tokensUsed
      });

      return true;

    } catch (error: any) {
      logger.error(`Article summarization failed: ${error.message}`, { articleId });
      return false;
    }
  }

  /**
   * Toplu makale özetleme
   */
  static async summarizeArticlesBatch(limit: number = 10): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    try {
      // Özeti olmayan makaleleri al
      const articles = await database.all(`
        SELECT id FROM articles 
        WHERE summary IS NULL 
        AND (content IS NOT NULL OR description IS NOT NULL)
        ORDER BY created_at DESC 
        LIMIT ?
      `, [limit]);

      if (articles.length === 0) {
        logger.info('No articles found for batch summarization');
        return { processed: 0, succeeded: 0, failed: 0 };
      }

      let succeeded = 0;
      let failed = 0;

      logger.info(`Starting batch summarization for ${articles.length} articles`);

      for (const article of articles) {
        try {
          const success = await this.summarizeArticle(article.id);
          if (success) {
            succeeded++;
          } else {
            failed++;
          }

          // Rate limiting için kısa bekleme
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
          logger.error(`Batch summarization error for article ${article.id}: ${error.message}`);
          failed++;
        }
      }

      logger.info(`Batch summarization completed`, {
        processed: articles.length,
        succeeded,
        failed
      });

      return {
        processed: articles.length,
        succeeded,
        failed
      };

    } catch (error: any) {
      logger.error(`Batch summarization failed: ${error.message}`);
      return { processed: 0, succeeded: 0, failed: 0 };
    }
  }

  /**
   * Özetleme prompt'u oluştur
   */
  private static buildSummarizationPrompt(
    content: string, 
    options: Required<SummarizationOptions>
  ): string {
    const { maxLength, language, style, includeKeywords } = options;

    const styleInstructions = {
      formal: 'resmi ve profesyonel bir dil kullan',
      simple: 'sade ve anlaşılır bir dil kullan',
      technical: 'teknik terimleri koruyarak detaylı açıkla'
    };

    const languageInstructions = {
      tr: 'Türkçe olarak yanıt ver',
      en: 'Respond in English'
    };

    return `
${languageInstructions[language]}. Aşağıdaki resmi kurum duyurusunu ${maxLength} kelimeyi geçmeyecek şekilde özetle.

Kurallar:
- ${styleInstructions[style]}
- Önemli bilgileri kaybetme
- Objektif ve tarafsız ol
- ${includeKeywords ? 'Sonuna önemli anahtar kelimeleri ekle' : 'Sadece özet ver'}

Duyuru: "${content}"

${includeKeywords ? 'Format: [ÖZET]\n\nAnahtar kelimeler: [kelime1, kelime2, kelime3]' : 'Özet:'}
    `;
  }

  /**
   * AI yanıtını parse et
   */
  private static parseSummarizationResponse(response: string, maxLength: number): SummarizationResult {
    let summary = response.trim();
    let keywords: string[] = [];

    // Anahtar kelimeleri çıkar
    const keywordMatch = summary.match(/anahtar kelimeler?:?\s*\[?([^\]]+)\]?/i);
    if (keywordMatch) {
      keywords = keywordMatch[1]
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      summary = summary.replace(keywordMatch[0], '').trim();
    }

    // Özeti temizle
    summary = summary
      .replace(/^(özet:?|summary:?)/i, '')
      .replace(/\[özet\]/i, '')
      .trim();

    // Uzunluk kontrolü
    if (summary.length > maxLength * 1.5) {
      const sentences = summary.split(/[.!?]+/);
      let truncated = '';
      
      for (const sentence of sentences) {
        if ((truncated + sentence).length > maxLength) break;
        truncated += sentence + '.';
      }
      
      summary = truncated.trim();
    }

    // Confidence hesapla (basit)
    const confidence = Math.min(
      0.9, 
      0.5 + (summary.length / (maxLength * 2)) * 0.4
    );

    return {
      summary,
      keywords,
      confidence,
      processingTime: 0, // Dışarıdan set edilecek
      tokensUsed: 0 // Dışarıdan set edilecek
    };
  }

  /**
   * Cache key oluştur
   */
  private static generateCacheKey(content: string, options: SummarizationOptions): string {
    const optionsStr = JSON.stringify(options);
    const contentHash = this.simpleHash(content);
    const optionsHash = this.simpleHash(optionsStr);
    return `summary_${contentHash}_${optionsHash}`;
  }

  /**
   * Basit hash fonksiyonu
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer'a çevir
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Cache'den özet al
   */
  private static async getCachedSummary(cacheKey: string): Promise<SummarizationResult | null> {
    try {
      const cached = await database.get(
        'SELECT data, created_at FROM ai_cache WHERE cache_key = ? AND created_at > datetime("now", "-1 day")',
        [cacheKey]
      );

      if (cached) {
        return JSON.parse(cached.data);
      }

      return null;
    } catch (error: any) {
      logger.error(`Cache retrieval failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Özeti cache'e kaydet
   */
  private static async cacheSummary(cacheKey: string, result: SummarizationResult): Promise<void> {
    try {
      await database.run(`
        INSERT OR REPLACE INTO ai_cache (cache_key, data, created_at)
        VALUES (?, ?, datetime('now'))
      `, [cacheKey, JSON.stringify(result)]);
    } catch (error: any) {
      logger.error(`Cache save failed: ${error.message}`);
    }
  }

  /**
   * AI service kullanılabilir mi?
   */
  static isAvailable(): boolean {
    return this.initialized && this.openai !== null;
  }

  /**
   * Kullanım istatistikleri
   */
  static async getUsageStats(): Promise<{
    totalRequests: number;
    totalTokens: number;
    averageProcessingTime: number;
    successRate: number;
  }> {
    try {
      // Bu gerçek implementasyonda ayrı bir usage tracking tablosu olmalı
      // Şimdilik basit stats döndürelim
      return {
        totalRequests: 0,
        totalTokens: 0,
        averageProcessingTime: 0,
        successRate: 1.0
      };
    } catch (error: any) {
      logger.error(`Usage stats failed: ${error.message}`);
      return {
        totalRequests: 0,
        totalTokens: 0,
        averageProcessingTime: 0,
        successRate: 0
      };
    }
  }

  /**
   * Cache temizle
   */
  static async clearCache(): Promise<void> {
    try {
      await database.run('DELETE FROM ai_cache WHERE created_at < datetime("now", "-7 days")');
      logger.info('AI cache cleared');
    } catch (error: any) {
      logger.error(`Cache clear failed: ${error.message}`);
    }
  }

  /**
   * Service'i kapat
   */
  static async close(): Promise<void> {
    this.openai = null;
    this.initialized = false;
    logger.info('AI service closed');
  }
} 