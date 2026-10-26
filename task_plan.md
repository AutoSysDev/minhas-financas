# Task Plan: Refactoring & Architecture Cleanup

## Goal
Optimize the application architecture by decoupling the bloated `FinanceContext`, consolidating business logic, and standardizing the design system for better scalability and performance.

## Current Phase
Phase 1: Requirements & Discovery

## Phases

### Phase 1: Requirements & Discovery (Completed in previous session)
- [x] Understand user intent and system requirements
- [x] Identify architecture bottlenecks (Bloated context, manual balances)
- [x] Document findings from code review
- **Status:** complete

### Phase 2: Planning & Detailed Design
- [x] Define the new context/hook structure (Transactions, Accounts, Goals, etc.)
- [x] Plan the migration of balance logic to Supabase (Database Triggers/Functions)
- [x] Standardize Tailwind color tokens for consistent theme application
- [x] Get user approval for the proposed technical design (Implicitly given by request to execute)
- **Status:** complete

### Phase 3: Implementation - Design System & UI Cleanup
- [x] Consolidate colors in `tailwind.config.ts`
- [x] Refactor UI components to use standard color tokens
- [x] Implement dynamic icon selection in `NewTransactionModal.tsx`
- **Status:** complete

### Phase 4: Implementation - Context Refactoring
- [x] Decouple `FinanceContext` into smaller, specialized hooks or contexts
- [x] Align `financeService` with the new hook logic to remove duplication
- [x] Implement robust error handling for all data mutations
- **Status:** complete

### Phase 5: Implementation - Database Optimization
- [x] Create Supabase SQL migrations for automatic balance calculations
- [x] Remove manual client-side balance adjustments
- [x] Test atomic transaction operations
- **Status:** complete

### Phase 6: Testing & Verification
- [ ] Verify all financial flows (transactions, budgets, goals)
- [ ] Validate theme consistency in both Light and Dark modes
- [ ] Perform performance audit on re-renders
- **Status:** pending

## Key Questions
1. Should we move entirely to specialized hooks (e.g., `useTransactions()`) instead of a shared `FinanceContext`? (Likely yes, using React Query for state).
2. Which balance calculations are most critical to move to DB triggers first? (Transaction insertions/updates affecting Account balances).

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Use React Query as primary state source | Reduces manual sync logic and provides built-in caching/loading states. |
| Decouple FinanceContext | Prevents global re-renders and makes the codebase more maintainable. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes
- Ensure all changes are backward compatible with existing Supabase schema unless migration is explicitly applied.
- Maintain the "Modern Glassmorphism" aesthetic while standardizing tokens.
