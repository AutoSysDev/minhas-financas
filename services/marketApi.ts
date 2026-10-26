// services/marketApi.ts
// Serviços para APIs de mercado: Frankfurter (FX), CoinGecko (Crypto), Economia.Awesome (Brasil)

import type {
  FxSnapshot,
  CryptoSnapshot,
  BrazilSnapshot,
  CryptoAsset,
  TrendingCoin,
  AwesomeApiItem,
  FxLatestResponse,
  FxHistoryResponse,
  CoingeckoMarketsResponse,
  CoingeckoGlobalResponse,
  CoingeckoTrendingResponse,
} from '../types/market';

// ============================================
// CONFIGURAÇÕES E CONSTANTES
// ============================================

const API_BASES = {
  FRANKFURTER: 'https://api.frankfurter.app',
  COINGECKO: 'https://api.coingecko.com/api/v3',
  AWESOME: 'https://economia.awesomeapi.com.br/json',
} as const;

// Moedas suportadas pelo Frankfurter (base EUR, mas convertemos para BRL)
const FRANKFURTER_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'ARS'] as const;
type FrankfurterCurrency = typeof FRANKFURTER_CURRENCIES[number];

// Coins principais para o dashboard (top 10 por market cap)
const DASHBOARD_COINS = [
  'bitcoin',
  'ethereum',
  'tether',
  'binancecoin',
  'solana',
  'ripple',
  'staked-ether',
  'usd-coin',
  'cardano',
  'dogecoin',
] as const;

const DASHBOARD_COINS_PARAM = DASHBOARD_COINS.join(',');

// Configuração de retry
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,      // 1s
  maxDelay: 10000,      // 10s
  backoffMultiplier: 2,
};

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Sleep com jitter para evitar thundering herd
 */
function sleep(ms: number): Promise<void> {
  const jitter = Math.random() * 200; // 0-200ms
  return new Promise(resolve => setTimeout(resolve, ms + jitter));
}

/**
 * Exponential backoff retry
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MonelyFinance/1.0',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Rate limit (429) ou server error (5xx) = retryable
        const retryable = response.status === 429 || response.status >= 500;
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & { 
          status: number; 
          retryable: boolean;
        };
        error.status = response.status;
        error.retryable = retryable;
        throw error;
      }
      
      const data = await response.json();
      return data as T;
      
    } catch (error) {
      lastError = error as Error;
      const isRetryable = (error as any).retryable !== false && attempt < retries;
      
      if (!isRetryable) {
        break;
      }
      
      // Exponential backoff
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
        RETRY_CONFIG.maxDelay
      );
      
      console.warn(`[MarketAPI] Retry ${attempt + 1}/${retries} for ${url} after ${delay}ms:`, lastError.message);
      await sleep(delay);
    }
  }
  
  throw lastError || new Error('Fetch failed after retries');
}

/**
 * Formata data para YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calcula data há N dias
 */
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

/**
 * Normaliza sparkline para 30 pontos (preenche com último valor se necessário)
 */
function normalizeSparkline(data: number[], targetLength = 30): number[] {
  if (data.length === 0) return Array(targetLength).fill(0);
  if (data.length >= targetLength) return data.slice(-targetLength);
  
  // Preenche o início com o primeiro valor conhecido
  const padding = Array(targetLength - data.length).fill(data[0]);
  return [...padding, ...data];
}

// ============================================
// FRANKFURTER API (Câmbio)
// ============================================

/**
 * Busca cotações atuais (base BRL)
 */
export async function fetchFxLatest(): Promise<FxSnapshot> {
  const currencies = FRANKFURTER_CURRENCIES.join(',');
  const url = `${API_BASES.FRANKFURTER}/latest?from=BRL&to=${currencies}`;
  
  const response = await fetchWithRetry<FxLatestResponse>(url);
  
  // Buscar histórico 30 dias para sparkline USD/BRL
  const sparkline = await fetchFxSparkline30d('USD');
  
  return {
    base: 'BRL',
    date: response.date,
    rates: response.rates,
    sparkline30d: sparkline,
    source: 'frankfurter',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Busca sparkline 30 dias para uma moeda
 */
async function fetchFxSparkline30d(currency: FrankfurterCurrency): Promise<number[]> {
  const endDate = formatDate(new Date());
  const startDate = daysAgo(30);
  const url = `${API_BASES.FRANKFURTER}/${startDate}..${endDate}?from=BRL&to=${currency}`;
  
  try {
    const response = await fetchWithRetry<FxHistoryResponse>(url);
    const rates = Object.values(response.rates)
      .map(r => r[currency])
      .filter((v): v is number => typeof v === 'number' && !isNaN(v));
    
    return normalizeSparkline(rates);
  } catch (error) {
    console.warn(`[Frankfurter] Failed to fetch sparkline for ${currency}:`, error);
    return [];
  }
}

/**
 * Busca moedas disponíveis
 */
export async function fetchFxCurrencies(): Promise<Record<string, string>> {
  const url = `${API_BASES.FRANKFURTER}/currencies`;
  return fetchWithRetry<Record<string, string>>(url);
}

// ============================================
// COINGECKO API (Crypto)
// ============================================

/**
 * Busca dados de mercado para as top coins (vs BRL + USD)
 */
export async function fetchCryptoMarkets(): Promise<CryptoSnapshot> {
  // Buscar markets (preço, market cap, sparkline)
  const marketsUrl = `${API_BASES.COINGECKO}/coins/markets?vs_currency=brl&ids=${DASHBOARD_COINS_PARAM}&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h,7d`;
  
  const [marketsResponse, globalResponse, trendingResponse] = await Promise.allSettled([
    fetchWithRetry<CoingeckoMarketsResponse[]>(marketsUrl),
    fetchWithRetry<CoingeckoGlobalResponse>(`${API_BASES.COINGECKO}/global`),
    fetchWithRetry<CoingeckoTrendingResponse>(`${API_BASES.COINGECKO}/search/trending`),
  ]);
  
  // Processar markets
  const assets: CryptoAsset[] = [];
  if (marketsResponse.status === 'fulfilled') {
    for (const coin of marketsResponse.value) {
      assets.push({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        priceBrl: coin.current_price,
        priceUsd: 0, // Será preenchido abaixo
        change24h: coin.price_change_percentage_24h || 0,
        change7d: coin.price_change_percentage_7d_in_currency || 0,
        marketCapBrl: coin.market_cap,
        volume24hBrl: coin.total_volume,
        sparkline7d: normalizeSparkline(coin.sparkline_in_7d?.price || [], 30),
        rank: coin.market_cap_rank,
        image: coin.image,
      });
    }
  }
  
  // Buscar preços USD para calcular priceUsd
  try {
    const simplePriceUrl = `${API_BASES.COINGECKO}/simple/price?ids=${DASHBOARD_COINS_PARAM}&vs_currencies=usd`;
    const usdPrices = await fetchWithRetry<Record<string, { usd: number }>>(simplePriceUrl);
    
    assets.forEach(asset => {
      const usdData = usdPrices[asset.id];
      if (usdData?.usd) {
        asset.priceUsd = usdData.usd;
      }
    });
  } catch (error) {
    console.warn('[CoinGecko] Failed to fetch USD prices:', error);
    // Fallback: estimar USD via BRL rate (aproximado)
    const usdBrlRate = 5.5; // fallback rough
    assets.forEach(asset => {
      asset.priceUsd = asset.priceBrl / usdBrlRate;
    });
  }
  
  // Processar global
  let global = {
    totalMarketCapBrl: 0,
    totalVolume24hBrl: 0,
    btcDominance: 0,
    ethDominance: 0,
    marketCapChange24h: 0,
    trending: [] as TrendingCoin[],
  };
  
  if (globalResponse.status === 'fulfilled') {
    const g = globalResponse.value.data;
    global = {
      totalMarketCapBrl: g.total_market_cap.brl || 0,
      totalVolume24hBrl: g.total_volume.brl || 0,
      btcDominance: g.market_cap_percentage.btc || 0,
      ethDominance: g.market_cap_percentage.eth || 0,
      marketCapChange24h: g.market_cap_change_percentage_24h_usd || 0,
      trending: [],
    };
  }
  
  // Processar trending
  if (trendingResponse.status === 'fulfilled') {
    global.trending = trendingResponse.value.coins.slice(0, 5).map(c => ({
      id: c.item.id,
      name: c.item.name,
      symbol: c.item.symbol.toUpperCase(),
      marketCapRank: c.item.market_cap_rank,
      priceBtc: c.item.price_btc,
      score: c.item.score,
    }));
  }
  
  return {
    assets,
    global,
    source: 'coingecko',
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Busca preço simples de múltiplas coins (para widgets leves)
 */
export async function fetchCryptoSimplePrices(
  ids: string[] = DASHBOARD_COINS,
  currencies: string[] = ['brl', 'usd']
): Promise<Record<string, Record<string, number>>> {
  const url = `${API_BASES.COINGECKO}/simple/price?ids=${ids.join(',')}&vs_currencies=${currencies.join(',')}&include_24hr_change=true&include_market_cap=true`;
  return fetchWithRetry<Record<string, Record<string, number>>>(url);
}

// ============================================
// ECONOMIA.AWESOME API (Brasil)
// ============================================

/**
 * Busca cotações de câmbio (comercial + turismo)
 */
async function fetchAwesomeFx(): Promise<AwesomeApiResponse> {
  const pairs = 'USD-BRL,EUR-BRL,GBP-BRL,BTC-BRL,USD-BRLT';
  const url = `${API_BASES.AWESOME}/last/${pairs}`;
  return fetchWithRetry<AwesomeApiResponse>(url);
}

/**
 * Busca índices econômicos (CDI, SELIC, IPCA, IGP-M, Poupança, TR)
 */
async function fetchAwesomeIndices(): Promise<AwesomeApiResponse> {
  const indices = 'CDI,SELIC,IPCA,IGP-M,POUPANCA,TR';
  const url = `${API_BASES.AWESOME}/last/${indices}`;
  return fetchWithRetry<AwesomeApiResponse>(url);
}

/**
 * Busca histórico 30 dias USD/BRL
 */
async function fetchAwesomeUsdHistory(): Promise<number[]> {
  const url = `${API_BASES.AWESOME}/daily/USD-BRL/30`;
  
  try {
    const response = await fetchWithRetry<AwesomeApiItem[]>(url);
    const rates = response
      .map(item => parseFloat(item.bid))
      .filter(v => !isNaN(v))
      .reverse(); // API retorna mais recente primeiro, queremos cronológico
    
    return normalizeSparkline(rates);
  } catch (error) {
    console.warn('[AwesomeAPI] Failed to fetch USD history:', error);
    return [];
  }
}

/**
 * Busca todos os dados do Brasil (câmbio + índices)
 */
export async function fetchBrazilSnapshot(): Promise<BrazilSnapshot> {
  const [fxResponse, indicesResponse, usdHistory] = await Promise.allSettled([
    fetchAwesomeFx(),
    fetchAwesomeIndices(),
    fetchAwesomeUsdHistory(),
  ]);
  
  // Parse câmbio
  const fx = fxResponse.status === 'fulfilled' ? fxResponse.value : {};
  const parseFx = (key: string): number => {
    const item = fx[key];
    return item ? parseFloat(item.bid) : 0;
  };
  
  const usdBrl = parseFx('USDBRL');
  const usdBrlTurismo = parseFx('USDBRLT');
  const eurBrl = parseFx('EURBRL');
  const gbpBrl = parseFx('GBPBRL');
  const btcBrl = parseFx('BTCBRL');
  
  // Parse índices
  const indices = indicesResponse.status === 'fulfilled' ? indicesResponse.value : {};
  const parseIndex = (key: string): number => {
    const item = indices[key];
    return item ? parseFloat(item.value) : 0;
  };
  
  const cdi = parseIndex('CDI');
  const selic = parseIndex('SELIC');
  const ipca12m = parseIndex('IPCA');
  const igpm12m = parseIndex('IGP-M');
  const poupancaMensal = parseIndex('POUPANCA');
  const tr = parseIndex('TR');
  
  // Calcular derivados
  const rendimentoReal = selic - ipca12m;
  const spreadTurismo = usdBrlTurismo - usdBrl;
  const cdiLiquido = cdi * 0.775; // Após IR 22.5% (curto prazo)
  const poupancaAnual = Math.pow(1 + poupancaMensal / 100, 12) - 1 * 100;
  
  // Data dos índices (pegar a mais recente)
  const indicesDates = Object.values(indices).map(i => i.date).filter(Boolean);
  const latestIndexDate = indicesDates.sort().pop() || new Date().toISOString().split('T')[0];
  
  return {
    cdi,
    selic,
    ipca12m,
    igpm12m,
    poupancaMensal,
    tr,
    usdBrl,
    usdBrlTurismo,
    eurBrl,
    gbpBrl,
    btcBrl,
    rendimentoReal,
    spreadTurismo,
    cdiLiquido,
    poupancaAnual,
    usdBrlSparkline30d: usdHistory.status === 'fulfilled' ? usdHistory.value : [],
    source: 'economia.awesomeapi',
    fetchedAt: new Date().toISOString(),
    indicesDate: latestIndexDate,
  };
}

// ============================================
// FUNÇÃO UNIFICADA (para uso no hook)
// ============================================

export type MarketAssetKey = 'fx' | 'crypto' | 'brazil';

export async function fetchMarketAsset(key: MarketAssetKey): Promise<FxSnapshot | CryptoSnapshot | BrazilSnapshot> {
  switch (key) {
    case 'fx':
      return fetchFxLatest();
    case 'crypto':
      return fetchCryptoMarkets();
    case 'brazil':
      return fetchBrazilSnapshot();
    default:
      throw new Error(`Unknown market asset: ${key}`);
  }
}

// ============================================
// HEALTH CHECKS
// ============================================

export async function checkApiHealth(): Promise<Record<MarketAssetKey, boolean>> {
  const results = await Promise.allSettled([
    fetchWithRetry(`${API_BASES.FRANKFURTER}/latest?from=BRL&to=USD`, { method: 'HEAD' }),
    fetchWithRetry(`${API_BASES.COINGECKO}/ping`, { method: 'HEAD' }),
    fetchWithRetry(`${API_BASES.AWESOME}/last/USD-BRL`, { method: 'HEAD' }),
  ]);
  
  return {
    fx: results[0].status === 'fulfilled',
    crypto: results[1].status === 'fulfilled',
    brazil: results[2].status === 'fulfilled',
  };
}