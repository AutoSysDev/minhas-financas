import { createClient } from '@supabase/supabase-js';

// Opcao A: SQLite local via Flask (:5000) com shim compativel ao Supabase.
// Ativo por padrao; defina VITE_USE_LOCAL_DB=false para voltar ao Supabase cloud.
export const USE_LOCAL_DB = (import.meta.env.VITE_USE_LOCAL_DB ?? 'true') !== 'false';
const LOCAL_API = ((import.meta.env.VITE_LOCAL_API_URL as string | undefined) ?? 'http://localhost:5000').replace(/\/$/, '');
const SESSION_KEY = 'monely_local_session';

type Filter =
  | { kind: 'eq'; col: string; val: any }
  | { kind: 'in'; col: string; vals: any[] }
  | { kind: 'gte'; col: string; val: any }
  | { kind: 'lte'; col: string; val: any }
  | { kind: 'ilike'; col: string; val: any }
  | { kind: 'or'; raw: string };

function encodeVal(v: any): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return encodeURIComponent(String(v));
}

class LocalQuery {
  private table: string;
  private method: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;
  private filters: Filter[] = [];
  private orderBy: string | null = null;
  private rangeVal: [number, number] | null = null;
  private limitVal: number | null = null;
  private singleMode: 'single' | 'maybeSingle' | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_cols = '*'): this {
    if (this.method === 'insert' || this.method === 'update') return this; // .insert(x).select() -> mantem insert
    this.method = 'select';
    return this;
  }
  insert(rows: any): this {
    this.method = 'insert';
    this.payload = rows;
    return this;
  }
  update(obj: any): this {
    this.method = 'update';
    this.payload = obj;
    return this;
  }
  delete(): this {
    this.method = 'delete';
    return this;
  }
  upsert(obj: any): this {
    this.method = 'upsert';
    this.payload = obj;
    return this;
  }
  eq(col: string, val: any): this { this.filters.push({ kind: 'eq', col, val }); return this; }
  in(col: string, vals: any[]): this { this.filters.push({ kind: 'in', col, vals }); return this; }
  gte(col: string, val: any): this { this.filters.push({ kind: 'gte', col, val }); return this; }
  lte(col: string, val: any): this { this.filters.push({ kind: 'lte', col, val }); return this; }
  ilike(col: string, val: any): this { this.filters.push({ kind: 'ilike', col, val }); return this; }
  or(raw: string): this { this.filters.push({ kind: 'or', raw }); return this; }
  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBy = `${col}.${opts?.ascending === false ? 'desc' : 'asc'}`;
    return this;
  }
  range(from: number, to: number): this { this.rangeVal = [from, to]; return this; }
  limit(n: number): this { this.limitVal = n; return this; }
  single(): this { this.singleMode = 'single'; return this; }
  maybeSingle(): this { this.singleMode = 'maybeSingle'; return this; }

  private buildQuery(): string {
    const p = new URLSearchParams();
    for (const f of this.filters) {
      if (f.kind === 'eq') p.append(`${f.col}.eq`, String(f.val));
      else if (f.kind === 'gte') p.append(`${f.col}.gte`, String(f.val));
      else if (f.kind === 'lte') p.append(`${f.col}.lte`, String(f.val));
      else if (f.kind === 'ilike') p.append(`${f.col}.ilike`, String(f.val));
      else if (f.kind === 'in') p.append(`${f.col}.in`, `(${(f.vals ?? []).join(',')})`);
      else if (f.kind === 'or') p.append('or', f.raw);
    }
    if (this.orderBy) p.append('order', this.orderBy);
    if (this.rangeVal) p.append('range', `${this.rangeVal[0]}-${this.rangeVal[1]}`);
    else if (this.limitVal != null) p.append('limit', String(this.limitVal));
    const s = p.toString();
    return s ? `?${s}` : '';
  }

  private idFilter(): string | null {
    const f = this.filters.find((x) => x.kind === 'eq' && (x as any).col === 'id') as any;
    return f ? String(f.val) : null;
  }

  async exec(): Promise<{ data: any; error: any }> {
    try {
      const q = this.buildQuery();
      if (this.method === 'select') {
        const res = await fetch(`${LOCAL_API}/api/table/${this.table}${q}`);
        if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}`, code: 'LOCAL' } };
        let rows = await res.json();
        if (this.singleMode) {
          const first = Array.isArray(rows) ? rows[0] ?? null : rows;
          if (!first) return { data: null, error: { message: 'No rows', code: 'PGRST116' } };
          return { data: first, error: null };
        }
        return { data: rows, error: null };
      }
      if (this.method === 'insert') {
        const res = await fetch(`${LOCAL_API}/api/table/${this.table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          return { data: null, error: { message: (j as any).error || `HTTP ${res.status}`, code: 'LOCAL' } };
        }
        const rows = await res.json();
        if (this.singleMode) return { data: Array.isArray(rows) ? rows[0] ?? null : rows, error: null };
        return { data: rows, error: null };
      }
      if (this.method === 'upsert') {
        const res = await fetch(`${LOCAL_API}/api/upsert/${this.table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.payload),
        });
        const row = await res.json().catch(() => null);
        if (!res.ok) return { data: null, error: { message: (row as any)?.error || `HTTP ${res.status}`, code: 'LOCAL' } };
        return { data: row, error: null };
      }
      if (this.method === 'update') {
        const id = this.idFilter();
        const url = id
          ? `${LOCAL_API}/api/table/${this.table}/${encodeVal(id)}${q}`
          : `${LOCAL_API}/api/table/${this.table}${q}`;
        const res = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.payload),
        });
        if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}`, code: 'LOCAL' } };
        return { data: null, error: null };
      }
      // delete
      const id = this.idFilter();
      const url = id && this.filters.length === 1
        ? `${LOCAL_API}/api/table/${this.table}/${encodeVal(id)}`
        : `${LOCAL_API}/api/table/${this.table}${q}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) return { data: null, error: { message: `HTTP ${res.status}`, code: 'LOCAL' } };
      return { data: null, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e?.message || 'Local DB offline. Verifique `npm run server` (:5000).', code: 'LOCAL' } };
    }
  }

  then(onF?: (v: { data: any; error: any }) => any, onR?: (e: any) => any): Promise<any> {
    return this.exec().then(onF, onR);
  }
}

function readSession(): { user: any } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function toSupabaseUser(u: any) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    user_metadata: { username: u.username, is_premium: true },
  };
}

const localSupabase: any = {
  from: (table: string) => new LocalQuery(table),
  auth: {
    getSession: async () => {
      const s = readSession();
      if (!s?.user) return { data: { session: null } };
      const session = { user: toSupabaseUser(s.user), access_token: s.user.id };
      return { data: { session } };
    },
    getUser: async () => {
      const s = readSession();
      return { data: { user: toSupabaseUser(s?.user) ?? null } };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const res = await fetch(`${LOCAL_API}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) return { data: {}, error: { message: (j as any).error || 'Login inválido' } };
        localStorage.setItem(SESSION_KEY, JSON.stringify({ user: (j as any).user }));
        const session = { user: toSupabaseUser((j as any).user), access_token: (j as any).user.id };
        try {
          window.dispatchEvent(new CustomEvent('monely-local-auth', { detail: session }));
        } catch { /* noop */ }
        return { data: { user: session.user, session }, error: null };
      } catch (e: any) {
        return { data: {}, error: { message: 'API local offline (:5000)' } };
      }
    },
    signUp: async ({ email, password, options }: any) => {
      try {
        const res = await fetch(`${LOCAL_API}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username: options?.data?.username }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) return { data: {}, error: { message: (j as any).error || 'Falha no cadastro' } };
        return { data: { user: toSupabaseUser((j as any).user) }, error: null };
      } catch {
        return { data: {}, error: { message: 'API local offline (:5000)' } };
      }
    },
    signOut: async () => {
      localStorage.removeItem(SESSION_KEY);
      return { error: null };
    },
    onAuthStateChange: (_cb: any) => {
      const handler = (e: any) => {
        try { _cb('SIGNED_IN', e?.detail ?? null); } catch { /* noop */ }
      };
      window.addEventListener('monely-local-auth', handler);
      return { data: { subscription: { unsubscribe: () => window.removeEventListener('monely-local-auth', handler) } } };
    },
  },
  functions: {
    invoke: async () => ({ data: { isPremium: true }, error: null }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
  channel: () => ({
    on: function () { return this; },
    subscribe: () => ({}),
  }),
  removeChannel: async () => ({}),
};

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;
export const LOCAL_API_URL = LOCAL_API;
export const supabase: any = USE_LOCAL_DB
  ? localSupabase
  : supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : localSupabase;
export const isSupabaseReady = Boolean(supabase);
