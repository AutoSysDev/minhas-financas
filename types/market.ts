// types/market.ts
// Tipos unificados para dados de mercado (Frankfurter + CoinGecko + Economia.Awesome)

export type InvestorLevel = 'beginner' | 'intermediate' | 'advanced';

export interface InvestorProfile {
  level: InvestorLevel;
  completedOnboarding: boolean;
  preferences: {
    showCrypto: boolean;
    showFx: boolean;
    showBrazilIndices: boolean;
    compactMode: boolean;
  };
  // Metadados para analytics/migração
  detectedAt?: string;      // ISO timestamp
  source: 'modal' | 'settings' | 'migration' | 'heuristic';
  version: number;          // Para migrações futuras
}

// ============================================
// FRANKFURTER (Câmbio - ECB)
// ============================================

export interface FxLatestResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface FxHistoryResponse {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>; // date -> { currency: rate }
}

export interface FxCurrenciesResponse {
  [currencyCode: string]: string; // code -> name
}

// Snapshot normalizado para o Dashboard
export interface FxSnapshot {
  base: 'BRL';
  date: string;           // YYYY-MM-DD
  rates: Record<string, number>; // USD, EUR, GBP, JPY, CHF, ARS
  // Sparkline 30 dias (USD/BRL)
  sparkline30d: number[];
  // Metadados
  source: 'frankfurter';
  fetchedAt: string;      // ISO timestamp
}

// ============================================
// COINGECKO (Crypto)
// ============================================

export interface CoingeckoSimplePriceResponse {
  [coinId: string]: {
    [currency: string]: number;
    [`${currency}_24h_change`]?: number;
    [`${currency}_market_cap`]?: number;
    [`${currency}_24h_vol`]?: number;
  };
}

export interface CoingeckoMarketsResponse {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: any | null;
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
  price_change_percentage_7d_in_currency?: number;
}

export interface CoingeckoGlobalResponse {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: { [currency: string]: number };
    total_volume: { [currency: string]: number };
    market_cap_percentage: { [coinSymbol: string]: number };
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

export interface CoingeckoTrendingResponse {
  coins: Array<{
    item: {
      id: string;
      coin_id: number;
      name: string;
      symbol: string;
      market_cap_rank: number;
      thumb: string;
      small: string;
      large: string;
      slug: string;
      price_btc: number;
      score: number;
    };
  }>;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  marketCapRank: number;
  priceBtc: number;
  score: number;
}

// Snapshot normalizado para o Dashboard
export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  priceBrl: number;
  priceUsd: number;
  change24h: number;
  change7d: number;
  marketCapBrl: number;
  volume24hBrl: number;
  sparkline7d: number[];
  rank: number;
  image: string;
}

export interface CryptoSnapshot {
  assets: CryptoAsset[];
  global: {
    totalMarketCapBrl: number;
    totalVolume24hBrl: number;
    btcDominance: number;
    ethDominance: number;
    marketCapChange24h: number;
    trending: TrendingCoin[];
  };
  source: 'coingecko';
  fetchedAt: string;
}

// ============================================
// ECONOMIA.AWESOME (Brasil)
// ============================================

export interface AwesomeApiItem {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

export interface AwesomeApiResponse {
  [key: string]: AwesomeApiItem;
}

// Índices econômicos (CDI, SELIC, IPCA, etc.)
export interface BrazilIndexItem {
  name: string;
  value: string;
  date: string;
}

// Snapshot normalizado para o Dashboard
export interface BrazilSnapshot {
  // Índices oficiais (% a.a. ou % a.m.)
  cdi: number;              // % a.a.
  selic: number;            // % a.a.
  ipca12m: number;          // % 12 meses
  igpm12m: number;          // % 12 meses
  poupancaMensal: number;   // % ao mês (0.5% + TR)
  tr: number;               // Taxa Referencial % a.m.
  
  // Câmbio (comercial + turismo)
  usdBrl: number;           // Comercial
  usdBrlTurismo: number;    // Turismo
  eurBrl: number;           // Comercial
  gbpBrl: number;           // Comercial
  btcBrl: number;           // Bitcoin em BRL
  
  // Derivados calculados
  rendimentoReal: number;       // selic - ipca12m (% a.a.)
  spreadTurismo: number;        // usdBrlTurismo - usdBrl
  cdiLiquido: number;           // CDI * 0.775 (após IR 22.5% curto prazo)
  poupancaAnual: number;        // (1 + poupancaMensal)^12 - 1
  
  // Sparkline 30 dias USD/BRL
  usdBrlSparkline30d: number[];
  
  // Metadados
  source: 'economia.awesomeapi' | 'bcb.sgs';
  fetchedAt: string;
  indicesDate: string;    // Data dos índices (geralmente D-1)
}

// ============================================
// DADOS UNIFICADOS DO DASHBOARD
// ============================================

export interface MarketData {
  fx?: FxSnapshot;
  crypto?: CryptoSnapshot;
  brazil?: BrazilSnapshot;
  lastUpdated: string;    // ISO timestamp do dado mais antigo
  investorLevel: InvestorLevel;
}

// Configuração de quais assets carregar por nível
export const ASSETS_BY_LEVEL: Record<InvestorLevel, MarketAssetKey[]> = {
  beginner: ['brazil', 'goals'],
  intermediate: ['fx', 'crypto', 'brazil', 'goals'],
  advanced: ['fx', 'crypto', 'brazil', 'goals', 'analysis'],
};

export type MarketAssetKey = 'fx' | 'crypto' | 'brazil' | 'goals' | 'analysis';

export interface MarketAssetConfig {
  key: MarketAssetKey;
  label: string;
  icon: string;
  description: string;
  requiredLevel: InvestorLevel;
  cacheTime: number;      // ms
  refetchInterval: number; // ms
}

export const MARKET_ASSETS_CONFIG: MarketAssetConfig[] = [
  {
    key: 'fx',
    label: 'Câmbio',
    icon: 'currency_exchange',
    description: 'Taxas de câmbio em tempo real (BCE)',
    requiredLevel: 'intermediate',
    cacheTime: 5 * 60 * 1000,      // 5 min
    refetchInterval: 5 * 60 * 1000,
  },
  {
    key: 'crypto',
    label: 'Criptomoedas',
    icon: 'currency_bitcoin',
    description: 'Preços, market cap, trending (CoinGecko)',
    requiredLevel: 'intermediate',
    cacheTime: 2 * 60 * 1000,      // 2 min
    refetchInterval: 2 * 60 * 1000,
  },
  {
    key: 'brazil',
    label: 'Economia BR',
    icon: 'flag',
    description: 'Selic, CDI, IPCA, câmbio comercial/turismo',
    requiredLevel: 'beginner',
    cacheTime: 30 * 60 * 1000,     // 30 min
    refetchInterval: 30 * 60 * 1000,
  },
  {
    key: 'goals',
    label: 'Metas',
    icon: 'flag',
    description: 'Progresso das metas financeiras',
    requiredLevel: 'beginner',
    cacheTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  },
  {
    key: 'analysis',
    label: 'Análise',
    icon: 'analytics',
    description: 'Correlações, risk metrics, alertas',
    requiredLevel: 'advanced',
    cacheTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  },
];

// ============================================
// ERROS E ESTADOS
// ============================================

export interface MarketError {
  asset: MarketAssetKey;
  message: string;
  code: 'NETWORK_ERROR' | 'RATE_LIMIT' | 'PARSE_ERROR' | 'UNAUTHORIZED' | 'UNKNOWN';
  retryable: boolean;
  timestamp: string;
}

export type MarketDataStatus = 'idle' | 'loading' | 'success' | 'error' | 'partial';

export interface UseMarketDataReturn {
  data: MarketData | null;
  status: MarketDataStatus;
  errors: MarketError[];
  isLoading: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
  lastSuccessfulFetch: string | null;
}