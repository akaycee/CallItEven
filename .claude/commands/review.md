# Full Codebase Review

Review the **entire CallItEven codebase** for code efficiency and UI/UX aesthetics.

## What to Review

Read every source file in the project:
- **Backend**: All files in `backend/` — `server.js`, `app.js`, `config/`, `middleware/`, `models/`, `routes/`
- **Frontend**: All files in `frontend/src/` — `App.js`, `index.js`, `context/`, `pages/`, `components/`

Do NOT review `node_modules/`, test files (`*.test.js`), or config files (`package.json`, `jest.config.js`).

## Efficiency Checks

For every changed file, check for:

1. **Unnecessary re-renders** — React components missing `useMemo`, `useCallback`, or doing expensive work inside render. State that should be derived instead of stored.
2. **N+1 queries / redundant API calls** — Backend routes making DB queries inside loops, or frontend components fetching the same data multiple times.
3. **Missing error handling** — Async operations without try/catch, unhandled promise rejections, missing loading/error states in UI.
4. **Memory leaks** — useEffect cleanup missing for subscriptions, timers, or event listeners. Mongoose connections not handled properly.
5. **Redundant code** — Duplicated logic that should be extracted into a shared helper/hook/middleware. Dead code or unused imports.
6. **Inefficient data structures** — O(n²) operations that could be O(n), unnecessary array copies, filtering/mapping chains that could be combined.
7. **Security concerns** — Unsanitized user input, missing auth checks on routes, sensitive data in responses (passwords, tokens).
8. **Bundle size** — Importing entire libraries when only a specific export is needed (e.g., `import _ from 'lodash'` vs `import debounce from 'lodash/debounce'`).

## Aesthetics Checks (Frontend only)

For React components and pages, check for:

1. **Consistent spacing & layout** — Margins, paddings, and gaps should follow a consistent scale. No hardcoded pixel values that break the design system.
2. **Color consistency** — Colors should use the theme palette (`theme.palette.primary`, etc.) not arbitrary hex codes. Dark/light mode should be handled via `theme.palette.mode`.
3. **Typography hierarchy** — Proper use of variant props (`h4`, `h5`, `h6`, `body1`, `subtitle1`). Text should be readable with sufficient contrast.
4. **Responsive design** — Components should use MUI's responsive props (`xs`, `sm`, `md`) or `sx` breakpoints. No fixed widths that break on mobile.
5. **Interaction feedback** — Buttons should show loading states, disabled states when appropriate, and hover/focus effects. Forms should show validation errors inline.
6. **Animation consistency** — Transitions should use consistent easing (`cubic-bezier(0.4, 0, 0.2, 1)`) and duration. No janky or competing animations.
7. **Empty & edge states** — Components should handle empty data, loading, and error states gracefully with appropriate messaging and visual treatment.
8. **Accessibility** — Interactive elements should have aria labels, sufficient color contrast, and keyboard navigability.

## Output Format

Organize findings by file. For each issue found, provide:

- **File & line**: Where the issue is
- **Severity**: 🔴 Critical / 🟡 Warning / 🔵 Suggestion
- **Category**: Efficiency or Aesthetics
- **Issue**: What's wrong
- **Fix**: Concise recommended change (describe, don't write full code blocks)

At the end, give a **Commit Verdict**:
- ✅ **Good to commit** — No critical issues found
- ⚠️ **Commit with caution** — Warnings exist but nothing blocking
- 🛑 **Fix before committing** — Critical issues that should be addressed first

$ARGUMENTS
