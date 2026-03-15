# CallItEven

A modern expense splitting and personal budgeting web application built with the MERN stack and Material Design. Split bills with friends, track your own spending, and stay on budget.

## Features

- 🔐 **User Authentication** - Secure email-based registration and login with JWT
- 👥 **User Search** - Find and add other users by their email address
- 💰 **Expense Management** - Create, edit, view, and delete expenses
- 🧍 **Personal Expenses** - Track your own spending without splitting with anyone
- 📊 **Three Split Methods**:
  - **Equal Split** - Divide expenses equally among all participants
  - **Percentage Split** - Assign custom percentages to each person
  - **Unequal Split** - Enter exact amounts for each participant
- 📈 **Balance Summary** - Track who owes you and who you owe
- 💵 **Monthly Budgets** - Set per-category spending limits and track progress
  - Budgets track your share of all expenses (personal + shared)
  - Color-coded progress bars (green/amber/red)
  - Click to drill into expenses by category
- 🎨 **Material Design UI** - Clean, modern interface with Material-UI components
- 🌗 **Dark/Light Mode** - Toggle between themes
- 👥 **Groups** - Organize participants into groups for recurring splits
- 🏷️ **Categories** - Categorize expenses with default and custom categories
- 🎉 **Settlements** - Record payments to even up balances

## Tech Stack

### Frontend
- React 18
- Material-UI (MUI) 5
- React Router 6
- Axios
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

You'll need two terminal windows:

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
│   │   ├── Category.js
│   │   ├── Group.js
│   │   ├── Budget.js
│   │   └── PendingGroupInvite.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── expenses.js
│   │   ├── categories.js
│   │   ├── groups.js
│   │   ├── budgets.js
│   │   └── admin.js
│   ├── tests/
│   ├── utils/
│   │   └── helpers.js
│   ├── app.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── BalanceSummaryCard.js
│   │   │   ├── BudgetOverview.js
│   │   │   ├── CategoryPieChart.js
│   │   │   ├── CelebrationOverlay.js
│   │   │   ├── EditProfileDialog.js
│   │   │   ├── EvenUpDialog.js
│   │   │   ├── ExpenseSummaryCard.js
│   │   │   ├── LoadingScreen.js
│   │   │   ├── NavBar.js
│   │   │   └── RecentActivityList.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   ├── CreateExpense.js
│   │   │   ├── EditExpense.js
│   │   │   ├── ManageBudgets.js
│   │   │   ├── ManageCategories.js
│   │   │   ├── ManageGroups.js
│   │   │   ├── ManageUsers.js
│   │   │   └── NotFound.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Running Tests

The project includes a comprehensive test suite with **331 tests** covering both backend and frontend to prevent regressions when adding new features.

### Backend Tests (211 tests)

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
  - Admin: user management, cascade delete, platform stats

### Frontend Tests (120 tests)

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
- **Component tests** — BalanceSummaryCard, ExpenseSummaryCard, RecentActivityList, CelebrationOverlay, EditProfileDialog, EvenUpDialog, BudgetOverview
- **Page tests** — Login, Register, Dashboard, CreateExpense, EditExpense, ManageGroups, ManageCategories, ManageUsers, ManageBudgets
- Form rendering, validation (password mismatch, min length), API calls, error display, auth redirects, admin-only access, personal expense toggle, budget progress bars

## Security Features

- Passwords are hashed using bcryptjs before storage
- JWT tokens for secure authentication
- Protected API routes requiring authentication
- Input validation on both frontend and backend

## Future Enhancements

- User profile pictures
- Payment history and settlement tracking
- Email notifications
- Export to CSV/PDF
- Multi-currency support
- Mobile responsive improvements
- Budget alerts/notifications when approaching limits
- Weekly/yearly budget periods
- Recurring expenses

## Contributing

Feel free to fork this project and submit pull requests for any improvements.

## License

ISC
