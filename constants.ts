import nubankLogo from './assets/banks/nubank.png';
import interLogo from './assets/banks/inter.jpg';
import c6Logo from './assets/banks/c6.png';
import safraLogo from './assets/banks/safra.svg';
import xpLogo from './assets/banks/xp.svg';
import sicrediLogo from './assets/banks/sicredi.svg';
import sicoobLogo from './assets/banks/sicoob.svg';
import picpayLogo from './assets/banks/picpay.svg';

export const BANKS = [
  { id: 'bb', name: 'Banco do Brasil', color: '#fbf600', icon: 'account_balance' },
  { id: 'original', name: 'Banco Original', color: '#00a470', icon: 'account_balance' },
  { id: 'safra', name: 'Banco Safra', color: '#1a2c4e', icon: 'account_balance', logo: safraLogo },
  { id: 'bradesco', name: 'Bradesco', color: '#cc092f', icon: 'account_balance' },
  { id: 'btg', name: 'BTG Pactual', color: '#000046', icon: 'account_balance' },
  { id: 'c6', name: 'C6 Bank', color: '#242424', icon: 'credit_card', logo: c6Logo },
  { id: 'caixa', name: 'Caixa', color: '#005ca9', icon: 'account_balance' },
  { id: 'inter', name: 'Inter', color: '#ff7a00', icon: 'account_balance_wallet', logo: interLogo },
  { id: 'itau', name: 'Itaú', color: '#ec7000', icon: 'account_balance' },
  { id: 'mercadopago', name: 'Mercado Pago', color: '#009EE3', icon: 'account_balance_wallet' },
  { id: 'neon', name: 'Neon', color: '#00a3e0', icon: 'credit_card' },
  { id: 'next', name: 'Next', color: '#00ff5f', icon: 'arrow_forward' },
  { id: 'nubank', name: 'Nubank', color: '#820ad1', icon: 'account_balance_wallet', logo: nubankLogo },
  { id: 'picpay', name: 'PicPay', color: '#21c25e', icon: 'smartphone', logo: picpayLogo },
  { id: 'santander', name: 'Santander', color: '#ec0000', icon: 'account_balance' },
  { id: 'sicoob', name: 'Sicoob', color: '#00ae9d', icon: 'account_balance', logo: sicoobLogo },
  { id: 'sicredi', name: 'Sicredi', color: '#367a2f', icon: 'account_balance', logo: sicrediLogo },
  { id: 'xp', name: 'XP Investimentos', color: '#000000', icon: 'trending_up', logo: xpLogo },
  { id: 'other', name: 'Outro', color: '#6b7280', icon: 'account_balance' },
];

export const GOAL_ICONS = [
  { id: 'savings', name: 'Economia', icon: 'savings' },
  { id: 'flight_takeoff', name: 'Viagem', icon: 'flight_takeoff' },
  { id: 'directions_car', name: 'Carro', icon: 'directions_car' },
  { id: 'home', name: 'Casa', icon: 'home' },
  { id: 'school', name: 'Educação', icon: 'school' },
  { id: 'favorite', name: 'Saúde/Bem-estar', icon: 'favorite' },
  { id: 'smartphone', name: 'Eletrônicos', icon: 'smartphone' },
  { id: 'computer', name: 'Computador', icon: 'computer' },
  { id: 'shopping_bag', name: 'Compras', icon: 'shopping_bag' },
  { id: 'celebration', name: 'Festa/Evento', icon: 'celebration' },
  { id: 'emergency', name: 'Emergência', icon: 'emergency' },
  { id: 'trending_up', name: 'Investimento', icon: 'trending_up' },
];

export const LEGACY_TO_NEW_MAP: Record<string, string> = {
  // Food & Drink
  'restaurant': 'cat_food',
  'fastfood': 'cat_food',
  'restaurant_menu': 'cat_food',
  'lunch_dining': 'cat_food',
  'dinner_dining': 'cat_food',
  'local_dining': 'cat_food',
  'local_cafe': 'cat_coffee',
  'coffee': 'cat_coffee',
  'local_bar': 'cat_leisure',
  'liquor': 'cat_leisure',

  // Transport
  'directions_car': 'cat_car',
  'commute': 'cat_car',
  'directions_bus': 'cat_car',
  'train': 'cat_car',
  'subway': 'cat_car',
  'local_taxi': 'cat_car',
  'directions_bike': 'cat_leisure',

  // Health
  'local_hospital': 'cat_health',
  'health_and_safety': 'cat_health',
  'medical_services': 'cat_health',
  'healing': 'cat_health',
  'medication': 'cat_health',
  'local_pharmacy': 'cat_health',

  // Education
  'school': 'cat_education',
  'menu_book': 'cat_books', // or cat_education
  'auto_stories': 'cat_education',
  'import_contacts': 'cat_education',

  // Leisure
  'sports_esports': 'cat_leisure',
  'local_activity': 'cat_leisure',
  'sports_soccer': 'cat_leisure',
  'pool': 'cat_leisure',
  'fitness_center': 'cat_gym',
  'gym': 'cat_gym',
  'movie': 'cat_movie',
  'theaters': 'cat_movie',
  'music_note': 'cat_music',
  'headphones': 'cat_music',
  'music_off': 'cat_music',

  // Home
  'home': 'cat_home',
  'house': 'cat_home',
  'apartment': 'cat_home',
  'cottage': 'cat_home',
  'real_estate_agent': 'cat_home',

  // Shopping
  'checkroom': 'cat_clothing',
  'shopping_cart': 'cat_shopping',
  'shopping_bag': 'cat_shopping',
  'local_mall': 'cat_shopping',
  'store': 'cat_shopping',
  'local_grocery_store': 'cat_grocery',
  'shopping_basket': 'cat_grocery',
  'grocery_store': 'cat_grocery',

  // Travel
  'flight': 'cat_travel',
  'flight_takeoff': 'cat_travel',
  'airport_shuttle': 'cat_travel',
  'luggage': 'cat_travel',
  'explore': 'cat_travel',

  // Pets
  'pets': 'cat_pets',

  // Work
  'work': 'cat_work',
  'business_center': 'cat_work',
  'badge': 'cat_work',

  // Financial
  'trending_up': 'cat_invest',
  'show_chart': 'cat_invest',
  'savings': 'cat_savings',
  'account_balance': 'cat_savings',
  'account_balance_wallet': 'cat_savings',
  'attach_money': 'cat_salary',
  'money': 'cat_salary',
  'payments': 'cat_bill',
  'receipt_long': 'cat_bill',
  'credit_card': 'cat_bill',

  // Others
  'category': 'cat_others',
  'more_horiz': 'cat_others',
  'help': 'cat_others',
  'info': 'cat_others',
  'book': 'cat_books',
  'library_books': 'cat_books'
};

export const CATEGORY_DATA = [
  { name: 'Moradia', value: 1200, color: '#137fec' },
  { name: 'Alimentação', value: 800, color: '#16a34a' },
  { name: 'Transporte', value: 400, color: '#820ad1' },
  { name: 'Lazer', value: 300, color: '#ff7a00' },
  { name: 'Outros', value: 200, color: '#ef4444' },
];

export const SAVINGS_HISTORY = [
  { month: 'Jan', savings: 500 },
  { month: 'Fev', savings: 700 },
  { month: 'Mar', savings: 400 },
  { month: 'Abr', savings: 900 },
  { month: 'Mai', savings: 600 },
  { month: 'Jun', savings: 800 },
];

export const MONTHLY_EVOLUTION = [
  { month: 'Jan', income: 3000, expense: 2500 },
  { month: 'Fev', income: 3500, expense: 2800 },
  { month: 'Mar', income: 3200, expense: 2800 },
  { month: 'Abr', income: 4000, expense: 3100 },
  { month: 'Mai', income: 3800, expense: 3200 },
  { month: 'Jun', income: 4200, expense: 3400 },
];
