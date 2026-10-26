# Findings & Decisions

## Requirements
- Command-line interface / Web Dashboards
- Multi-account management (Bank balances + Credit Cards)
- Transaction categorization with custom icons
- AI-powered financial analysis
- Recurrence and installment support
- Shared accounts and dashboards
- Consistent "Modern Glassmorphism" design system

## Research Findings
- `FinanceContext.tsx` is at 1000+ lines, handling too many responsibilities (Accounts, Transactions, Budgets, Goals, Categories, Investments).
- `financeService.ts` contains duplicate CRUD logic that is already mapped in `FinanceContext`.
- Client-side code manually manages `account.balance` arithmetic (risk of desync).
- Color usage is fragmented between documentation (`DESIGN_SYSTEM.md`), Tailwind config, and hardcoded values in components.
- React Query is utilized for fetching data but mutations often fall back to manual context state management.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Consolidation to `tailwind.config.ts` | Centralizes theme tokens, ensuring design system compliance and easier theme swapping. |
| Specialized Hooks over Monolithic Context | Improves re-render performance by isolating component dependencies. |
| Server-side Balance Arithmetic | Moves critical financial logic to the database (triggers/functions) for data integrity and atomicity. |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Context Bloat | Plan to split into hooks. |
| Design System Drift | Plan to standardize tokens. |

## Resources
- [DESIGN_SYSTEM.md](file:///c:/monelyfinance/DESIGN_SYSTEM.md)
- [FinanceContext.tsx](file:///c:/monelyfinance/context/FinanceContext.tsx)
- [financeService.ts](file:///c:/monelyfinance/services/financeService.ts)
- [tailwind.config.ts](file:///c:/monelyfinance/tailwind.config.ts)

## Visual/Browser Findings
- The UI follows a "Glassmorphism" style: `bg-[#0f1216]` (for dark theme), backdrop blur, subtle borders (`border-white/[0.05]`), and rounded corners (`rounded-2xl`).
- High-contrast text (`text-white`, `text-teal-400`).
- The `Layout.tsx` implements a sophisticated mesh gradient background with noise texture.
