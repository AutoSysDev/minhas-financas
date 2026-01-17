import React from 'react';

interface IconProps {
  name: string;
  className?: string;
}

const SVG_ICONS: Record<string, (className?: string) => React.ReactElement> = {
  restaurant: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v8" />
      <path d="M10 3v8" />
      <path d="M6 7h4" />
      <path d="M18 3v7a3 3 0 1 1-6 0V3" />
      <path d="M12 21v-6" />
      <path d="M6 21v-6" />
      <path d="M18 21v-6" />
    </svg>
  ),
  directions_car: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="6" rx="2" />
      <path d="M5 8l2-3h10l2 3" />
      <circle cx="7" cy="16" r="2" />
      <circle cx="17" cy="16" r="2" />
    </svg>
  ),
  local_hospital: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 7v10" />
      <path d="M7 12h10" />
    </svg>
  ),
  school: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10l8-4 8 4-8 4-8-4z" />
      <path d="M12 14v6" />
      <path d="M6 12v6" />
      <path d="M18 12v6" />
    </svg>
  ),
  sports_esports: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="10" rx="5" />
      <path d="M8 12h4" />
      <path d="M10 10v4" />
      <circle cx="17" cy="12" r="1" />
      <circle cx="15" cy="10" r="1" />
    </svg>
  ),
  home: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  ),
  checkroom: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6a2 2 0 1 0-2-2" />
      <path d="M12 6c0 2 2 2 2 4s-2 2-2 4" />
      <path d="M4 18h16" />
    </svg>
  ),
  shopping_cart: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6h15l-2 8H8L6 6z" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="18" cy="19" r="1.5" />
    </svg>
  ),
  flight: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16l20-5-6 6-4-1-3 3-1-4-6-1z" />
    </svg>
  ),
  pets: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="9" r="2" />
      <circle cx="17" cy="9" r="2" />
      <circle cx="9" cy="17" r="2" />
      <circle cx="15" cy="17" r="2" />
      <path d="M12 12c2 0 4 2 4 4" />
    </svg>
  ),
  fitness_center: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M7 10v4" />
      <path d="M17 10v4" />
    </svg>
  ),
  local_cafe: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="12" height="8" rx="2" />
      <path d="M16 10h3a3 3 0 0 1 0 6h-3" />
      <path d="M4 16h12" />
    </svg>
  ),
  movie: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M6 6l3 4" />
      <path d="M12 6l3 4" />
      <path d="M18 6l3 4" />
    </svg>
  ),
  music_note: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M12 13V5l8-2v8" />
    </svg>
  ),
  book: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19a4 4 0 0 1 4-4h12v6H8a4 4 0 0 1-4-4z" />
      <path d="M8 5h12v10H8" />
    </svg>
  ),
  payments: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  work: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5h6v2" />
    </svg>
  ),
  trending_up: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  ),
  savings: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14a8 8 0 1 1 16 0v4H4v-4z" />
      <path d="M12 10h2" />
      <circle cx="7" cy="18" r="1" />
      <circle cx="17" cy="18" r="1" />
    </svg>
  ),
  account_balance: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l9 5H3l9-5z" />
      <path d="M4 10h16v10H4z" />
      <path d="M8 14v3" />
      <path d="M12 14v3" />
      <path d="M16 14v3" />
    </svg>
  ),
  category: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="currentColor">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  ),
  more_horiz: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  ),
  shopping_basket: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 11 4-7" />
      <path d="m19 11-4-7" />
      <path d="M2 11h20l-2 11H4L2 11Z" />
      <path d="M6 11v4" />
      <path d="M10 11v4" />
      <path d="M14 11v4" />
      <path d="M18 11v4" />
    </svg>
  ),
  health_and_safety: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  ),
  local_activity: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  shopping_bag: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  local_grocery_store: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  menu_book: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  receipt_long: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  ),
  attach_money: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),

  // === CATEGORY SPECIFIC ICONS (Lucide Style) ===
  cat_food: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  ),
  cat_car: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  cat_health: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  cat_education: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  cat_leisure: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M10 8h.01" />
      <path d="M12 12h.01" />
      <path d="M14 8h.01" />
      <path d="M16 12h.01" />
      <path d="M8 12h.01" />
      <path d="M12 16h.01" />
      <path d="M8 8h.01" />
    </svg>
  ),
  cat_home: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  cat_clothing: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.4a2 2 0 0 0-1.2-1.28l-3.11-1a2 2 0 0 0-1.34 0l-3.11 1a2 2 0 0 0-1.2 1.28L9 10.42V22h6V10.42l-1.38-7.02z" />
    </svg>
  ),
  cat_shopping: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  cat_grocery: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  ),
  cat_travel: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      <path d="M14.05 2a9 9 0 0 0-9 9" />
      <path d="M14.05 6a5 5 0 0 0-5 5" />
    </svg>
  ),
  cat_pets: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 4.916-2.823 6.656 1.29 1.74 2.823.47 2.823.47" />
      <path d="M14 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 4.916 2.823 6.656-1.29 1.74-2.823.47-2.823.47" />
      <path d="M14.267 19a6 6 0 0 1-11.534 0" />
      <path d="M16 19c2 0 4-2 4-5.5S17 8 12 8s-8 2-8 5.5" />
    </svg>
  ),
  cat_gym: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1" />
      <path d="m3 3 1 1" />
      <path d="m18 22 4-4" />
      <path d="m2 6 4-4" />
      <path d="m3 10 7-7" />
      <path d="m14 21 7-7" />
    </svg>
  ),
  cat_coffee: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  cat_movie: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18" />
      <line x1="7" x2="7" y1="2" y2="22" />
      <line x1="17" x2="17" y1="2" y2="22" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <line x1="2" x2="7" y1="7" y2="7" />
      <line x1="2" x2="7" y1="17" y2="17" />
      <line x1="17" x2="22" y1="17" y2="17" />
      <line x1="17" x2="22" y1="7" y2="7" />
    </svg>
  ),
  cat_music: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  cat_books: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  cat_bill: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 2v4a2 2 0 0 0 2 2h4" />
      <path d="M21 22H3" />
      <path d="M16 6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  cat_work: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  cat_invest: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  cat_savings: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 5c-1.5 0-2.8.6-3.8 1.5l-3.7 3.5-2.3-1a2 2 0 0 0-1.8.4L6 10.5" />
      <path d="M2 13a6 6 0 0 0 6 6h6a6 6 0 0 0 6-6v-1a6 6 0 0 0-6-6h-2" />
      <line x1="16" y1="9" x2="16" y2="9.01" />
    </svg>
  ),
  cat_salary: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="12" x="2" y="6" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  cat_freelance: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
    </svg>
  ),
  cat_others: (className = '') => (
    <svg width="1em" height="1em" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
};


export const Icon: React.FC<IconProps> = ({ name, className = '' }) => {
  const Svg = SVG_ICONS[name] || SVG_ICONS[name.toLowerCase()] || SVG_ICONS[name.trim()];
  if (Svg) return Svg(className);
  return (
    <span className={`material-symbols-outlined select-none ${className}`}>{name}</span>
  );
};
