// Ortak tipler - hem frontend hem backend kullanacak

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  language: string;
  theme: 'light' | 'dark' | 'auto';
  categories: string[];
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
  sourceId: number;
  source?: Source;
  title: string;
  description?: string;
  content?: string;
  summary?: string;
  url: string;
  author?: string;
  publishedDate?: string;
  fetchedDate: string;
  hash: string;
  category?: string;
  tags?: string[];
  language: string;
  viewCount: number;
  isFeatured: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: number;
  userId: number;
  sourceId?: number;
  keywords?: string[];
  notificationType: 'email' | 'push' | 'both';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: number;
  userId: number;
  articleId: number;
  article?: Article;
  createdAt: string;
}

export interface FinancialData {
  id: number;
  dataType: 'exchange_rate' | 'gold_price' | 'interest_rate' | 'inflation';
  currencyCode?: string;
  value: number;
  unit?: string;
  date: string;
  source: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Comment {
  id: number;
  userId: number;
  user?: User;
  articleId: number;
  article?: Article;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  moderatedBy?: number;
  moderationDate?: string;
  parentId?: number;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'new_article' | 'keyword_match' | 'system' | 'subscription';
  title: string;
  message: string;
  articleId?: number;
  article?: Article;
  isRead: boolean;
  isSent: boolean;
  scheduledFor?: string;
  createdAt: string;
}

// Frontend-specific types
export interface SearchParams {
  query?: string;
  sourceId?: number;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'relevance' | 'views';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FilterOptions {
  sources: Source[];
  categories: string[];
  dateRanges: Array<{
    label: string;
    value: string;
    from?: string;
    to?: string;
  }>;
}

// Chart/visualization types
export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

export interface ExchangeRateData {
  currency: string;
  buying: number;
  selling: number;
  change: number;
  changePercent: number;
  lastUpdate: string;
}

export interface GoldPriceData {
  type: 'gram' | 'quarter' | 'ounce';
  price: number;
  change: number;
  changePercent: number;
  currency: 'TRY' | 'USD';
  lastUpdate: string;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: 'general' | 'privacy' | 'technical' | 'content' | 'partnership' | 'legal';
}

export interface SubscriptionForm {
  sourceIds: number[];
  keywords: string[];
  notificationType: 'email' | 'push' | 'both';
  frequency: 'immediate' | 'daily' | 'weekly';
}

// API Response wrapper types
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedApiResponse<T = any> extends ApiSuccessResponse<T[]> {
  pagination: PaginationInfo;
}

// Theme and UI types
export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface UIState {
  theme: 'light' | 'dark' | 'auto';
  sidebarOpen: boolean;
  notifications: Notification[];
  loading: boolean;
  error?: string;
}

// Language and localization
export interface LocaleConfig {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
}

export interface TranslationKeys {
  [key: string]: string | TranslationKeys;
}

// Progressive Web App types
export interface PWAInstallPrompt {
  platforms: string[];
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

export interface ServiceWorkerState {
  registration?: ServiceWorkerRegistration;
  waiting?: ServiceWorker;
  updateAvailable: boolean;
  installing: boolean;
}

// Analytics and tracking
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  userId?: number;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId?: number;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  events: AnalyticsEvent[];
  device: {
    type: 'desktop' | 'tablet' | 'mobile';
    os: string;
    browser: string;
  };
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
} 