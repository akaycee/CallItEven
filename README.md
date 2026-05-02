# CallItEven

A modern expense splitting, personal budgeting, and income tracking web application built with the MERN stack and Material Design. Split bills with friends, track your own spending, manage income sources, and visualize your cash flow.

## Features

- **User Authentication** - Secure email-based registration and login with JWT
- **User Search** - Find and add other users by their email address
- **Expense Management** - Create, edit, view, and delete expenses
- **Personal Expenses** - Track your own spending without splitting with anyone
- **Three Split Methods**:
  - **Equal Split** - Divide expenses equally among all participants
  - **Percentage Split** - Assign custom percentages to each person
  - **Unequal Split** - Enter exact amounts for each participant
- **Balance Summary** - Track who owes you and who you owe
- **Monthly Budgets** - Set per-category spending limits and track progress
  - Budgets track your share of all expenses (personal + shared)
  - Color-coded progress bars (green/amber/red)
  - Click to drill into expenses by category
- **Material Design UI** - Clean, modern interface with Material-UI components
- **Dark/Light Mode** - Toggle between themes (preference saved per user)
- **Mobile Responsive** - Optimized layouts for phones, tablets, and desktops
- **Groups** - Organize participants into groups for recurring splits
- **Categories** - Categorize expenses with default and custom categories
- **Settlements** - Record payments to even up balances with celebrations
- **Income Tracking** - Track multiple income sources with categories and descriptions
  - Recurring income support (weekly, biweekly, monthly, yearly)
  - Optional group visibility for shared income
  - Date-range filtering with automatic recurrence expansion
- **Cash Flow Visualization** - Dedicated cash flow page with:
  - **Sankey Diagram** - Visual flow from income sources to expense categories (+ savings)
  - **Bar Chart** - Monthly income vs expenses with net savings trend line
  - Summary cards for total income, total expenses, and net savings
  - Date range filters (month, quarter, year, custom) and group filtering
- **Investments** - Track investment accounts with current values
  - **Stock Ticker Mode** - Enter a ticker symbol (e.g., AAPL), verify company name and price via Yahoo Finance, then save with auto-filled current value
  - **Manual Account Mode** - For automated accounts (401k, etc.) with no ticker; manually update the current value
  - **Auto Price Refresh** - Ticker-based investments refresh prices on page load and via a manual Refresh Prices button
  - Portfolio summary with total invested, current value, and gain/loss
  - Doughnut chart breakdown by investment type
- **Savings Goals** - Set and track progress toward savings targets
- **Family Groups** - Create a family, invite members, and view household-wide finances
  - **Household Mode** - Toggle between personal and household views on Dashboard and Cash Flow
  - Hide sensitive personal expenses from family view
- **Notes** - Keep personal financial reminders accessible from the bottom bar
- **Admin Panel** - Manage users, categories, and view platform stats

## Tech Stack

### Frontend
- React 18
- Material-UI (MUI) 5
- React Router 6
- Axios
- Chart.js 4 + react-chartjs-2 (Pie, Bar, Line charts)
- chartjs-chart-sankey (Sankey/alluvial diagrams)
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14 or higher)
- MongoDB (running locally or a MongoDB Atlas connection string)
- npm or yarn package manager

## Installation & Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd CallItEven
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your configuration:
# - Set MONGODB_URI to your MongoDB connection string
# - Set JWT_SECRET to a secure random string
# - Adjust PORT if needed (default: 5000)
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from root)
cd frontend

# Install dependencies
npm install
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (update MONGODB_URI in backend/.env)
```

### 5. Run the Application

#### Development (two terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The application will open at `http://localhost:3000` and the API will run on `http://localhost:5000`.

## Production Deployment (Nginx + PM2)

For running in production on a local machine or server:

### Prerequisites
- [Nginx](https://nginx.org/en/download.html) installed (e.g., extracted to `C:\nginx` on Windows)
- PM2 installed globally: `npm install -g pm2`

### 1. Build the Frontend
```bash
cd frontend
npm run build
```

### 2. Configure Environment
Edit `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/calliteven
JWT_SECRET=<your-secure-random-string>
NODE_ENV=production
```

### 3. Start the Backend with PM2
```bash
cd backend
pm2 start ecosystem.config.js
pm2 status   # verify it shows "online"
```

### 4. Configure Nginx
Copy the provided `nginx.conf` from the project root to your Nginx installation's `conf/` directory. The config:
- Serves `frontend/build/` as static files at `/`
- Proxies `/api/` requests to the Node backend on port 5000
- Enables gzip compression and static asset caching
- Handles React Router with `try_files`

Adjust the `root` path in `nginx.conf` to match your project location.

### 5. Start Nginx
```bash
# Windows
cd C:\nginx && nginx.exe

# Linux
sudo systemctl start nginx
```

### 6. Access the Application
Open `http://localhost` in your browser.

### Management Commands
```bash
# Stop backend
pm2 stop all

# Restart backend
pm2 restart calliteven-api

# View logs
pm2 logs calliteven-api --lines 50 --nostream

# Stop Nginx (Windows)
cd C:\nginx && nginx.exe -s quit

# Stop Nginx (Linux)
sudo systemctl stop nginx
```

## Usage

1. **Register an Account**: Create a new account with your name, email, and password
2. **Login**: Sign in with your credentials
3. **Add Participants**: Search for other users by email to split expenses with them
4. **Create Expenses**: 
   - Enter a description (e.g., "Dinner at restaurant")
   - Specify the total amount
   - Select who paid
   - Choose split method (equal, percentage, or custom amounts)
   - Add participants and their split details
5. **View Dashboard**: See all your expenses and balance summary
6. **Track Balances**: View who owes you money and who you owe

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/search?email={query}` - Search users by email
- `GET /api/users/profile` - Get current user profile

### Expenses
- `POST /api/expenses` - Create new expense (supports `isPersonal` flag)
- `GET /api/expenses` - Get all expenses for current user
- `GET /api/expenses/personal` - Get only personal (non-split) expenses
- `GET /api/expenses/tagged` - Get expenses where user is tagged in splits
- `GET /api/expenses/:id` - Get single expense by ID
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/balance/summary` - Get balance summary

### Budgets
- `GET /api/budgets` - Get all budgets for current user
- `POST /api/budgets` - Create a monthly budget for a category
- `PUT /api/budgets/:id` - Update budget amount
- `DELETE /api/budgets/:id` - Delete a budget
- `GET /api/budgets/summary` - Get budget vs actual spending for the current month

### Income
- `POST /api/income` - Create a new income entry (supports recurring)
- `GET /api/income` - Get all income for current user (with date range filtering and recurrence expansion)
- `GET /api/income/:id` - Get single income entry
- `PUT /api/income/:id` - Update income entry
- `DELETE /api/income/:id` - Delete income entry

### Investments
- `POST /api/investments` - Create a new investment (supports optional `ticker` field)
- `GET /api/investments` - Get all investments (supports `?household=true`, `?type=...`)
- `GET /api/investments/summary` - Get portfolio summary (totals, gain/loss, by-type breakdown)
- `GET /api/investments/lookup/:symbol` - Verify a stock ticker via Yahoo Finance (returns name, price, exchange)
- `PUT /api/investments/refresh-prices` - Refresh current values for all ticker-based investments
- `GET /api/investments/:id` - Get single investment
- `PUT /api/investments/:id` - Update investment (supports `ticker` field)
- `DELETE /api/investments/:id` - Delete investment

### Cash Flow
- `GET /api/cashflow` - Get aggregated cash flow data (income by source, expenses by category, monthly breakdown, totals)

## Project Structure

```
CallItEven/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── admin.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Expense.js
│   │   ├── Income.js
│   │   ├── Investment.js
│   │   ├── SavingsGoal.js
│   │   ├── FamilyGroup.js
│   │   ├── Category.js
│   │   ├── Group.js
│   │   ├── Budget.js
│   │   └── PendingGroupInvite.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── expenses.js
│   │   ├── income.js
│   │   ├── cashflow.js
│   │   ├── categories.js
│   │   ├── groups.js
│   │   ├── budgets.js
│   │   ├── investments.js
│   │   ├── savings.js
│   │   ├── family.js
│   │   └── admin.js
│   ├── tests/
│   ├── utils/
│   │   ├── helpers.js
│   │   └── logger.js
│   ├── app.js
│   ├── server.js
│   ├── ecosystem.config.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── BalanceSummaryCard.js
│   │   │   ├── BottomBar.js
│   │   │   ├── BudgetOverview.js
│   │   │   ├── CashFlowBarChart.js
│   │   │   ├── CashFlowSankey.js
│   │   │   ├── CategoryPieChart.js
│   │   │   ├── CelebrationOverlay.js
│   │   │   ├── EditProfileDialog.js
│   │   │   ├── EvenUpDialog.js
│   │   │   ├── ExpenseForm.js
│   │   │   ├── ExpenseSummaryCard.js
│   │   │   ├── HouseholdToggle.js
│   │   │   ├── LoadingScreen.js
│   │   │   ├── NavBar.js
│   │   │   └── RecentActivityList.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── ColorModeContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── CashFlow.js
│   │   │   ├── CreateExpense.js
│   │   │   ├── EditExpense.js
│   │   │   ├── ManageBudgets.js
│   │   │   ├── ManageCategories.js
│   │   │   ├── ManageFamily.js
│   │   │   ├── ManageGroups.js
│   │   │   ├── ManageIncome.js
│   │   │   ├── ManageInvestments.js
│   │   │   ├── ManageSavings.js
│   │   │   ├── ManageUsers.js
│   │   │   └── NotFound.js
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── nginx.conf
└── README.md
```

## Running Tests

The project includes a comprehensive test suite with **157+ frontend tests** and backend tests covering models, middleware, and routes.

### Backend Tests

Uses **Jest**, **Supertest**, and **mongodb-memory-server** (in-memory MongoDB for isolated testing).

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

**What's covered:**
- **Model tests** — Schema validation, password hashing, split-amount validation, min-members check, compound indexes, `isPersonal` flag behavior, Budget unique constraints
- **Middleware tests** — JWT auth (valid/invalid/expired tokens, 401 responses), admin role gating (403 responses)
- **Route integration tests** — All API endpoints including:
  - Auth: registration, login, pending invite auto-resolve
  - Users: search (excludes admins), profile update, password change
  - Expenses: CRUD for all 3 split types, personal expenses, balance summary calculation, admin exclusion
  - Categories: default/custom categories, admin-only create/delete, expense reassignment
  - Groups: CRUD, pending invites for unknown emails, creator-only permissions
  - Budgets: CRUD, category validation, owner-only access, monthly summary with personal + shared expense aggregation
  - Income: CRUD, recurring income creation/validation, date-range filtering, recurrence expansion, group validation, authorization
  - Investments: CRUD, ticker lookup (valid/invalid/auth), refresh-prices (updates ticker investments, skips manual, handles partial failures), create/update with ticker field
  - Cash Flow: aggregation accuracy, recurring income expansion, user expense share calculation, settlement exclusion, date-range filtering
  - Admin: user management, cascade delete, platform stats

### Frontend Tests (157 tests)

Uses **Jest** (via react-scripts) and **React Testing Library**.

```bash
cd frontend

# Run all tests
npm test

# Run tests once (no watch mode, useful for CI)
npx react-scripts test --watchAll=false

# Run a specific test file
npx react-scripts test --testPathPattern="Login.test"
```

**What's covered:**
- **Component tests** — BalanceSummaryCard, ExpenseSummaryCard, RecentActivityList, CelebrationOverlay, EditProfileDialog, EvenUpDialog, BudgetOverview, CashFlowSankey, CashFlowBarChart
- **Page tests** -- Login, Register, Dashboard, CreateExpense, EditExpense, ManageGroups, ManageCategories, ManageUsers, ManageBudgets, ManageIncome, ManageFamily, ManageInvestments, ManageSavings, CashFlow
- Form rendering, validation (password mismatch, min length), API calls, error display, auth redirects, admin-only access, personal expense toggle, budget progress bars, income CRUD, chart rendering, empty states, household mode toggle

## Security Features

- Passwords are hashed using bcryptjs before storage
- JWT tokens for secure authentication
- Protected API routes requiring authentication
- Input validation on both frontend and backend
- Rate limiting on auth and API routes
- CORS configuration for production domains
- Proxy trust headers for Nginx reverse proxy
- Graceful server shutdown with connection cleanup

## Future Enhancements

- User profile pictures
- Email notifications
- Export to CSV/PDF
- Multi-currency support
- Budget alerts/notifications when approaching limits
- Weekly/yearly budget periods
- Recurring expenses
- Year-over-year financial trends

## Contributing

Feel free to fork this project and submit pull requests for any improvements.

## License

ISC
