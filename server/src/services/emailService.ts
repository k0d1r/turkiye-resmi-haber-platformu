import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { database } from '../database/database';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface NotificationEmail {
  userId: number;
  type: 'new_article' | 'keyword_match' | 'daily_summary' | 'weekly_summary';
  data: any;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static initialized = false;

  /**
   * Email service'i başlat
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Development için Ethereal Email (test)
      if (process.env.NODE_ENV === 'development') {
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        
        logger.info('Email service initialized with Ethereal (test mode)');
      } else {
        // Production için gerçek SMTP
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        
        logger.info('Email service initialized with production SMTP');
      }

      // Bağlantı testi
      await this.transporter.verify();
      this.initialized = true;
      logger.info('Email service connection verified');

    } catch (error: any) {
      logger.error(`Email service initialization failed: ${error.message}`);
      throw new Error('Email servisi başlatılamadı');
    }
  }

  /**
   * Email gönder
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.initialized || !this.transporter) {
      await this.initialize();
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'Türkiye Resmi Haber <noreply@turkiyeresmihaber.com>',
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments
      };

      const result = await this.transporter!.sendMail(mailOptions);
      
      // Development'ta preview URL logla
      if (process.env.NODE_ENV === 'development') {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(result)}`);
      }

      logger.info('Email sent successfully', { 
        to: options.to, 
        subject: options.subject,
        messageId: result.messageId 
      });
      
      return true;

    } catch (error: any) {
      logger.error(`Email send failed: ${error.message}`, { 
        to: options.to, 
        subject: options.subject 
      });
      return false;
    }
  }

  /**
   * Yeni makale bildirimi
   */
  static async sendNewArticleNotification(userId: number, article: any, source: any): Promise<boolean> {
    try {
      const user = await database.get(
        'SELECT email, first_name, last_name FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        logger.warn(`User not found for notification: ${userId}`);
        return false;
      }

      const subject = `Yeni Duyuru: ${article.title}`;
      const html = this.generateNewArticleHTML(user, article, source);
      const text = this.generateNewArticleText(user, article, source);

      return await this.sendEmail({
        to: user.email,
        subject,
        html,
        text
      });

    } catch (error: any) {
      logger.error(`New article notification failed: ${error.message}`, { userId });
      return false;
    }
  }

  /**
   * Keyword eşleşme bildirimi
   */
  static async sendKeywordMatchNotification(
    userId: number, 
    article: any, 
    matchedKeywords: string[]
  ): Promise<boolean> {
    try {
      const user = await database.get(
        'SELECT email, first_name, last_name FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        logger.warn(`User not found for keyword notification: ${userId}`);
        return false;
      }

      const subject = `Anahtar Kelime Eşleşmesi: ${matchedKeywords.join(', ')}`;
      const html = this.generateKeywordMatchHTML(user, article, matchedKeywords);
      const text = this.generateKeywordMatchText(user, article, matchedKeywords);

      return await this.sendEmail({
        to: user.email,
        subject,
        html,
        text
      });

    } catch (error: any) {
      logger.error(`Keyword match notification failed: ${error.message}`, { userId });
      return false;
    }
  }

  /**
   * Günlük özet e-postası
   */
  static async sendDailySummary(userId: number): Promise<boolean> {
    try {
      const user = await database.get(
        'SELECT email, first_name, last_name FROM users WHERE id = ?',
        [userId]
      );

      if (!user) return false;

      // Son 24 saat içindeki makaleler
      const articles = await database.all(`
        SELECT 
          a.id, a.title, a.description, a.url, a.published_date,
          s.name as source_name, s.icon_url as source_icon
        FROM articles a
        LEFT JOIN sources s ON a.source_id = s.id
        WHERE a.published_date >= datetime('now', '-1 day')
        ORDER BY a.published_date DESC
        LIMIT 10
      `);

      if (articles.length === 0) {
        logger.info(`No articles for daily summary: ${userId}`);
        return true; // Makale yoksa da başarılı sayalım
      }

      const subject = `Günlük Özet - ${articles.length} Yeni Duyuru`;
      const html = this.generateDailySummaryHTML(user, articles);
      const text = this.generateDailySummaryText(user, articles);

      return await this.sendEmail({
        to: user.email,
        subject,
        html,
        text
      });

    } catch (error: any) {
      logger.error(`Daily summary failed: ${error.message}`, { userId });
      return false;
    }
  }

  /**
   * Email doğrulama e-postası
   */
  static async sendVerificationEmail(email: string, token: string, userName: string): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
      
      const subject = 'E-posta Adresinizi Doğrulayın';
      const html = this.generateVerificationHTML(userName, verificationUrl);
      const text = this.generateVerificationText(userName, verificationUrl);

      return await this.sendEmail({
        to: email,
        subject,
        html,
        text
      });

    } catch (error: any) {
      logger.error(`Verification email failed: ${error.message}`, { email });
      return false;
    }
  }

  /**
   * Şifre sıfırlama e-postası
   */
  static async sendPasswordResetEmail(email: string, token: string, userName: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      
      const subject = 'Şifre Sıfırlama Talebi';
      const html = this.generatePasswordResetHTML(userName, resetUrl);
      const text = this.generatePasswordResetText(userName, resetUrl);

      return await this.sendEmail({
        to: email,
        subject,
        html,
        text
      });

    } catch (error: any) {
      logger.error(`Password reset email failed: ${error.message}`, { email });
      return false;
    }
  }

  /**
   * Hoş geldin e-postası
   */
  static async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    try {
      const subject = 'Türkiye Resmi Haber\'e Hoş Geldiniz!';
      const html = this.generateWelcomeHTML(userName);
      const text = this.generateWelcomeText(userName);

      return await this.sendEmail({
        to: email,
        subject,
        html,
        text
      });

    } catch (error: any) {
      logger.error(`Welcome email failed: ${error.message}`, { email });
      return false;
    }
  }

  /**
   * Yeni makale HTML template
   */
  private static generateNewArticleHTML(user: any, article: any, source: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Yeni Duyuru</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .article { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .source { display: flex; align-items: center; margin-bottom: 15px; }
          .source img { width: 24px; height: 24px; margin-right: 10px; }
          .btn { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🇹🇷 Türkiye Resmi Haber</h1>
            <p>Yeni Duyuru Bildirimi</p>
          </div>
          
          <div class="content">
            <p>Merhaba <strong>${user.first_name}</strong>,</p>
            <p>Abone olduğunuz kaynaktan yeni bir duyuru yayınlandı:</p>
            
            <div class="article">
              <div class="source">
                ${source.icon_url ? `<img src="${source.icon_url}" alt="${source.name}">` : '📰'}
                <strong>${source.name}</strong>
              </div>
              
              <h2 style="color: #1f2937; margin-bottom: 10px;">${article.title}</h2>
              
              ${article.description ? `<p style="color: #6b7280; margin-bottom: 15px;">${article.description}</p>` : ''}
              
              <p style="margin-bottom: 20px;">
                📅 Yayın Tarihi: ${new Date(article.published_date).toLocaleDateString('tr-TR')}
              </p>
              
              <a href="${article.url}" class="btn" style="color: white;">Duyuruyu Oku</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Bu e-posta aboneliğiniz nedeniyle gönderilmiştir.</p>
            <p><a href="${process.env.FRONTEND_URL}/subscriptions">Abonelik ayarlarınızı değiştirin</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Yeni makale text template
   */
  private static generateNewArticleText(user: any, article: any, source: any): string {
    return `
Merhaba ${user.first_name},

Abone olduğunuz kaynaktan yeni bir duyuru yayınlandı:

Kaynak: ${source.name}
Başlık: ${article.title}
${article.description ? `Açıklama: ${article.description}` : ''}
Yayın Tarihi: ${new Date(article.published_date).toLocaleDateString('tr-TR')}

Duyuruyu okumak için: ${article.url}

Bu e-posta aboneliğiniz nedeniyle gönderilmiştir.
Abonelik ayarlarınızı değiştirmek için: ${process.env.FRONTEND_URL}/subscriptions

--
Türkiye Resmi Haber
    `;
  }

  /**
   * Keyword eşleşme HTML template
   */
  private static generateKeywordMatchHTML(user: any, article: any, keywords: string[]): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Anahtar Kelime Eşleşmesi</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f0f9ff; }
          .article { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .keywords { background: #fef3c7; padding: 10px; border-radius: 6px; margin: 15px 0; }
          .btn { background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔍 Anahtar Kelime Eşleşmesi</h1>
            <p>İlgilendiğiniz konuda yeni duyuru!</p>
          </div>
          
          <div class="content">
            <p>Merhaba <strong>${user.first_name}</strong>,</p>
            <p>Takip ettiğiniz anahtar kelimelerle eşleşen yeni bir duyuru bulundu:</p>
            
            <div class="keywords">
              <strong>Eşleşen Anahtar Kelimeler:</strong> ${keywords.join(', ')}
            </div>
            
            <div class="article">
              <h2 style="color: #1f2937;">${article.title}</h2>
              ${article.description ? `<p style="color: #6b7280;">${article.description}</p>` : ''}
              
              <p>📅 ${new Date(article.published_date).toLocaleDateString('tr-TR')}</p>
              
              <a href="${article.url}" class="btn" style="color: white;">Duyuruyu Oku</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Bu e-posta keyword aboneliğiniz nedeniyle gönderilmiştir.</p>
            <p><a href="${process.env.FRONTEND_URL}/subscriptions">Abonelik ayarlarınızı değiştirin</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Keyword eşleşme text template
   */
  private static generateKeywordMatchText(user: any, article: any, keywords: string[]): string {
    return `
Merhaba ${user.first_name},

Takip ettiğiniz anahtar kelimelerle eşleşen yeni bir duyuru bulundu:

Eşleşen Anahtar Kelimeler: ${keywords.join(', ')}

Başlık: ${article.title}
${article.description ? `Açıklama: ${article.description}` : ''}
Yayın Tarihi: ${new Date(article.published_date).toLocaleDateString('tr-TR')}

Duyuruyu okumak için: ${article.url}

--
Türkiye Resmi Haber
    `;
  }

  /**
   * Günlük özet HTML template
   */
  private static generateDailySummaryHTML(user: any, articles: any[]): string {
    const articlesList = articles.map(article => `
      <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #3b82f6;">
        <h3 style="margin: 0 0 10px 0; color: #1f2937;">
          <a href="${article.url}" style="color: #1f2937; text-decoration: none;">${article.title}</a>
        </h3>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          📰 ${article.source_name} • ${new Date(article.published_date).toLocaleDateString('tr-TR')}
        </p>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Günlük Özet</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #faf5ff; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Günlük Özet</h1>
            <p>${new Date().toLocaleDateString('tr-TR')} - ${articles.length} Yeni Duyuru</p>
          </div>
          
          <div class="content">
            <p>Merhaba <strong>${user.first_name}</strong>,</p>
            <p>Son 24 saat içinde yayınlanan duyuruların özeti:</p>
            
            ${articlesList}
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}/articles" style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Tüm Duyuruları Gör
              </a>
            </p>
          </div>
          
          <div class="footer">
            <p>Günlük özet e-postası.</p>
            <p><a href="${process.env.FRONTEND_URL}/subscriptions">Ayarlarınızı değiştirin</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Günlük özet text template
   */
  private static generateDailySummaryText(user: any, articles: any[]): string {
    const articlesList = articles.map(article => 
      `• ${article.title}\n  ${article.source_name} - ${new Date(article.published_date).toLocaleDateString('tr-TR')}\n  ${article.url}\n`
    ).join('\n');

    return `
Merhaba ${user.first_name},

Son 24 saat içinde yayınlanan ${articles.length} duyurunun özeti:

${articlesList}

Tüm duyuruları görmek için: ${process.env.FRONTEND_URL}/articles

--
Türkiye Resmi Haber
    `;
  }

  /**
   * Email doğrulama HTML template
   */
  private static generateVerificationHTML(userName: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>E-posta Doğrulama</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f0f9ff; }
          .btn { background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ E-posta Doğrulama</h1>
            <p>Hesabınızı aktif hale getirin</p>
          </div>
          
          <div class="content">
            <p>Merhaba <strong>${userName}</strong>,</p>
            <p>Türkiye Resmi Haber'e hoş geldiniz! Hesabınızı aktif hale getirmek için e-posta adresinizi doğrulamanız gerekiyor.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="btn" style="color: white;">E-postamı Doğrula</a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              Eğer butona tıklayamıyorsanız, aşağıdaki linki tarayıcınıza kopyalayın:<br>
              <a href="${verificationUrl}">${verificationUrl}</a>
            </p>
            
            <p style="color: #dc2626; font-size: 14px;">
              ⚠️ Bu link 24 saat içinde geçerliliğini yitirecektir.
            </p>
          </div>
          
          <div class="footer">
            <p>Bu e-postayı siz talep etmediniz ise lütfen görmezden gelin.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Email doğrulama text template
   */
  private static generateVerificationText(userName: string, verificationUrl: string): string {
    return `
Merhaba ${userName},

Türkiye Resmi Haber'e hoş geldiniz! 

Hesabınızı aktif hale getirmek için aşağıdaki linke tıklayın:
${verificationUrl}

Bu link 24 saat içinde geçerliliğini yitirecektir.

Bu e-postayı siz talep etmediniz ise lütfen görmezden gelin.

--
Türkiye Resmi Haber
    `;
  }

  /**
   * Şifre sıfırlama HTML template
   */
  private static generatePasswordResetHTML(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Şifre Sıfırlama</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #fef2f2; }
          .btn { background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 Şifre Sıfırlama</h1>
            <p>Şifrenizi yenileyin</p>
          </div>
          
          <div class="content">
            <p>Merhaba <strong>${userName}</strong>,</p>
            <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Yeni şifre oluşturmak için aşağıdaki butona tıklayın:</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="btn" style="color: white;">Şifremi Sıfırla</a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              Eğer butona tıklayamıyorsanız, aşağıdaki linki tarayıcınıza kopyalayın:<br>
              <a href="${resetUrl}">${resetUrl}</a>
            </p>
            
            <p style="color: #dc2626; font-size: 14px;">
              ⚠️ Bu link 1 saat içinde geçerliliğini yitirecektir.
            </p>
          </div>
          
          <div class="footer">
            <p>Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelin ve şifrenizi değiştirin.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Şifre sıfırlama text template
   */
  private static generatePasswordResetText(userName: string, resetUrl: string): string {
    return `
Merhaba ${userName},

Hesabınız için şifre sıfırlama talebinde bulundunuz.

Yeni şifre oluşturmak için aşağıdaki linke tıklayın:
${resetUrl}

Bu link 1 saat içinde geçerliliğini yitirecektir.

Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelin.

--
Türkiye Resmi Haber
    `;
  }

  /**
   * Hoş geldin HTML template
   */
  private static generateWelcomeHTML(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Hoş Geldiniz</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f0f9ff; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #3b82f6; }
          .btn { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Hoş Geldiniz!</h1>
            <p>Türkiye Resmi Haber ailesine katıldınız</p>
          </div>
          
          <div class="content">
            <p>Merhaba <strong>${userName}</strong>,</p>
            <p>Türkiye'nin resmi kurumlarından gelen duyuruları takip edebileceğiniz platforma hoş geldiniz!</p>
            
            <h3>Neler yapabilirsiniz:</h3>
            
            <div class="feature">
              <strong>📰 Son Duyuruları Takip Edin</strong><br>
              Resmi kurumların güncel duyurularını kaçırmayın.
            </div>
            
            <div class="feature">
              <strong>🔍 Gelişmiş Arama</strong><br>
              İhtiyacınız olan bilgileri hızlıca bulun.
            </div>
            
            <div class="feature">
              <strong>📊 Finansal Veriler</strong><br>
              TCMB döviz kurları ve altın fiyatlarını görüntüleyin.
            </div>
            
            <div class="feature">
              <strong>🔔 Akıllı Bildirimler</strong><br>
              İlgilendiğiniz konularda otomatik bildirim alın.
            </div>
            
            <p style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL}" class="btn" style="color: white;">Platformu Keşfedin</a>
            </p>
          </div>
          
          <div class="footer">
            <p>Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.</p>
            <p><a href="${process.env.FRONTEND_URL}/contact">İletişim</a> | <a href="${process.env.FRONTEND_URL}/about">Hakkımızda</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Hoş geldin text template
   */
  private static generateWelcomeText(userName: string): string {
    return `
Merhaba ${userName},

Türkiye Resmi Haber'e hoş geldiniz!

Türkiye'nin resmi kurumlarından gelen duyuruları takip edebileceğiniz platforma katıldınız.

Neler yapabilirsiniz:
• Son duyuruları takip edebilirsiniz
• Gelişmiş arama ile istediğiniz bilgileri bulabilirsiniz  
• TCMB finansal verilerini görüntüleyebilirsiniz
• İlgilendiğiniz konularda bildirim alabilirsiniz

Platformu keşfetmek için: ${process.env.FRONTEND_URL}

Herhangi bir sorunuz olursa bizimle iletişime geçebilirsiniz.

--
Türkiye Resmi Haber Ekibi
    `;
  }

  /**
   * Service'i kapat
   */
  static async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.initialized = false;
      logger.info('Email service closed');
    }
  }
} 