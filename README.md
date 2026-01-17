# CallItEven

A modern expense splitting web application built with the MERN stack and Material Design. Split bills easily with friends, roommates, or colleagues.

## Features

- 🔐 **User Authentication** - Secure email-based registration and login with JWT
- 👥 **User Search** - Find and add other users by their email address
- 💰 **Expense Management** - Create, view, and delete expenses
- 📊 **Three Split Methods**:
  - **Equal Split** - Divide expenses equally among all participants
  - **Percentage Split** - Assign custom percentages to each person
  - **Unequal Split** - Enter exact amounts for each participant
- 📈 **Balance Summary** - Track who owes you and who you owe
- 🎨 **Material Design UI** - Clean, modern interface with Material-UI components

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
- `POST /api/expenses` - Create new expense
- `GET /api/expenses` - Get all expenses for current user
- `GET /api/expenses/:id` - Get single expense by ID
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/balance/summary` - Get balance summary

## Project Structure

```
CallItEven/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── Expense.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   └── expenses.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Dashboard.js
│   │   │   └── CreateExpense.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Security Features

- Passwords are hashed using bcryptjs before storage
- JWT tokens for secure authentication
- Protected API routes requiring authentication
- Input validation on both frontend and backend

## Future Enhancements

- User profile pictures
- Expense categories and tags
- Payment history and settlement tracking
- Group expense management
- Email notifications
- Export to CSV/PDF
- Multi-currency support
- Mobile responsive improvements

## Contributing

Feel free to fork this project and submit pull requests for any improvements.

## License

ISC
