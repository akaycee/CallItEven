# CallItEven — Family Financial Tracking Plan

> **Goal:** Enable couples and families to track income, expenses, investments, and savings as a household while preserving individual financial tracking.

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Family relationship model | Dedicated `FamilyGroup` model | Keeps family logic cleanly separated from friend-group expense splitting |
| Family size | Multi-member (2+) | Supports couples, families with older children, multi-generational |
| Expense visibility | All visible by default, opt-out per expense | Maximizes transparency; privacy preserved with `hideFromFamily` toggle |
| Budget approach | Individual + Family budgets side-by-side | Each person keeps personal budgets; family budgets track combined spending |
| Dashboard UX | "Me / Household" toggle on existing Dashboard | Avoids duplicating the Dashboard; pure presentation components make this a data-scope switch |
| Investment tracking | Dedicated `Investment` model with portfolio tracking | Purchase price, current value, gain/loss, type categorization |
| Savings tracking | Dedicated `SavingsGoal` model with targets | Contributions, deadlines, celebration on completion |

---

## Phase 1 — Backend: Core Family Infrastructure

### 1.1 — `FamilyGroup` Model
- [ ] Create `backend/models/FamilyGroup.js`
  - `name` (String, required, trimmed)
  - `members` ([ObjectId → User], required, min 2)
  - `createdBy` (ObjectId → User, required)
  - `timestamps: true`
  - Index on `members: 1`

### 1.2 — User Model Update
- [ ] Modify `backend/models/User.js`
  - Add `familyGroup` field (ObjectId → FamilyGroup, optional, default: null)

### 1.3 — Family Routes
- [ ] Create `backend/routes/family.js`
  - `POST /api/family` — create FamilyGroup (validate min 2 members, no member already in another family)
  - `GET /api/family` — get current user's family group (populated members)
  - `PUT /api/family/:id` — edit name, add/remove members (creator only)
  - `DELETE /api/family/:id` — delete family group, clear `familyGroup` on all members (creator only)
  - `GET /api/family/members` — quick endpoint returning family member IDs
- [ ] Register in `backend/app.js`: `app.use('/api/family', require('./routes/family'))`

### 1.4 — Tests
- [ ] Create `backend/tests/models/FamilyGroup.test.js`
- [ ] Create `backend/tests/routes/family.test.js`

---

## Phase 2 — Backend: Household Queries (Expenses, Income, Budgets, Cash Flow)

### 2.1 — Expense Visibility Opt-Out
- [ ] Modify `backend/models/Expense.js`
  - Add `hideFromFamily` (Boolean, default: false)
- [ ] Modify `backend/routes/expenses.js`
  - `GET /api/expenses` — support `?household=true` query param
    - Lookup user's `familyGroup`, get all member IDs
    - Query: `splits.user: { $in: familyMemberIds }` AND `hideFromFamily: { $ne: true }`
  - `GET /api/expenses/balance/summary` — support `?household=true`
  - `POST/PUT` — accept `hideFromFamily` in request body
- [ ] Update `backend/tests/routes/expenses.test.js`

### 2.2 — Household Income Queries
- [ ] Modify `backend/routes/income.js`
  - `GET /api/income` — support `?household=true`
    - Change base query to `{ user: { $in: familyMemberIds } }`
    - Pass adjusted query to `fetchIncomeWithRecurring()` (helper already accepts `baseQuery`)
- [ ] Update `backend/tests/routes/income.test.js`

### 2.3 — Family Budgets
- [ ] Modify `backend/models/Budget.js`
  - Add `isFamilyBudget` (Boolean, default: false)
  - Add `familyGroup` (ObjectId → FamilyGroup, optional)
  - Change unique index to `{ user: 1, category: 1, isFamilyBudget: 1 }`
- [ ] Modify `backend/routes/budgets.js`
  - `GET /api/budgets` — support `?household=true` (fetch family budgets)
  - `GET /api/budgets/summary` — support `?household=true`
    - Aggregate expenses for all family members' split amounts per category
- [ ] Update `backend/tests/routes/budgets.test.js`

### 2.4 — Household Cash Flow
- [ ] Modify `backend/routes/cashflow.js`
  - Support `?household=true`
    - Income query: `{ user: { $in: familyMemberIds } }`
    - Expense aggregation: `{ splits.user: { $in: familyMemberIds } }`
  - Response shape unchanged — components are pure presentation
- [ ] Update `backend/tests/routes/cashflow.test.js`

---

## Phase 3 — Backend: Investments & Savings Goals

### 3.1 — Investment Model & Routes
- [ ] Create `backend/models/Investment.js`
  - `user` (ObjectId → User, required)
  - `name` (String, required, trimmed)
  - `type` (String, enum: ['stocks', 'bonds', 'real_estate', 'crypto', 'mutual_fund', 'etf', 'retirement', 'other'], required)
  - `purchasePrice` (Number, required, min: 0)
  - `currentValue` (Number, required, min: 0)
  - `quantity` (Number, default: 1, min: 0)
  - `purchaseDate` (Date, required)
  - `description` (String, trimmed, default: '')
  - `tag` (String, trimmed, default: '')
  - `group` (ObjectId → Group, optional)
  - `hideFromFamily` (Boolean, default: false)
  - `timestamps: true`
  - Index: `{ user: 1, type: 1 }`
  - Virtuals: `totalCost`, `totalValue`, `gainLoss`, `gainLossPercent`
- [ ] Create `backend/routes/investments.js`
  - `POST /api/investments` — create
  - `GET /api/investments` — list (supports `?household=true`, `?type=...`)
  - `GET /api/investments/summary` — portfolio summary: total invested, current value, gain/loss, breakdown by type
  - `GET /api/investments/:id` — single
  - `PUT /api/investments/:id` — update (owner only)
  - `DELETE /api/investments/:id` — delete (owner only)
- [ ] Register in `backend/app.js`
- [ ] Create `backend/tests/models/Investment.test.js`
- [ ] Create `backend/tests/routes/investments.test.js`

### 3.2 — SavingsGoal Model & Routes
- [ ] Create `backend/models/SavingsGoal.js`
  - `user` (ObjectId → User, required)
  - `name` (String, required, trimmed)
  - `targetAmount` (Number, required, min: 0)
  - `currentAmount` (Number, default: 0, min: 0)
  - `deadline` (Date, optional)
  - `category` (String, trimmed, default: 'General')
  - `isFamilyGoal` (Boolean, default: false)
  - `familyGroup` (ObjectId → FamilyGroup, optional)
  - `description` (String, trimmed, default: '')
  - `timestamps: true`
  - Index: `{ user: 1 }`
  - Virtuals: `progress`, `remaining`, `isComplete`
- [ ] Create `backend/routes/savings.js`
  - `POST /api/savings` — create
  - `GET /api/savings` — list (supports `?household=true`)
  - `GET /api/savings/summary` — total saved, goal count, % complete, nearest deadline
  - `PUT /api/savings/:id` — update (owner only, or any family member for family goals)
  - `PUT /api/savings/:id/contribute` — add to `currentAmount`
  - `DELETE /api/savings/:id` — delete (owner only)
- [ ] Register in `backend/app.js`
- [ ] Create `backend/tests/models/SavingsGoal.test.js`
- [ ] Create `backend/tests/routes/savings.test.js`

---

## Phase 4 — Frontend: Family Group Management & Household Toggle

### 4.1 — AuthContext Update
- [ ] Modify `frontend/src/context/AuthContext.js`
  - When user logs in and has `familyGroup`, store family group data (members, name) in context

### 4.2 — Reusable HouseholdToggle Component
- [ ] Create `frontend/src/components/HouseholdToggle.js`
  - Props: `value` ('personal' | 'household'), `onChange`, `familyName`
  - Two toggle buttons: "Me" (Person icon) | "Household" (People icon + family name)
  - Auto-hidden if user has no `familyGroup` (returns null)
  - Uses family gradient palette
- [ ] Create `frontend/src/components/HouseholdToggle.test.js`

### 4.3 — ManageFamily Page
- [ ] Create `frontend/src/pages/ManageFamily.js`
  - No family: "Create Your Family" card with name input + member email search (reuse autocomplete pattern from `ExpenseForm.js`)
  - Has family: show name, member list with avatars, add/remove members, delete family group
  - Emerald-teal gradient palette, glassmorphism card style
- [ ] Create `frontend/src/pages/ManageFamily.test.js`
- [ ] Register `/manage-family` route in `frontend/src/App.js` (lazy-loaded)

### 4.4 — Dashboard Household Toggle
- [ ] Modify `frontend/src/pages/Dashboard.js`
  - Add `viewMode` state: `'personal'` | `'household'`
  - Show `HouseholdToggle` below AppBar (only if user has `familyGroup`)
  - When `household`: append `?household=true` to all API calls
  - All child components (pie chart, activity list, expense summary, budget overview, balance cards) render unchanged — data scope switches underneath

### 4.5 — Expense Form Privacy Toggle
- [ ] Modify `frontend/src/components/ExpenseForm.js`
  - If user has family group → show "Hide from Family" Switch
  - Tooltip: "When enabled, this expense won't appear in household views"
  - Maps to `hideFromFamily` field

---

## Phase 5 — Frontend: Household Views Across Pages

### 5.1 — Cash Flow Household View
- [ ] Modify `frontend/src/pages/CashFlow.js`
  - Add `HouseholdToggle`
  - When `household`: append `?household=true` to `GET /api/cashflow`
  - Sankey and bar chart components need zero changes

### 5.2 — Budgets Household View
- [ ] Modify `frontend/src/pages/ManageBudgets.js`
  - Add "Personal / Family" toggle (via `HouseholdToggle`)
  - Personal mode: current behavior
  - Family mode: shows family budgets, combined spending in progress bars
  - Create/edit form: add `isFamilyBudget` toggle

### 5.3 — Income Household View
- [ ] Modify `frontend/src/pages/ManageIncome.js`
  - Add `HouseholdToggle`
  - When `household`: append `?household=true` to `GET /api/income`
  - Summary stats reflect combined family income

---

## Phase 6 — Frontend: Investments & Savings Pages

### 6.1 — ManageInvestments Page
- [ ] Create `frontend/src/pages/ManageInvestments.js`
  - **Summary cards:** Total Invested (blue), Current Value (emerald), Total Gain/Loss (green/red)
  - **Pie/doughnut chart** by investment type
  - **Investment list:** cards with name, type chip, purchase price, current value, gain/loss %, date, tag
  - **CRUD dialogs** (MUI Dialog + glassmorphism)
  - **Filters:** type, date range, tag, `HouseholdToggle`
  - **`hideFromFamily`** toggle per investment
  - Blue-indigo gradient palette
- [ ] Create `frontend/src/pages/ManageInvestments.test.js`
- [ ] Register `/manage-investments` in `frontend/src/App.js`

### 6.2 — ManageSavings Page
- [ ] Create `frontend/src/pages/ManageSavings.js`
  - **Summary cards:** Total Saved, Active Goals, Goals Completed, Nearest Deadline
  - **Goal cards:** name, category chip, progress bar, "$X of $Y saved", deadline countdown, "Family Goal" badge
  - **Quick "Add Contribution" button** → small dialog with amount input
  - **Celebration:** reuse `CelebrationOverlay` (confetti + "Goal Reached!") when goal hits 100%
  - **CRUD dialogs** for create/edit
  - Purple-emerald gradient palette
  - `HouseholdToggle` for family goals
- [ ] Create `frontend/src/pages/ManageSavings.test.js`
- [ ] Register `/manage-savings` in `frontend/src/App.js`

### 6.3 — Cash Flow Wealth Summary
- [ ] Modify `backend/routes/cashflow.js`
  - Support `?includeWealth=true` — add `investmentSummary` and `savingsSummary` to response
- [ ] Modify `frontend/src/pages/CashFlow.js`
  - Add optional "Wealth Summary" section: "Portfolio Value" (blue card) + "Savings Progress" (purple card)

---

## Phase 7 — Navigation & Polish

### 7.1 — BottomBar Updates
- [ ] Modify `frontend/src/components/BottomBar.js`
  - New **blue capsule:** Add Investment, View Investments
  - Add to **green capsule** or new capsule: Savings Goals
  - Add to **gray capsule (Utilities):** Family

### 7.2 — NavBar Updates
- [ ] Modify `frontend/src/components/NavBar.js`
  - Add "Investments", "Savings", "Family" to profile dropdown menu

### 7.3 — Final Integration Tests
- [ ] Manual test: Register 2 users → create family → verify both see family group
- [ ] Manual test: Create expenses/income as both users → toggle Household on Dashboard → verify combined data
- [ ] Manual test: Create expense with `hideFromFamily: true` → verify hidden in partner's household view
- [ ] Manual test: Add investments → verify portfolio summary and pie chart
- [ ] Manual test: Create savings goal → contribute → verify progress → hit 100% → verify celebration
- [ ] Manual test: Create family budget → both partners spend → verify combined spend
- [ ] Manual test: CashFlow household toggle → verify Sankey shows combined data
- [ ] Run `npm test` in both `backend/` and `frontend/` — all tests pass

---

## File Summary

### New Files (14)
| File | Phase |
|------|-------|
| `backend/models/FamilyGroup.js` | 1 |
| `backend/routes/family.js` | 1 |
| `backend/tests/models/FamilyGroup.test.js` | 1 |
| `backend/tests/routes/family.test.js` | 1 |
| `backend/models/Investment.js` | 3 |
| `backend/routes/investments.js` | 3 |
| `backend/tests/models/Investment.test.js` | 3 |
| `backend/tests/routes/investments.test.js` | 3 |
| `backend/models/SavingsGoal.js` | 3 |
| `backend/routes/savings.js` | 3 |
| `backend/tests/models/SavingsGoal.test.js` | 3 |
| `backend/tests/routes/savings.test.js` | 3 |
| `frontend/src/components/HouseholdToggle.js` | 4 |
| `frontend/src/pages/ManageFamily.js` | 4 |
| `frontend/src/pages/ManageInvestments.js` | 6 |
| `frontend/src/pages/ManageSavings.js` | 6 |

### Modified Files (16)
| File | Phase | Change |
|------|-------|--------|
| `backend/models/User.js` | 1 | Add `familyGroup` field |
| `backend/app.js` | 1, 3 | Register family, investments, savings routes |
| `backend/models/Expense.js` | 2 | Add `hideFromFamily` field |
| `backend/routes/expenses.js` | 2 | `?household=true` support |
| `backend/routes/income.js` | 2 | `?household=true` support |
| `backend/models/Budget.js` | 2 | Add `isFamilyBudget`, `familyGroup`, update unique index |
| `backend/routes/budgets.js` | 2 | `?household=true` support |
| `backend/routes/cashflow.js` | 2, 6 | `?household=true`, `?includeWealth=true` support |
| `frontend/src/context/AuthContext.js` | 4 | Store family group in context |
| `frontend/src/pages/Dashboard.js` | 4 | Add `HouseholdToggle`, switch API calls |
| `frontend/src/components/ExpenseForm.js` | 4 | Add "Hide from Family" toggle |
| `frontend/src/App.js` | 4, 6 | Register new routes |
| `frontend/src/pages/CashFlow.js` | 5, 6 | `HouseholdToggle`, wealth summary |
| `frontend/src/pages/ManageBudgets.js` | 5 | `HouseholdToggle`, family budget toggle |
| `frontend/src/pages/ManageIncome.js` | 5 | `HouseholdToggle` |
| `frontend/src/components/BottomBar.js` | 7 | New capsules for Investments, Savings, Family |
| `frontend/src/components/NavBar.js` | 7 | New menu items |