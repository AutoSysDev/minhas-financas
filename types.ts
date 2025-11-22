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