## Plan: Codebase Inefficiency Audit & Remediation

**TL;DR:** The codebase has significant inefficiencies across both backend and frontend. The most critical backend issues are: zero indexes on the Expense model (every query does a full collection scan), no pagination on any endpoint, in-memory aggregation instead of MongoDB aggregation pipelines, and a DB hit on every authenticated request. The most critical frontend issues are: Dashboard.js is a 2077-line monolith duplicating existing components, CreateExpense/EditExpense are ~90% identical, no API call cancellation anywhere, no debouncing on user search, and zero `React.memo` usage.

---

### Backend Inefficiencies

**P0 — Critical Performance**

1. **No indexes on Expense model** — `backend/models/Expense.js` has zero indexes despite being the most-queried model. Every query on `createdBy`, `paidBy`, `splits.user`, `createdAt`, and `category` does a full collection scan. Add indexes on all five fields, plus a compound index `{ 'splits.user': 1, createdAt: -1 }`.

2. **No pagination on any list endpoint** — Every GET endpoint returns all matching documents unbounded:
   - `backend/routes/expenses.js` L85, `backend/routes/admin.js` L15, `backend/routes/groups.js` L14, `backend/routes/budgets.js` L75, `backend/routes/income.js` L107. As data grows these will degrade severely.

3. **In-memory aggregation instead of MongoDB pipelines** — Balance summary (`backend/routes/expenses.js` L245-249) loads ALL user expenses into Node.js memory and iterates in JS. Same in budget summary (`backend/routes/budgets.js` L81-89) and cashflow (`backend/routes/cashflow.js` L63-80). These should use `$group`/`$sum` aggregation pipelines.

4. **Route ordering bug** — `backend/routes/expenses.js` L240: `/balance/summary` is defined *after* the `/:id` route at L128. A GET to `/api/expenses/balance` matches `/:id` first with `id="balance"`, causing a CastError. Must move it before `/:id`.

**P1 — Significant Performance**

5. **Auth middleware fetches full user on every request** — `backend/middleware/auth.js` L17: `User.findById(decoded.id).select('-password')` hits the DB on every authenticated call, fetching all fields including `notes` (up to 5KB). Should `.select('_id name email isAdmin')` or cache.

6. **No `.lean()` on any read-only query** — ~20+ find/findById calls across all routes return full Mongoose documents with change tracking overhead. Using `.lean()` would be 2-5x faster for reads. Affects every route file.

7. **Over-fetching fields** — Balance summary (`backend/routes/expenses.js` L245-249) populates full user objects but only needs `paidBy`, `splits.user`, `splits.amount`. Same in budgets (`backend/routes/budgets.js` L75-78) and cashflow (`backend/routes/cashflow.js` L57-61).

8. **N+1 query in `validateExpenseUsers`** — `backend/utils/helpers.js` L51-53: separate `findById` for `paidBy` user then `User.find($in)` for split users. Could be combined into one query.

9. **Redundant re-fetch after create** — `backend/routes/groups.js` L89-91 and L131-133: after `Group.create()`, immediately does `Group.findById().populate()` instead of populating the already-returned document.

10. **`save()` triggers unnecessary hooks** — `backend/routes/users.js` L140-141 (theme update) and `backend/routes/admin.js` L48-55 (admin update) use `findById` → `save()`, triggering the `pre('save')` password hash check even when password isn't modified. Use `findByIdAndUpdate` instead.

**P1 — Security**

11. **No rate limiting** — `backend/app.js` has no rate limiting middleware. Login at `backend/routes/auth.js` L89 is vulnerable to brute-force.

12. **CORS wide open** — `backend/app.js` L19: `cors()` with no origin restriction.

13. **30-day JWT with no revocation** — `backend/routes/auth.js` L13. Combined with admin middleware only checking `req.user.isAdmin` from the auth middleware (not re-querying), a revoked admin retains access for up to 30 days.

14. **Error details exposed** — `backend/routes/expenses.js` L74, L228, and `backend/app.js` L42 send `error.message` to clients.

**P2 — Code Quality / Duplication**

15. **Duplicated expense create/update logic** — `backend/routes/expenses.js` L22-74 and L163-230 contain near-identical validation, split calculation, and population blocks.

16. **Duplicated `DEFAULT_CATEGORIES`** — Defined independently in both `backend/routes/categories.js` L17-28 and `backend/routes/budgets.js` L11-22.

17. **User response object constructed 4 times** — Identical `{ _id, name, email, isAdmin, themeMode, token }` shape at `backend/routes/auth.js` L67-73, L109-115, `backend/routes/users.js` L45-51, L90-96. Should be a `toUserResponse()` helper.

18. **Income date-range + recurring expansion duplicated** — Same pattern in `backend/routes/income.js` L82-104 and `backend/routes/cashflow.js` L28-52.

19. **Date range parsing duplicated** — Same `req.query.startDate`/`endDate` with month-fallback logic in `backend/routes/budgets.js` L58-65 and `backend/routes/cashflow.js` L16-23.

20. **Unused import** — `backend/middleware/admin.js` L1: `protect` imported but never used.

21. **Manual `createdAt` instead of Mongoose `timestamps: true`** — All 7 models define `createdAt` manually with `default: Date.now` instead of using the schema `{ timestamps: true }` option.

**P2 — Config/Infra**

22. **No graceful shutdown** — `backend/server.js` never handles `SIGTERM`/`SIGINT` or calls `mongoose.connection.close()`.

23. **No environment validation** — No check that `MONGODB_URI` and `JWT_SECRET` are defined; `jwt.sign()` will silently use `undefined` as the secret.

24. **`console.log` instead of structured logging** — No logging library; `console.error` throughout.

---

### Frontend Inefficiencies

**P0 — Structural / Architectural**

25. **Dashboard.js is a 2077-line monolith** — Contains its own AppBar (duplicating `NavBar`), edit profile dialog (duplicating `EditProfileDialog`), even-up dialog (duplicating `EvenUpDialog`), inline `CreateExpense`, inline `ManageIncome`, plus 35+ `useState` calls. Should decompose into 10+ focused components and use the existing extracted components.

26. **CreateExpense and EditExpense ~90% identical** — `frontend/src/pages/CreateExpense.js` and `frontend/src/pages/EditExpense.js` duplicate form fields, validation, participant management, split calculation, user search, and styling. Should extract a shared `ExpenseForm` component (~500 lines eliminated).

**P0 — API / Data Fetching**

27. **No AbortController cleanup on any `useEffect`** — Every async fetch risks memory leaks and race conditions on unmount. Affects: `Dashboard.js` L133, `CreateExpense.js` L76, `EditExpense.js` L64, `CashFlow.js` L37, `ManageBudgets.js` L71, `ManageIncome.js` L86.

28. **No debouncing on user search** — `CreateExpense.js` L127-148 and `EditExpense.js` L115-128 fire an API request on every keystroke (≥2 chars) with no debounce and no request cancellation.

29. **Double fetch-on-mount** — `ManageBudgets.js` L71-76 and `ManageIncome.js` L86-91 have two overlapping `useEffect` hooks that both call `fetchData()` on mount, causing duplicate API calls.

30. **`validateCategory` fires API call on every input change** — `CreateExpense.js` L98-115 makes a `POST /api/categories` on every category keystroke.

**P1 — Rendering Performance**

31. **Zero `React.memo` on child components** — Every Dashboard state change (35+ state vars) re-renders: `BalanceSummaryCard`, `BudgetOverview`, `CashFlowBarChart`, `CashFlowSankey`, `CategoryPieChart`, `CelebrationOverlay`, `ExpenseSummaryCard`, `RecentActivityList`, `EditProfileDialog`, `EvenUpDialog`.

32. **No `useCallback`/`useMemo` on handlers and derived data** — Dashboard.js: `formatCurrency`, `getSplitTypeLabel`, `handleLogout`, `handleProfileMenuOpen/Close`, `handleThemeToggle`, and 10+ other handlers recreated every render. `getExpensesByCategory()` and `getExpensesWithUser()` filter arrays on every render without memoization.

33. **`new Intl.NumberFormat(...)` created on every `formatCurrency` call** — `Dashboard.js` L332. The formatter should be instantiated once.

34. **CelebrationOverlay confetti recomputed every render** — `CelebrationOverlay.js` L38-48: `[...Array(30)].map` with `Math.random()` runs on every render while visible.

35. **BalanceSummaryCard filters array 4 times** — `BalanceSummaryCard.js` L19-31: 4 separate `.filter()` calls on the same `balances` array; could be a single-pass reduction.

**P1 — Code Duplication**

36. **`formatCurrency` defined identically in 4 files** — `Dashboard.js` L332, `ManageBudgets.js` L155, `ManageIncome.js` L176, `CashFlow.js` L100. Extract to `utils/formatCurrency.js`.

37. **`getDateRange` logic duplicated ~5 times** — `Dashboard.js` L113+L131, `ManageBudgets.js` L82-112, `ManageIncome.js` L100-130, `CashFlow.js` L61-93. Extract to `utils/dateRange.js`.

38. **`getInitials()` defined in both Dashboard.js L160 and NavBar.js L31.**

39. **Login/Register identical light-theme override** — `Login.js` L23-27 and `Register.js` L24-28.

40. **Error/success notification pattern repeated 5+ times** — `[error, setError]` + `[success, setSuccess]` + timeout refs in ManageCategories, ManageUsers, ManageGroups, ManageBudgets, ManageIncome. Should be a `useNotification()` custom hook.

**P2 — Styling**

41. **Gradient strings hardcoded 50+ times** — Identical gradient values like `'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'` copy-pasted throughout. Should be centralized in theme constants.

42. **Dark/light conditional backgrounds copy-pasted** — Dozens of identical `theme.palette.mode === 'dark' ? ... : ...` ternaries for card backgrounds.

43. **`@keyframes` defined inline in `sx` props** — `CelebrationOverlay.js` L23-30, `CategoryPieChart.js` L74-87, `Dashboard.js` L1385-1400. Recreated every render.

44. **Mostly identical MUI shadow overrides** — `index.js` L143-177: 35 shadow entries where entries 5-24 are the same string.

**P2 — Missing UX States**

45. **Plain text "Loading..." instead of spinners** — `CashFlow.js` L122, `ManageCategories.js` L148, `ManageUsers.js` L185, `ManageBudgets.js` L367, `ManageIncome.js` L625. A `LoadingScreen` component exists but isn't used in these pages.

46. **Silent error swallowing** — `Dashboard.js` L957: notes dialog `catch(() => {})`. `Dashboard.js` L310: `handleDeleteExpense` only logs to console.

---

### Verification

After implementing fixes, verify with:
- `npm test` in both `backend/` and `frontend/` to ensure no regressions
- MongoDB `explain()` on key Expense queries to confirm index usage
- React DevTools Profiler to verify reduced re-renders after `React.memo`/`useCallback` changes
- Network tab to confirm debouncing eliminates rapid-fire requests
- Lighthouse performance audit on the frontend

### Key Decisions Required

- **Pagination strategy**: offset-based (`?page=1&limit=20`) vs cursor-based — offset is simpler and sufficient for this app's scale
- **Caching layer for auth**: Redis vs in-memory LRU for user lookups — in-memory is simpler if single-server
- **Dashboard decomposition**: break into sub-components incrementally, or full rewrite leveraging existing `NavBar`/`EditProfileDialog`/`EvenUpDialog`
