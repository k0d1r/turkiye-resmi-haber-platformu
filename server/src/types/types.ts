export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  meta?: any;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchFilters {
  query?: string;
  sourceId?: number;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SortOptions {
  sortBy?: 'date' | 'relevance' | 'views';
  sortOrder?: 'asc' | 'desc';
}

// Base entity types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  preferences?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: number;
  name: string;
  description?: string;
  category: 'rss' | 'scraping';
  status: 'active' | 'inactive' | 'error';
  lastFetched?: string;
  fetchInterval: number;
  robotsTxtChecked: boolean;
  isOfficial: boolean;
  iconUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Article {
  id: number;
  title: string;
  description?: string;
  content?: string;
  summary?: string;
  url: string;
  author?: string;
  publishedDate?: string;
  category?: string;
  tags?: string[];
  language: string;
  createdAt: string;
  updatedAt: string;
}

// Veritabanı entity tipleri
export interface DatabaseUser extends User {
  password_hash: string;
  verification_token?: string;
  reset_token?: string;
  reset_token_expires?: Date;
}

export interface DatabaseArticle extends Omit<Article, 'tags'> {
  source_id: number;
  published_date?: Date;
  fetched_date: Date;
  hash: string;
  view_count: number;
  is_featured: boolean;
  tags?: string; // JSON string
  metadata?: string; // JSON string
}

export interface DatabaseSource extends Omit<Source, 'metadata'> {
  base_url: string;
  rss_url?: string;
  last_fetched?: Date;
  fetch_interval: number;
  robots_txt_checked: boolean;
  is_official: boolean;
  icon_url?: string;
  metadata?: string; // JSON string
}

// Error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
  }
}

// RSS Service tipleri
export interface RSSItem {
  title: string;
  description?: string;
  link: string;
  pubDate?: Date;
  guid?: string;
  author?: string;
  category?: string;
}

export interface RSSFeed {
  title: string;
  description?: string;
  link: string;
  items: RSSItem[];
  lastBuildDate?: Date;
}

// Financial Data tipleri
export interface ExchangeRate {
  currency: string;
  buying: number;
  selling: number;
  change: number;
  changePercent: number;
  date: Date;
}

export interface GoldPrice {
  type: 'gram' | 'quarter' | 'ounce';
  price: number;
  change: number;
  changePercent: number;
  currency: 'TRY' | 'USD';
  date: Date;
}

// Middleware tipleri
export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

// Scraping tipleri
export interface ScrapingResult {
  url: string;
  title: string;
  description?: string;
  publishedDate?: Date;
  category?: string;
  success: boolean;
  error?: string;
}

export interface ScrapingJob {
  id: string;
  sourceId: number;
  urls: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: ScrapingResult[];
  createdAt: Date;
  completedAt?: Date;
}

// Email template tipleri
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string;
  template: EmailTemplate;
  variables?: Record<string, any>;
}

// Notification tipleri
export interface NotificationPayload {
  userId: number;
  type: 'new_article' | 'keyword_match' | 'system' | 'subscription';
  title: string;
  message: string;
  articleId?: number;
  metadata?: Record<string, any>;
}

// AI/ML tipleri
export interface SummarizationRequest {
  text: string;
  maxLength?: number;
  language?: 'tr' | 'en';
}

export interface SummarizationResponse {
  summary: string;
  confidence: number;
  processingTime: number;
}

// Admin Panel tipleri
export interface AdminStats {
  totalUsers: number;
  totalArticles: number;
  totalSources: number;
  activeSubscriptions: number;
  todayArticles: number;
  weeklyGrowth: number;
  topSources: Array<{
    id: number;
    name: string;
    articleCount: number;
  }>;
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: Date;
  }>;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    connected: boolean;
    responseTime: number;
  };
  scheduler: {
    running: boolean;
    lastRun: Date;
    nextRun: Date;
  };
  services: Array<{
    name: string;
    status: 'online' | 'offline' | 'error';
    lastCheck: Date;
  }>;
}

// Cache tipleri
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  refreshAhead?: boolean;
  tags?: string[];
}

export interface CacheItem<T = any> {
  key: string;
  value: T;
  createdAt: Date;
  expiresAt: Date;
  tags?: string[];
}

// Log tipleri
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  userId?: number;
  ip?: string;
  userAgent?: string;
} 