// hooks/useMarketData.ts
// Hook principal para dados de mercado com TanStack Query + seleção adaptativa por perfil

import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback, useEffect } from 'react';
import type {
  InvestorLevel,
  MarketData,
  MarketAssetKey,
  MarketError,
  MarketDataStatus,
  UseMarketDataReturn,
  MarketAssetConfig,
  FxSnapshot,
  CryptoSnapshot,
  BrazilSnapshot,
} from '../types/market';
import { ASSETS_BY_LEVEL, MARKET_ASSETS_CONFIG } from '../types/market';
import { fetchMarketAsset, checkApiHealth } from '../services/marketApi';
import { useInvestorProfile } from '../context/InvestorProfileContext';

// ============================================
// QUERY KEYS
// ============================================

const MARKET_QUERY_KEYS = {
  fx: ['market', 'fx'] as const,
  crypto: ['market', 'crypto'] as const,
  brazil: ['market', 'brazil'] as const,
  goals: ['market', 'goals'] as const,
  analysis: ['market', 'analysis'] as const,
  health: ['market', 'health'] as const,
  all: (level: InvestorLevel) => ['market', 'all', level] as const,
} as const;

// ============================================
// FETCH FUNCTIONS COM ERROR HANDLING
// ============================================

async function fetchFx(): Promise<FxSnapshot> {
  return fetchMarketAsset('fx') as Promise<FxSnapshot>;
}

async function fetchCrypto(): Promise<CryptoSnapshot> {
  return fetchMarketAsset('crypto') as Promise<CryptoSnapshot>;
}

async function fetchBrazil(): Promise<BrazilSnapshot> {
  return fetchMarketAsset('brazil') as Promise<BrazilSnapshot>;
}

// Goals e Analysis são placeholders (dados locais/Supabase)
async function fetchGoals(): Promise<null> {
  // TODO: Integrar com goals do Supabase
  return null;
}

async function fetchAnalysis(): Promise<null> {
  // TODO: Implementar análise cruzada
  return null;
}

const FETCH_FUNCTIONS: Record<MarketAssetKey, () => Promise<any>> = {
  fx: fetchFx,
  crypto: fetchCrypto,
  brazil: fetchBrazil,
  goals: fetchGoals,
  analysis: fetchAnalysis,
};

// ============================================
// HOOK PRINCIPAL
// ============================================

export function useMarketData(
  overrideLevel?: InvestorLevel
): UseMarketDataReturn {
  const { profile, isLoaded } = useInvestorProfile();
  const queryClient = useQueryClient();
  
  // Determinar nível efetivo (override para testes ou profile real)
  const effectiveLevel = overrideLevel || profile?.level || 'intermediate';
  const enabledAssets = useMemo(
    () => ASSETS_BY_LEVEL[effectiveLevel],
    [effectiveLevel]
  );
  
  // Criar queries paralelas para cada asset habilitado
  const queries = useQueries({
    queries: enabledAssets.map(assetKey => {
      const config = MARKET_ASSETS_CONFIG.find(c => c.key === assetKey);
      if (!config) {
        return {
          queryKey: ['market', assetKey],
          queryFn: () => Promise.resolve(null),
          enabled: false,
        };
      }
      
      return {
        queryKey: MARKET_QUERY_KEYS[assetKey],
        queryFn: FETCH_FUNCTIONS[assetKey],
        staleTime: config.cacheTime,
        gcTime: config.cacheTime * 2, // Cache mantido 2x o staleTime
        refetchInterval: config.refetchInterval,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          // Retry apenas em erros de rede/rate limit
          const isRetryable = (error as any)?.retryable !== false;
          return isRetryable && failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        enabled: isLoaded && !!profile,
        // Meta para debug
        meta: {
          asset: assetKey,
          level: effectiveLevel,
        },
      };
    }),
  });
  
  // Health check query (rodar periodicamente)
  const healthQuery = useQueries({
    queries: [{
      queryKey: MARKET_QUERY_KEYS.health,
      queryFn: checkApiHealth,
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000,
      refetchInterval: 5 * 60 * 1000,
      enabled: isLoaded,
      retry: 1,
    }],
  });
  
  // Combinar resultados
  const combinedData = useMemo((): MarketData | null => {
    if (!isLoaded || !profile) return null;
    
    const hasAnyData = queries.some(q => q.data);
    if (!hasAnyData) return null;
    
    const errors: MarketError[] = [];
    const partialData: Partial<MarketData> = {
      investorLevel: effectiveLevel,
      lastUpdated: new Date().toISOString(),
    };
    
    queries.forEach((query, index) => {
      const assetKey = enabledAssets[index];
      
      if (query.error) {
        const error = query.error as Error & { status?: number; retryable?: boolean };
        errors.push({
          asset: assetKey,
          message: error.message || 'Erro desconhecido',
          code: error.status === 429 ? 'RATE_LIMIT' : 
                error.status >= 500 ? 'NETWORK_ERROR' : 'UNKNOWN',
          retryable: error.retryable !== false,
          timestamp: new Date().toISOString(),
        });
      } else if (query.data) {
        (partialData as any)[assetKey] = query.data;
      }
    });
    
    // Atualizar lastUpdated com o timestamp mais antigo dos dados bem-sucedidos
    const successfulTimestamps = queries
      .filter(q => q.data && !q.error)
      .map(q => (q.data as any)?.fetchedAt)
      .filter(Boolean);
    
    if (successfulTimestamps.length > 0) {
      partialData.lastUpdated = successfulTimestamps.sort()[0];
    }
    
    return partialData as MarketData;
  }, [queries, enabledAssets, isLoaded, profile, effectiveLevel]);
  
  // Status agregado
  const status = useMemo((): MarketDataStatus => {
    if (!isLoaded) return 'idle';
    if (!profile) return 'idle';
    
    const loading = queries.some(q => q.isLoading);
    const fetching = queries.some(q => q.isFetching);
    const hasErrors = queries.some(q => q.error);
    const hasData = queries.some(q => q.data);
    
    if (loading) return 'loading';
    if (fetching && !hasData) return 'loading';
    if (hasData && hasErrors) return 'partial';
    if (hasErrors && !hasData) return 'error';
    if (hasData) return 'success';
    return 'idle';
  }, [queries, isLoaded, profile]);
  
  // Refetch manual
  const refetch = useCallback(async () => {
    await Promise.all(
      queries.map(q => q.refetch())
    );
  }, [queries]);
  
  // Último fetch bem-sucedido
  const lastSuccessfulFetch = useMemo(() => {
    const timestamps = queries
      .filter(q => q.data && !q.error)
      .map(q => (q.data as any)?.fetchedAt)
      .filter(Boolean)
      .sort();
    return timestamps[0] || null;
  }, [queries]);
  
  // Health status
  const health = useMemo(() => {
    const h = healthQuery[0]?.data;
    return h || { fx: false, crypto: false, brazil: false };
  }, [healthQuery]);
  
  // Expor health no retorno para componentes que precisam
  return {
    data: combinedData,
    status,
    errors: queries.flatMap(q => q.error ? [{
      asset: enabledAssets[queries.indexOf(q)],
      message: (q.error as Error).message,
      code: 'UNKNOWN' as const,
      retryable: true,
      timestamp: new Date().toISOString(),
    }] : []),
    isLoading: status === 'loading',
    isFetching: queries.some(q => q.isFetching),
    refetch,
    lastSuccessfulFetch,
    // Extra: health status para debug/UI
    health,
  };
}

// ============================================
// HOOKS ESPECÍFICOS POR ASSET (para páginas dedicadas)
// ============================================

export function useFxData() {
  return useQueries({
    queries: [{
      queryKey: MARKET_QUERY_KEYS.fx,
      queryFn: fetchFx,
      staleTime: 5 * 60 * 1000,
      refetchInterval: 5 * 60 * 1000,
    }],
  })[0];
}

export function useCryptoData() {
  return useQueries({
    queries: [{
      queryKey: MARKET_QUERY_KEYS.crypto,
      queryFn: fetchCrypto,
      staleTime: 2 * 60 * 1000,
      refetchInterval: 2 * 60 * 1000,
    }],
  })[0];
}

export function useBrazilData() {
  return useQueries({
    queries: [{
      queryKey: MARKET_QUERY_KEYS.brazil,
      queryFn: fetchBrazil,
      staleTime: 30 * 60 * 1000,
      refetchInterval: 30 * 60 * 1000,
    }],
  })[0];
}

// ============================================
// HOOK DE PREFETCH (para navegação antecipada)
// ============================================

export function usePrefetchMarketData() {
  const queryClient = useQueryClient();
  
  const prefetchAll = useCallback(async () => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: MARKET_QUERY_KEYS.fx,
        queryFn: fetchFx,
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: MARKET_QUERY_KEYS.crypto,
        queryFn: fetchCrypto,
        staleTime: 2 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: MARKET_QUERY_KEYS.brazil,
        queryFn: fetchBrazil,
        staleTime: 30 * 60 * 1000,
      }),
    ]);
  }, [queryClient]);
  
  const prefetchAsset = useCallback(async (asset: MarketAssetKey) => {
    const key = MARKET_QUERY_KEYS[asset];
    const fn = FETCH_FUNCTIONS[asset];
    const config = MARKET_ASSETS_CONFIG.find(c => c.key === asset);
    
    if (!key || !fn || !config) return;
    
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: fn,
      staleTime: config.cacheTime,
    });
  }, [queryClient]);
  
  return { prefetchAll, prefetchAsset };
}

// ============================================
// HOOK DE INVALIDAÇÃO (para logout/mudança perfil)
// ============================================

export function useInvalidateMarketData() {
  const queryClient = useQueryClient();
  
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['market'] });
  }, [queryClient]);
}