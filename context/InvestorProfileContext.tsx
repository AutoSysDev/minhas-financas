// context/InvestorProfileContext.tsx
// Context para perfil de investidor com persistência localStorage + Supabase sync

import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode 
} from 'react';
import type { InvestorProfile, InvestorLevel } from '../types/market';
import { supabase } from '../services/supabase';

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY = 'monely_investor_profile';
const PROFILE_VERSION = 1;

// Perfil padrão para migração de usuários existentes
const DEFAULT_PROFILE: InvestorProfile = {
  level: 'intermediate',
  completedOnboarding: false,
  preferences: {
    showCrypto: true,
    showFx: true,
    showBrazilIndices: true,
    compactMode: false,
  },
  source: 'migration',
  version: PROFILE_VERSION,
};

// ============================================
// CONTEXT
// ============================================

interface InvestorProfileContextType {
  profile: InvestorProfile | null;
  isLoaded: boolean;
  isLoading: boolean;
  setProfile: (profile: Partial<InvestorProfile>) => Promise<void>;
  completeOnboarding: (level: InvestorLevel, preferences?: Partial<InvestorProfile['preferences']>) => Promise<void>;
  updatePreferences: (prefs: Partial<InvestorProfile['preferences']>) => Promise<void>;
  resetProfile: () => Promise<void>;
  // Helpers
  isBeginner: boolean;
  isIntermediate: boolean;
  isAdvanced: boolean;
}

const InvestorProfileContext = createContext<InvestorProfileContextType | null>(null);

// ============================================
// UTILITÁRIOS DE PERSISTÊNCIA
// ============================================

function loadFromStorage(): InvestorProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // Migração de versão
    if (parsed.version !== PROFILE_VERSION) {
      return migrateProfile(parsed);
    }
    
    return parsed;
  } catch (error) {
    console.warn('[InvestorProfile] Failed to load from localStorage:', error);
    return null;
  }
}

function saveToStorage(profile: InvestorProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('[InvestorProfile] Failed to save to localStorage:', error);
  }
}

function migrateProfile(oldProfile: any): InvestorProfile {
  console.log('[InvestorProfile] Migrating profile from version', oldProfile.version);
  
  // Se não tem version, é usuário antigo (pre-onboarding)
  if (!oldProfile.version) {
    return {
      ...DEFAULT_PROFILE,
      level: oldProfile.level || 'intermediate',
      completedOnboarding: !!oldProfile.completedOnboarding,
      preferences: oldProfile.preferences || DEFAULT_PROFILE.preferences,
      source: 'migration',
      detectedAt: oldProfile.detectedAt || new Date().toISOString(),
      version: PROFILE_VERSION,
    };
  }
  
  return { ...oldProfile, version: PROFILE_VERSION };
}

// ============================================
// SUPABASE SYNC (opcional, não bloqueante)
// ============================================

async function syncToSupabase(profile: InvestorProfile): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        investor_level: profile.level,
        investor_preferences: profile.preferences,
        onboarding_completed: profile.completedOnboarding,
        profile_version: profile.version,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });
    
    if (error) throw error;
  } catch (error) {
    // Silencioso - localStorage é source of truth
    console.debug('[InvestorProfile] Supabase sync failed (non-blocking):', error);
  }
}

async function loadFromSupabase(): Promise<InvestorProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // limit(1) em vez de single(): o primeiro acesso do usuário ainda não tem
    // linha em user_profiles e o single() respondia 406 (PGRST116) no console.
    const { data, error } = await supabase
      .from('user_profiles')
      .select('investor_level, investor_preferences, onboarding_completed, profile_version, updated_at')
      .eq('user_id', user.id)
      .limit(1);
    
    const row = data?.[0];
    if (error || !row) return null;
    
    return {
      level: row.investor_level,
      completedOnboarding: row.onboarding_completed,
      preferences: row.investor_preferences || DEFAULT_PROFILE.preferences,
      source: 'supabase',
      detectedAt: row.updated_at,
      version: row.profile_version || PROFILE_VERSION,
    };
  } catch (error) {
    console.debug('[InvestorProfile] Supabase load failed:', error);
    return null;
  }
}

// ============================================
// PROVIDER
// ============================================

export function InvestorProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<InvestorProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Carregar perfil na inicialização
  useEffect(() => {
    let mounted = true;
    
    async function initialize() {
      setIsLoading(true);
      
      // 1. Tentar localStorage (instantâneo)
      const local = loadFromStorage();
      if (local && mounted) {
        setProfileState(local);
        setIsLoaded(true);
        setIsLoading(false);
      }
      
      // 2. Tentar Supabase (background, pode sobrescrever se mais novo)
      try {
        const remote = await loadFromSupabase();
        if (remote && mounted) {
          // Usar o mais recente
          const local = loadFromStorage();
          const useRemote = !local || 
            new Date(remote.detectedAt || 0) > new Date(local.detectedAt || 0);
          
          if (useRemote) {
            setProfileState(remote);
            saveToStorage(remote);
          }
        }
      } catch (error) {
        // Ignorar erros de sync
      }
      
      if (mounted && !isLoaded) {
        setIsLoaded(true);
        setIsLoading(false);
      }
    }
    
    initialize();
    
    return () => { mounted = false; };
  }, []);
  
  // Atualizar perfil (local + supabase)
  const setProfile = useCallback(async (updates: Partial<InvestorProfile>) => {
    const newProfile = { ...profile, ...updates } as InvestorProfile;
    
    // Atualizar estado imediatamente (optimistic)
    if (profile) {
      setProfileState(newProfile);
    }
    
    // Persistir
    saveToStorage(newProfile);
    
    // Sync background
    syncToSupabase(newProfile).catch(console.debug);
  }, [profile]);
  
  // Completar onboarding
  const completeOnboarding = useCallback(async (
    level: InvestorLevel,
    preferences?: Partial<InvestorProfile['preferences']>
  ) => {
    const newProfile: InvestorProfile = {
      ...profile!,
      level,
      completedOnboarding: true,
      preferences: {
        ...profile!.preferences,
        ...preferences,
      },
      source: 'modal',
      detectedAt: new Date().toISOString(),
      version: PROFILE_VERSION,
    };
    
    setProfileState(newProfile);
    saveToStorage(newProfile);
    await syncToSupabase(newProfile);
  }, [profile]);
  
  // Atualizar apenas preferências
  const updatePreferences = useCallback(async (
    prefs: Partial<InvestorProfile['preferences']>
  ) => {
    if (!profile) return;
    
    const newProfile = {
      ...profile,
      preferences: { ...profile.preferences, ...prefs },
      version: PROFILE_VERSION,
    };
    
    setProfileState(newProfile);
    saveToStorage(newProfile);
    syncToSupabase(newProfile).catch(console.debug);
  }, [profile]);
  
  // Reset (para testes/logout)
  const resetProfile = useCallback(async () => {
    const newProfile = { ...DEFAULT_PROFILE, detectedAt: new Date().toISOString() };
    setProfileState(newProfile);
    saveToStorage(newProfile);
    await syncToSupabase(newProfile);
  }, []);
  
  // Helpers computados
  const isBeginner = profile?.level === 'beginner';
  const isIntermediate = profile?.level === 'intermediate';
  const isAdvanced = profile?.level === 'advanced';
  
  const value: InvestorProfileContextType = {
    profile,
    isLoaded,
    isLoading,
    setProfile,
    completeOnboarding,
    updatePreferences,
    resetProfile,
    isBeginner,
    isIntermediate,
    isAdvanced,
  };
  
  return (
    <InvestorProfileContext.Provider value={value}>
      {children}
    </InvestorProfileContext.Provider>
  );
}

// ============================================
// HOOK DE ACESSO
// ============================================

export function useInvestorProfile(): InvestorProfileContextType {
  const context = useContext(InvestorProfileContext);
  
  if (!context) {
    throw new Error(
      'useInvestorProfile must be used within an InvestorProfileProvider'
    );
  }
  
  return context;
}

// ============================================
// HOOKS DE CONVENIÊNCIA
// ============================================

/** Hook apenas para nível (sem disparar re-render por prefs) */
export function useInvestorLevel(): InvestorLevel | null {
  const { profile, isLoaded } = useInvestorProfile();
  return isLoaded ? profile?.level || null : null;
}

/** Hook para verificar se onboarding foi completado */
export function useOnboardingStatus(): { 
  completed: boolean; 
  isLoaded: boolean;
  level: InvestorLevel | null;
} {
  const { profile, isLoaded } = useInvestorProfile();
  return {
    completed: profile?.completedOnboarding ?? false,
    isLoaded,
    level: profile?.level || null,
  };
}

/** Hook para preferências específicas */
export function useInvestorPreferences(): InvestorProfile['preferences'] | null {
  const { profile, isLoaded } = useInvestorProfile();
  return isLoaded ? profile?.preferences || null : null;
}