import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { rssRateLimit } from '../middleware/rateLimiter';
import { TCMBService } from '../services/tcmbService';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/types';

const router = Router();

/**
 * Döviz kurları
 */
router.get('/exchange-rates', [
  rssRateLimit,
  optionalAuth,
  query('date').optional().isISO8601().withMessage('Geçersiz tarih formatı'),
  query('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Para birimi 3 karakter olmalıdır')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    };
    res.status(400).json(response);
    return;
  }

  const { date, currency } = req.query;

  try {
    logger.info('Exchange rates requested', { 
      date, 
      currency, 
      userId: req.user?.id 
    });

    const targetDate = date ? new Date(date as string) : undefined;
    const exchangeRates = await TCMBService.getExchangeRates(targetDate);

    // Specific currency filter
    const filteredRates = currency 
      ? exchangeRates.filter(rate => rate.currency.toLowerCase() === (currency as string).toLowerCase())
      : exchangeRates;

    // Transform data for frontend
    const transformedRates = filteredRates.map(rate => ({
      currency: rate.currency,
      currencyName: rate.currencyName,
      buying: rate.forexBuying,
      selling: rate.forexSelling,
      banknote: {
        buying: rate.banknoteBuying,
        selling: rate.banknoteSelling
      },
      crossRate: {
        usd: rate.crossRateUSD,
        other: rate.crossRateOther
      },
      change: 0, // TODO: Calculate from previous day
      changePercent: 0, // TODO: Calculate from previous day
      lastUpdate: rate.date.toISOString()
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        rates: transformedRates,
        date: targetDate || new Date(),
        source: 'TCMB',
        count: transformedRates.length
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Exchange rates error: ${error.message}`, { 
      date, 
      currency,
      userId: req.user?.id 
    });
    
    const response: ApiResponse = {
      success: false,
      error: 'Döviz kurları alınamadı'
    };
    res.status(500).json(response);
  }
}));

/**
 * Altın fiyatları
 */
router.get('/gold-prices', [
  rssRateLimit,
  optionalAuth
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Gold prices requested', { userId: req.user?.id });

    const goldPrices = await TCMBService.getGoldPrices();

    // Transform data for frontend
    const transformedPrices = goldPrices.map(price => ({
      name: price.name,
      price: price.price,
      unit: price.unit,
      currency: price.currency,
      change: 0, // TODO: Calculate from previous day
      changePercent: 0, // TODO: Calculate from previous day
      lastUpdate: price.date.toISOString()
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        prices: transformedPrices,
        source: 'TCMB',
        lastUpdate: new Date().toISOString(),
        count: transformedPrices.length
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Gold prices error: ${error.message}`, { userId: req.user?.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Altın fiyatları alınamadı'
    };
    res.status(500).json(response);
  }
}));

/**
 * Tüm finansal veriler (dashboard için)
 */
router.get('/dashboard', [
  rssRateLimit,
  optionalAuth
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    logger.info('Financial dashboard requested', { userId: req.user?.id });

    const financialData = await TCMBService.getAllLatestRates();

    // Major currencies (popüler kurlar)
    const majorCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'JPY'];
    const majorRates = financialData.exchangeRates
      .filter(rate => majorCurrencies.includes(rate.currency))
      .map(rate => ({
        currency: rate.currency,
        currencyName: rate.currencyName,
        buying: rate.forexBuying,
        selling: rate.forexSelling,
        change: 0, // TODO: Calculate
        changePercent: 0, // TODO: Calculate
        trend: 'stable' as 'up' | 'down' | 'stable'
      }));

    // Gold prices summary
    const goldSummary = financialData.goldPrices.map(price => ({
      name: price.name,
      price: price.price,
      unit: price.unit,
      change: 0,
      changePercent: 0,
      trend: 'stable' as 'up' | 'down' | 'stable'
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        majorCurrencies: majorRates,
        goldPrices: goldSummary,
        lastUpdate: financialData.lastUpdate.toISOString(),
        source: 'TCMB',
        summary: {
          totalCurrencies: financialData.exchangeRates.length,
          totalGoldTypes: financialData.goldPrices.length,
          dataAge: Math.floor((Date.now() - financialData.lastUpdate.getTime()) / (1000 * 60)) // minutes
        }
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Financial dashboard error: ${error.message}`, { userId: req.user?.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Finansal dashboard verileri alınamadı'
    };
    res.status(500).json(response);
  }
}));

/**
 * Historical data (chart için)
 */
router.get('/historical/:currency', [
  rssRateLimit,
  optionalAuth,
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Gün sayısı 1-365 arasında olmalıdır')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    };
    res.status(400).json(response);
    return;
  }

  const currency = req.params.currency.toUpperCase();
  const days = parseInt(req.query.days as string) || 30;

  try {
    logger.info('Historical data requested', { 
      currency, 
      days, 
      userId: req.user?.id 
    });

    const historicalData = await TCMBService.getHistoricalRates(currency, days);

    if (historicalData.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Belirtilen para birimi için geçmiş veri bulunamadı'
      };
      res.status(404).json(response);
      return;
    }

    // Chart.js formatına çevir
    const chartData = {
      labels: historicalData.map(item => item.date),
      datasets: [{
        label: `${currency}/TRY`,
        data: historicalData.map(item => item.value),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    // Statistics
    const values = historicalData.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const latest = values[values.length - 1];
    const previous = values[values.length - 2] || latest;
    const change = latest - previous;
    const changePercent = ((change / previous) * 100);

    const response: ApiResponse = {
      success: true,
      data: {
        currency,
        period: `${days} gün`,
        chartData,
        statistics: {
          current: latest,
          change: change,
          changePercent: parseFloat(changePercent.toFixed(2)),
          min: min,
          max: max,
          average: parseFloat(avg.toFixed(4)),
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
        },
        dataPoints: historicalData.length,
        dateRange: {
          from: historicalData[0]?.date,
          to: historicalData[historicalData.length - 1]?.date
        }
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Historical data error: ${error.message}`, { 
      currency, 
      days,
      userId: req.user?.id 
    });
    
    const response: ApiResponse = {
      success: false,
      error: 'Geçmiş veriler alınamadı'
    };
    res.status(500).json(response);
  }
}));

/**
 * Currency converter
 */
router.get('/convert', [
  rssRateLimit,
  optionalAuth,
  query('from').notEmpty().isLength({ min: 3, max: 3 }).withMessage('Kaynak para birimi gereklidir'),
  query('to').notEmpty().isLength({ min: 3, max: 3 }).withMessage('Hedef para birimi gereklidir'),
  query('amount').notEmpty().isFloat({ min: 0 }).withMessage('Geçerli bir miktar giriniz')
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation hatası',
      data: { errors: errors.array() }
    };
    res.status(400).json(response);
    return;
  }

  const { from, to, amount } = req.query;
  const fromCurrency = (from as string).toUpperCase();
  const toCurrency = (to as string).toUpperCase();
  const amountValue = parseFloat(amount as string);

  try {
    logger.info('Currency conversion requested', { 
      from: fromCurrency, 
      to: toCurrency, 
      amount: amountValue,
      userId: req.user?.id 
    });

    const exchangeRates = await TCMBService.getExchangeRates();

    // Find rates
    const fromRate = exchangeRates.find(rate => rate.currency === fromCurrency);
    const toRate = exchangeRates.find(rate => rate.currency === toCurrency);

    // Handle TRY conversions
    let convertedAmount: number;
    let rate: number;

    if (fromCurrency === 'TRY' && toRate?.forexSelling) {
      // TRY to foreign currency
      convertedAmount = amountValue / toRate.forexSelling;
      rate = toRate.forexSelling;
    } else if (toCurrency === 'TRY' && fromRate?.forexBuying) {
      // Foreign currency to TRY
      convertedAmount = amountValue * fromRate.forexBuying;
      rate = fromRate.forexBuying;
    } else if (fromRate?.forexBuying && toRate?.forexSelling) {
      // Foreign to foreign (via TRY)
      const tryAmount = amountValue * fromRate.forexBuying;
      convertedAmount = tryAmount / toRate.forexSelling;
      rate = fromRate.forexBuying / toRate.forexSelling;
    } else {
      const response: ApiResponse = {
        success: false,
        error: 'Belirtilen para birimleri için kur bilgisi bulunamadı'
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        from: fromCurrency,
        to: toCurrency,
        amount: amountValue,
        convertedAmount: parseFloat(convertedAmount.toFixed(4)),
        rate: parseFloat(rate.toFixed(6)),
        calculation: `${amountValue} ${fromCurrency} = ${convertedAmount.toFixed(4)} ${toCurrency}`,
        lastUpdate: new Date().toISOString(),
        source: 'TCMB'
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Currency conversion error: ${error.message}`, { 
      from: fromCurrency, 
      to: toCurrency, 
      amount: amountValue,
      userId: req.user?.id 
    });
    
    const response: ApiResponse = {
      success: false,
      error: 'Dönüştürme işlemi başarısız'
    };
    res.status(500).json(response);
  }
}));

/**
 * Available currencies
 */
router.get('/currencies', [
  rssRateLimit,
  optionalAuth
], asyncHandler(async (req: AuthenticatedRequest, res) => {
  try {
    const exchangeRates = await TCMBService.getExchangeRates();

    const currencies = exchangeRates.map(rate => ({
      code: rate.currency,
      name: rate.currencyName,
      symbol: getCurrencySymbol(rate.currency),
      available: !!rate.forexBuying
    }));

    // Add TRY
    currencies.unshift({
      code: 'TRY',
      name: 'Türk Lirası',
      symbol: '₺',
      available: true
    });

    const response: ApiResponse = {
      success: true,
      data: {
        currencies,
        count: currencies.length,
        lastUpdate: new Date().toISOString()
      }
    };
    
    res.json(response);

  } catch (error: any) {
    logger.error(`Currencies list error: ${error.message}`, { userId: req.user?.id });
    
    const response: ApiResponse = {
      success: false,
      error: 'Para birimi listesi alınamadı'
    };
    res.status(500).json(response);
  }
}));

/**
 * Para birimi sembolü al (helper function)
 */
function getCurrencySymbol(code: string): string {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CHF': 'CHF',
    'CAD': 'C$',
    'AUD': 'A$',
    'CNY': '¥',
    'RUB': '₽',
    'TRY': '₺'
  };
  
  return symbols[code] || code;
}

export { router as financialRoutes }; 