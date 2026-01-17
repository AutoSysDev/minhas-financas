export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER'
}

export interface Account {
  id: string;
  name: string;
  bankName: string;
  type: 'checking' | 'investment' | 'savings' | 'cash';
  balance: number;
  color: string; // Hex color for branding
  logoText?: string; // Initials if no image
  icon?: string; // Icon name or URL
  accountNumber?: string;
  defaultCardId?: string;
  initialBalanceDate?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: string;
  cardId?: string;
  accountId?: string; // Link transaction to an account
  isPaid: boolean;
  installments?: number; // Total de parcelas
  installmentNumber?: number; // Número da parcela atual (Ex: 1 de 10)
  originalTransactionId?: string; // ID para agrupar parcelas
}

export interface Card {
  id: string;
  name: string;
  lastDigits: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'other';
  limit: number;
  currentInvoice: number;
  closingDay: number;
  dueDay: number;
  status: 'active' | 'blocked';
  imageUrl: string;
  color: string;
  accountId?: string; // Link card to an account for auto-payment logic
  linkedAccountId?: string; // Account this card is linked to (for default card feature)
}

export interface Goal {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string;
  icon: string;
  colorClass?: string; // e.g., "bg-primary", "bg-yellow-500"
  textClass?: string; // e.g., "text-primary", "text-yellow-600"
}

export interface GoalTransaction {
  id: string;
  goalId: string;
  amount: number;
  type: 'deposit' | 'withdraw';
  date: string;
  description?: string;
  relatedTransactionId?: string; // If linked to an account transaction
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  isDefault: boolean;
}

export interface Budget {
  id: string;
  category: string;
  spent: number;
  limit: number;
  period: 'monthly' | 'weekly' | 'yearly';
  color: string;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  savings?: number;
}

export interface Investment {
  id: string;
  name: string;
  type: 'renda_fixa' | 'acoes' | 'fiis' | 'cripto' | 'outros';
  amount: number;
  initialAmount: number;
  date: string;
  created_at?: string;
  ticker?: string; // For automation
  quantity?: number; // Number of shares/units
  currentPrice?: number; // Last synced price per unit
  last_sync?: string; // ISO date of last sync

  // Projection / Details Fields
  accountId?: string;
  yieldRate?: number;
  yieldType?: 'yearly' | 'monthly';
  duration?: number;
  durationUnit?: 'months' | 'years';
  taxType?: 'regressive' | 'exempt';
  maturityDate?: string;
  projectedGrossYield?: number;
  projectedTaxAmount?: number;
  projectedNetTotal?: number;
  projectedNetYield?: number;
}

export interface SharedAccount {
  id: string;
  owner_user_id: string;
  created_at: string;
}

export interface SharedAccountMember {
  id: string;
  shared_account_id: string;
  user_id: string;
  role: 'owner' | 'member';
  created_at: string;
  email?: string;
}

export interface SharedAccountInvite {
  id: string;
  shared_account_id: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  owner_user_id: string;
  shared_account_id?: string;
  status: 'open' | 'completed';
  created_at: string;
  itemCount?: number;
  checkedCount?: number;
  totalEstimated?: number;
  totalActual?: number;
}

export interface ShoppingListItem {
  id: string;
  shopping_list_id: string;
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  estimated_price?: number;
  actual_price?: number;
  is_checked: boolean;
  assigned_user_id?: string;
}

export interface FiscalNote {
  id: string;
  transaction_id: string;
  user_id: string;
  nuvem_fiscal_id?: string;
  status: 'pending' | 'processing' | 'authorized' | 'rejected' | 'canceled';
  nfe_number?: string;
  nfe_series?: string;
  xml_url?: string;
  pdf_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}