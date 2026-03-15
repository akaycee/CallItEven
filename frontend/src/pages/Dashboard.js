import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  useTheme,
  CircularProgress,
  Menu,
  Avatar,
  ListItemIcon,
  Chip,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  Add,
  ArrowBack,
  Logout,
  Brightness4,
  Brightness7,
  Edit,
  AccountBalance,
  AccountBalanceWallet,
  AttachMoney,
  ShowChart,
  StickyNote2,
  TrendingUp,
  ShoppingCart,
  Person,
  Delete,
  Receipt,
  CalendarToday,
  LocalOffer,
  People,
} from '@mui/icons-material';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement } from 'chart.js';
import axios from 'axios';
import { FullCelebration, PartialCelebration } from '../components/CelebrationOverlay';
import { BalanceSummaryCard } from '../components/BalanceSummaryCard';
import { ExpenseSummaryCard } from '../components/ExpenseSummaryCard';
import BudgetOverview from '../components/BudgetOverview';
import CreateExpense from './CreateExpense';
import ManageIncome from './ManageIncome';
import { AuthContext } from '../context/AuthContext';
import { ColorModeContext } from '../index';

// Register Chart.js components
Chart.register(ArcElement);

function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { user, logout } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userExpensesDialog, setUserExpensesDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [dateFilter, setDateFilter] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [editProfileDialog, setEditProfileDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState('');
  const [notesDialog, setNotesDialog] = useState(false);
  const [showDockHint, setShowDockHint] = useState(() => !localStorage.getItem('hasSeenDock'));
  const [addExpenseDialog, setAddExpenseDialog] = useState(false);
  const [addIncomeDialog, setAddIncomeDialog] = useState(false);
  const [quickExpenseLoading, setQuickExpenseLoading] = useState(false);
  const [evenUpDialog, setEvenUpDialog] = useState(false);
  const [evenUpAmount, setEvenUpAmount] = useState('');
  const [evenUpError, setEvenUpError] = useState('');
  const [evenUpSuccess, setEvenUpSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPartialCelebration, setShowPartialCelebration] = useState(false);
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [budgetSummary, setBudgetSummary] = useState([]);

  const getBudgetDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        endDate = new Date(now);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : new Date(0);
        endDate = customEndDate ? new Date(customEndDate) : new Date();
        break;
      default:
        startDate = new Date(0);
        endDate = new Date();
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const fetchBudgetSummary = async () => {
    try {
      const { startDate, endDate } = getBudgetDateRange();
      const { data } = await axios.get(`/api/budgets/summary?startDate=${startDate}&endDate=${endDate}`);
      setBudgetSummary(data);
    } catch (error) {
      console.error('Error fetching budget summary:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchBudgetSummary();
  }, [dateFilter, customStartDate, customEndDate]);

  const fetchData = async () => {
    try {
      const [expensesRes, balancesRes] = await Promise.all([
        axios.get('/api/expenses'),
        axios.get('/api/expenses/balance/summary'),
      ]);
      setExpenses(expensesRes.data);
      setBalances(balancesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setProfileMenuAnchor(null);
    logout();
    navigate('/login');
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleThemeToggle = () => {
    colorMode.toggleColorMode();
    setProfileMenuAnchor(null);
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditProfileOpen = () => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
    });
    setProfileError('');
    setProfileSuccess('');
    setEditProfileDialog(true);
    setProfileMenuAnchor(null);
  };

  const handleEditProfileClose = () => {
    setEditProfileDialog(false);
    setProfileForm({ name: '', email: '', password: '', confirmPassword: '' });
    setProfileError('');
    setProfileSuccess('');
  };

  const handleProfileFormChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    setProfileError('');
  };

  const handleProfileSubmit = async () => {
    try {
      setProfileError('');
      setProfileSuccess('');

      // Validation
      if (!profileForm.name.trim()) {
        setProfileError('Name is required');
        return;
      }
      if (!profileForm.email.trim()) {
        setProfileError('Email is required');
        return;
      }
      if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
        setProfileError('Passwords do not match');
        return;
      }
      if (profileForm.password && profileForm.password.length < 6) {
        setProfileError('Password must be at least 6 characters');
        return;
      }

      const updateData = {
        name: profileForm.name,
        email: profileForm.email,
      };

      if (profileForm.password) {
        updateData.password = profileForm.password;
      }

      const response = await axios.put('/api/users/profile', updateData);
      
      // Update localStorage with new user data
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo) {
        userInfo.name = response.data.name;
        userInfo.email = response.data.email;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
      }
      
      setProfileSuccess('Profile updated successfully!');
      
      // Refresh user data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Profile update error:', error);
      if (error.response?.data?.message) {
        setProfileError(error.response.data.message);
      } else if (error.message) {
        setProfileError(`Failed to update profile: ${error.message}`);
      } else {
        setProfileError('Failed to update profile. Please try again.');
      }
    }
  };

  const handleEvenUpOpen = () => {
    if (selectedUser) {
      const balance = balances.find(b => b.user._id === selectedUser._id);
      if (balance) {
        setEvenUpAmount(balance.amount.toString());
      }
    }
    setPaymentMethod('Cash');
    setEvenUpError('');
    setEvenUpSuccess('');
    setEvenUpDialog(true);
  };

  const handleEvenUpClose = () => {
    setEvenUpDialog(false);
    setEvenUpAmount('');
    setPaymentMethod('Cash');
    setEvenUpError('');
    setEvenUpSuccess('');
  };

  const handleEvenUpSubmit = async () => {
    try {
      setEvenUpError('');
      setEvenUpSuccess('');

      const amount = parseFloat(evenUpAmount);
      const balance = balances.find(b => b.user._id === selectedUser._id);

      if (!amount || amount <= 0) {
        setEvenUpError('Amount must be greater than 0');
        return;
      }

      if (amount > balance.amount) {
        setEvenUpError(`Amount cannot exceed ${formatCurrency(balance.amount)}`);
        return;
      }

      // Create a settlement expense
      // The person who owes money is making the payment (paidBy)
      // They owe $0 after paying, the other person owes the full amount
      const settlementData = {
        description: `Settlement with ${selectedUser.name}`,
        totalAmount: amount,
        paidBy: balance.type === 'you_owe' ? user._id : selectedUser._id,
        splitType: 'unequal',
        splits: balance.type === 'you_owe' 
          ? [
              { user: user._id, amount: 0 },
              { user: selectedUser._id, amount: amount }
            ]
          : [
              { user: user._id, amount: amount },
              { user: selectedUser._id, amount: 0 }
            ],
        category: `Settlement - ${paymentMethod}`
      };

      await axios.post('/api/expenses', settlementData);

      setEvenUpSuccess('Settlement recorded successfully!');
      
      // Check if this is a full settlement (balance will be 0)
      const isFullSettlement = amount === balance.amount;
      
      if (isFullSettlement) {
        setShowCelebration(true);
      } else {
        setShowPartialCelebration(true);
      }
      
      setTimeout(() => {
        handleEvenUpClose();
        setUserExpensesDialog(false);
        setSelectedUser(null);
        fetchData();
        fetchBudgetSummary();
        setTimeout(() => {
          setShowCelebration(false);
          setShowPartialCelebration(false);
        }, 500);
      }, 3000);
    } catch (error) {
      console.error('Even up error:', error);
      if (error.response?.data?.message) {
        setEvenUpError(error.response.data.message);
      } else if (error.message) {
        setEvenUpError(`Failed to record settlement: ${error.message}`);
      } else {
        setEvenUpError('Failed to record settlement. Please try again.');
      }
    }
  };

  const handleDeleteExpense = async () => {
    try {
      await axios.delete(`/api/expenses/${expenseToDelete}`);
      setExpenses(expenses.filter((exp) => exp._id !== expenseToDelete));
      setDeleteDialog(false);
      setExpenseToDelete(null);
      fetchData(); // Refresh balances
      fetchBudgetSummary();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const getSplitTypeLabel = (expense) => {
    if (expense?.isPersonal) return 'Personal';
    const type = typeof expense === 'string' ? expense : expense?.splitType;
    const labels = {
      equal: 'Split Equally',
      percentage: 'By Percentage',
      unequal: 'Custom Split',
    };
    return labels[type] || type;
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate) {
          startDate = new Date(customStartDate);
        } else {
          startDate = new Date(0); // Beginning of time if no custom date set
        }
        break;
      default:
        startDate = new Date(0);
    }

    const endDate = dateFilter === 'custom' && customEndDate
      ? new Date(customEndDate)
      : new Date();

    return { startDate, endDate };
  };

  const filteredExpenses = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.createdAt);
      const isInDateRange = expenseDate >= startDate && expenseDate <= endDate;
      const isNotSettlement = !expense.category?.startsWith('Settlement');
      
      // Expense type filter
      let matchesType = true;
      if (expenseTypeFilter === 'personal') {
        matchesType = !!expense.isPersonal;
      } else if (expenseTypeFilter === 'shared') {
        matchesType = !expense.isPersonal;
      }

      // Tag filter
      const matchesTag = !tagFilter || (expense.tag && expense.tag.toLowerCase().includes(tagFilter.toLowerCase()));
      
      return isInDateRange && isNotSettlement && matchesType && matchesTag;
    });
  }, [expenses, dateFilter, customStartDate, customEndDate, expenseTypeFilter, tagFilter]);

  const filteredActivity = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.createdAt);
      const isInDateRange = expenseDate >= startDate && expenseDate <= endDate;
      const isSettlement = expense.category?.startsWith('Settlement');
      
      if (activityFilter === 'expenses') {
        return isInDateRange && !isSettlement;
      } else if (activityFilter === 'settlements') {
        return isInDateRange && isSettlement;
      } else {
        return isInDateRange; // 'all' - show everything
      }
    });
  }, [expenses, dateFilter, customStartDate, customEndDate, activityFilter]);

  const getFilteredExpenses = () => filteredExpenses;
  const getFilteredActivity = () => filteredActivity;

  const getUserShare = (expense) => {
    const userSplit = expense.splits.find(split => split.user._id === user._id);
    return userSplit ? userSplit.amount : 0;
  };

  const expenseStats = useMemo(() => {
    if (filteredExpenses.length === 0) {
      return {
        totalCount: 0,
        totalAmount: 0,
        yourShare: 0,
        averageExpense: 0,
        categoriesUsed: 0,
        largestExpense: 0,
      };
    }

    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
    const yourShare = filteredExpenses.reduce((sum, exp) => sum + getUserShare(exp), 0);
    const categories = new Set(filteredExpenses.map(exp => exp.category || 'Uncategorized'));
    const largestExpense = Math.max(...filteredExpenses.map(exp => exp.totalAmount));

    return {
      totalCount: filteredExpenses.length,
      totalAmount,
      yourShare,
      averageExpense: totalAmount / filteredExpenses.length,
      categoriesUsed: categories.size,
      largestExpense,
    };
  }, [filteredExpenses, user._id]);

  const getExpenseStats = () => expenseStats;

  const categoryData = useMemo(() => {
    const categoryTotals = {};
    
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      const userShare = getUserShare(expense);
      
      if (categoryTotals[category]) {
        categoryTotals[category] += userShare;
      } else {
        categoryTotals[category] = userShare;
      }
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    // Material Design color palette
    const colors = [
      '#06b6d4', // cyan-500
      '#f97316', // orange-500
      '#10b981', // emerald-500
      '#8b5cf6', // violet-500
      '#ef4444', // red-500
      '#f59e0b', // amber-500
      '#ec4899', // pink-500
      '#14b8a6', // teal-500
      '#6366f1', // indigo-500
      '#84cc16', // lime-500
    ];

    // Lighter versions for hover
    const hoverColors = [
      '#22d3ee', // cyan-400
      '#fb923c', // orange-400
      '#34d399', // emerald-400
      '#a78bfa', // violet-400
      '#f87171', // red-400
      '#fbbf24', // amber-400
      '#f472b6', // pink-400
      '#2dd4bf', // teal-400
      '#818cf8', // indigo-400
      '#a3e635', // lime-400
    ];

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        hoverBackgroundColor: hoverColors.slice(0, labels.length),
        borderColor: theme.palette.background.paper,
        borderWidth: 3,
        hoverBorderWidth: 5,
        hoverBorderColor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
        spacing: 2,
        hoverOffset: 25, // Pop out effect on hover
      }]
    };
  }, [filteredExpenses, user._id, theme.palette.background.paper, theme.palette.mode]);

  const getCategoryData = () => categoryData;

  const handleCategoryClick = (event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const category = categoryData.labels[index];
      setSelectedCategory(category);
      setCategoryDialog(true);
    }
  };

  const getExpensesByCategory = () => {
    if (!selectedCategory) return [];
    const filteredExpenses = getFilteredExpenses();
    return filteredExpenses.filter(expense => 
      (expense.category || 'Uncategorized') === selectedCategory
    );
  };

  const handleUserClick = (balance) => {
    setSelectedUser(balance.user);
    setUserExpensesDialog(true);
  };

  const getExpensesWithUser = () => {
    if (!selectedUser) return [];
    
    return expenses.filter(expense => {
      // Check if the selected user is in the expense
      const isInSplits = expense.splits.some(split => split.user._id === selectedUser._id);
      const isPayer = expense.paidBy._id === selectedUser._id;
      const isCurrentUserInvolved = 
        expense.paidBy._id === user._id || 
        expense.splits.some(split => split.user._id === user._id);
      
      return (isInSplits || isPayer) && isCurrentUserInvolved;
    });
  };

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: true,
    onClick: handleCategoryClick,
    onHover: (event, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setHoveredCategory({
          name: categoryData.labels[index],
          amount: categoryData.datasets[0].data[index],
          total: categoryData.datasets[0].data.reduce((a, b) => a + b, 0),
        });
      } else {
        setHoveredCategory(null);
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 13,
            family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            weight: '500',
          },
          color: theme.palette.text.primary,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 12,
          boxHeight: 12,
        }
      },
      tooltip: {
        enabled: false,
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: 'easeInOutQuart',
    },
    cutout: 0,
    radius: '90%',
    interaction: {
      mode: 'index',
      intersect: true,
    },
  }), [categoryData, theme.palette.text.primary]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
      {/* Celebration Overlay */}
      {/* Celebration Overlays */}
      <FullCelebration show={showCelebration} />
      <PartialCelebration show={showPartialCelebration} />

      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 30%, #f97316 60%, #06b6d4 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
        }}
      >
        <Toolbar sx={{ py: 1.5, position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3,
              px: 2,
              py: 1,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Receipt 
              sx={{ 
                fontSize: 32,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }} 
            />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 800,
                letterSpacing: '-0.02em',
                fontSize: '1.5rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              Call It Even
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <IconButton
            onClick={handleProfileMenuOpen}
            sx={{
              p: 0,
              '&:hover': {
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontWeight: 800,
                fontSize: '1.1rem',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                width: 48,
                height: 48,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {getInitials(user?.name)}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: theme.palette.divider,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
            {user?.email}
          </Typography>
        </Box>
        <MenuItem onClick={handleEditProfileOpen}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'text.primary' }}>Edit Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleThemeToggle}>
          <ListItemIcon>
            {theme.palette.mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
          </ListItemIcon>
          <ListItemText sx={{ color: 'text.primary' }}>
            {theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" sx={{ color: '#ef4444' }} />
          </ListItemIcon>
          <ListItemText sx={{ color: '#ef4444' }}>Sign Out</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={editProfileDialog} 
        onClose={handleEditProfileClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Edit Profile
        </DialogTitle>
        <DialogContent>
          {profileError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {profileError}
            </Alert>
          )}
          {profileSuccess && (
            <Alert severity="success" sx={{ mb: 2, mt: 1 }}>
              {profileSuccess}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={profileForm.name}
            onChange={handleProfileFormChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={profileForm.email}
            onChange={handleProfileFormChange}
            margin="normal"
            required
          />
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Leave password fields blank to keep current password
          </Typography>
          <TextField
            fullWidth
            label="New Password"
            name="password"
            type="password"
            value={profileForm.password}
            onChange={handleProfileFormChange}
            margin="normal"
            helperText="Minimum 6 characters"
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={profileForm.confirmPassword}
            onChange={handleProfileFormChange}
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleEditProfileClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleProfileSubmit}
            variant="contained"
            disabled={!profileForm.name || !profileForm.email}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
              },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog
        open={notesDialog}
        onClose={() => setNotesDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle sx={{
          fontWeight: 700,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          My Notes
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, mt: 1, display: 'block' }}>
            Keep track of reminders — e.g., which card expenses have been added through
          </Typography>
          <TextField
            fullWidth
            label="Notes"
            value={userNotes}
            onChange={(e) => { setUserNotes(e.target.value); setNotesSuccess(''); }}
            multiline
            rows={6}
            placeholder="e.g., Chase card expenses added through March 10"
            inputProps={{ maxLength: 5000 }}
            helperText={notesSuccess || `${userNotes.length}/5000`}
            FormHelperTextProps={{
              sx: notesSuccess ? { color: 'success.main' } : {},
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNotesDialog(false)} sx={{ color: 'text.secondary' }}>
            Close
          </Button>
          <Button
            variant="contained"
            disabled={notesSaving}
            onClick={async () => {
              setNotesSaving(true);
              try {
                await axios.put('/api/users/notes', { notes: userNotes });
                setNotesSuccess('Notes saved!');
                setTimeout(() => setNotesSuccess(''), 2000);
              } catch (err) {
                // silently fail
              } finally {
                setNotesSaving(false);
              }
            }}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
              },
            }}
          >
            {notesSaving ? 'Saving...' : 'Save Notes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Expense Dialog (Full Form) */}
      <Dialog
        open={addExpenseDialog}
        onClose={() => setAddExpenseDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'background.default', borderRadius: 3, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
          color: 'white',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Create New Expense</Typography>
          <IconButton color="inherit" onClick={() => setAddExpenseDialog(false)}>
            <ArrowBack />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <CreateExpense isDialog onDone={() => { setAddExpenseDialog(false); fetchData(); }} />
        </DialogContent>
      </Dialog>

      {/* Add Income Dialog (Full Form) */}
      <Dialog
        open={addIncomeDialog}
        onClose={() => setAddIncomeDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'background.default', borderRadius: 3, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
          color: 'white',
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Manage Income</Typography>
          <IconButton color="inherit" onClick={() => setAddIncomeDialog(false)}>
            <ArrowBack />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <ManageIncome isDialog onDone={() => { setAddIncomeDialog(false); fetchData(); }} />
        </DialogContent>
      </Dialog>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 12, pb: 4 }}>
        {/* Balance Summary */}
        <BalanceSummaryCard 
          balances={balances}
          formatCurrency={formatCurrency}
          handleUserClick={handleUserClick}
        />

        {/* Expense Statistics Summary */}
        {!loading && expenses.length > 0 && (
          <>
          {/* Expense Type Filter */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={expenseTypeFilter}
              exclusive
              onChange={(e, value) => { if (value !== null) setExpenseTypeFilter(value); }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 3,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="all">All Expenses</ToggleButton>
              <ToggleButton value="shared">Shared</ToggleButton>
              <ToggleButton value="personal">Personal</ToggleButton>
            </ToggleButtonGroup>
            <TextField
              size="small"
              placeholder="Filter by tag..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              sx={{ ml: 2, minWidth: 160 }}
              InputProps={{
                sx: { fontSize: '0.85rem' },
              }}
            />
          </Box>

          <ExpenseSummaryCard
            expenseStats={expenseStats}
            dateFilter={dateFilter}
            onDateFilterChange={(e) => setDateFilter(e.target.value)}
            customDates={{ startDate: customStartDate, endDate: customEndDate }}
            onCustomDateChange={(e) => {
              if (e.target.name === 'startDate') setCustomStartDate(e.target.value);
              else setCustomEndDate(e.target.value);
            }}
            formatCurrency={formatCurrency}
          />

          {/* Budget Overview */}
          <BudgetOverview
            budgetSummary={budgetSummary}
            formatCurrency={formatCurrency}
            onCategoryClick={(category) => {
              setSelectedCategory(category);
              setCategoryDialog(true);
            }}
          />
          </>
        )}

        {/* Category Breakdown Pie Chart */}
        {!loading && expenses.length > 0 && (
          <Card 
            elevation={0}
            sx={{ 
              mb: 4,
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #f97316 0%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                Expenses by Category
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click on a category to view expenses in that category
              </Typography>
              
              {getFilteredExpenses().length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No expenses found for the selected time period.
                </Alert>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 3,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                <Box 
                  sx={{ 
                    width: '100%',
                    maxWidth: { xs: '100%', sm: 500, md: 600, lg: 700 },
                    p: { xs: 1, sm: 2, md: 3 },
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <Pie 
                    data={getCategoryData()} 
                    options={chartOptions}
                  />
                </Box>
                
                {/* Floating Info Card on Hover */}
                {hoveredCategory && (
                  <Card
                    elevation={8}
                    sx={{
                      minWidth: { xs: '100%', md: 280 },
                      maxWidth: { xs: '100%', md: 320 },
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '2px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                      animation: 'slideIn 0.3s ease-out',
                      '@keyframes slideIn': {
                        from: {
                          opacity: 0,
                          transform: 'translateX(20px)',
                        },
                        to: {
                          opacity: 1,
                          transform: 'translateX(0)',
                        },
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 800,
                          mb: 2,
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {hoveredCategory.name}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Your Share
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#8b5cf6' }}>
                            {formatCurrency(hoveredCategory.amount)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Percentage
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#ec4899' }}>
                            {((hoveredCategory.amount / hoveredCategory.total) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            # of Expenses
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {getFilteredExpenses().filter(e => (e.category || 'Uncategorized') === hoveredCategory.name).length}
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          mt: 2,
                          pt: 2,
                          borderTop: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                          💡 Click to view all expenses in this category
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card 
          elevation={0}
          sx={{ 
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #f97316 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Recent Activity
              </Typography>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Show</InputLabel>
                <Select
                  value={activityFilter}
                  label="Show"
                  onChange={(e) => setActivityFilter(e.target.value)}
                >
                  <MenuItem value="expenses">Expenses</MenuItem>
                  <MenuItem value="settlements">Settlements</MenuItem>
                  <MenuItem value="all">All Activity</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : getFilteredActivity().length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No {activityFilter === 'expenses' ? 'expenses' : activityFilter === 'settlements' ? 'settlements' : 'activity'} found for the selected time period. {expenses.length > 0 ? 'Try adjusting the date filter.' : 'Click the + button to create your first expense!'}
              </Alert>
            ) : (
              <List 
                sx={{ 
                  maxHeight: { xs: 400, sm: 500, md: 600 },
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.3)',
                    borderRadius: '4px',
                    '&:hover': {
                      background: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.7)' : 'rgba(139, 92, 246, 0.5)',
                    },
                  },
                }}
              >
                {getFilteredActivity().map((expense, index) => (
                  <React.Fragment key={expense._id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      sx={{ 
                        cursor: 'pointer', 
                        borderRadius: 2,
                        mb: 1,
                        transition: 'all 0.2s',
                        '&:hover': { 
                          bgcolor: 'rgba(6, 182, 212, 0.05)',
                          transform: 'translateX(8px)',
                        },
                      }}
                      secondaryAction={
                        expense.createdBy._id === user._id && (
                          <IconButton
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpenseToDelete(expense._id);
                              setDeleteDialog(true);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        )
                      }
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight="500">
                              {expense.description}
                            </Typography>
                            {expense.category && (
                              <Chip
                                label={expense.category}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            <Chip
                              label={getSplitTypeLabel(expense)}
                              size="small"
                              variant="outlined"
                              color={expense.isPersonal ? 'success' : 'default'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {formatCurrency(expense.totalAmount)} • Paid by{' '}
                              {expense.paidBy._id === user._id
                                ? 'You'
                                : expense.paidBy.name}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {new Date(expense.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Bottom Tab Bar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          px: 2,
          py: 1,
          background: theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08)',
          animation: showDockHint ? 'dockBounce 0.6s ease-out' : 'none',
          '@keyframes dockBounce': {
            '0%': { transform: 'translateY(100%)' },
            '60%': { transform: 'translateY(-8px)' },
            '100%': { transform: 'translateY(0)' },
          },
        }}
      >
        {/* First-visit hint */}
        {showDockHint && (
          <Box
            onClick={() => {
              setShowDockHint(false);
              localStorage.setItem('hasSeenDock', 'true');
            }}
            sx={{
              position: 'absolute',
              top: -44,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: 'white',
              px: 2,
              py: 0.75,
              borderRadius: 2,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              animation: 'hintPulse 2s ease-in-out infinite',
              '@keyframes hintPulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 },
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #ec4899',
              },
            }}
          >
            Your tools live here ✨ Tap to dismiss
          </Box>
        )}

        {/* Income capsule */}
        {!user?.isAdmin && (
          <Box sx={{
            display: 'flex', flexDirection: 'row', gap: 0.25, px: 0.75, py: 0.5, borderRadius: 2.5,
            background: '#10b981',
          }}>
            {[{ icon: <TrendingUp sx={{ fontSize: 20 }} />, label: 'Add', onClick: () => setAddIncomeDialog(true) },
              { icon: <AttachMoney sx={{ fontSize: 20 }} />, label: 'Income', onClick: () => navigate('/manage-income') },
            ].map((item) => (
              <Box key={item.label} onClick={item.onClick} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                px: 1, py: 0.25, borderRadius: 2, color: 'white',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                '&:active': { transform: 'scale(0.95)' },
              }}>
                {item.icon}
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, mt: 0.25, lineHeight: 1, color: 'white' }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Expense capsule */}
        {!user?.isAdmin && (
          <Box sx={{
            display: 'flex', flexDirection: 'row', gap: 0.25, px: 0.75, py: 0.5, borderRadius: 2.5,
            background: '#f97316',
          }}>
            {[{ icon: <ShoppingCart sx={{ fontSize: 20 }} />, label: 'Add', onClick: () => setAddExpenseDialog(true) },
              { icon: <AccountBalanceWallet sx={{ fontSize: 20 }} />, label: 'Budgets', onClick: () => navigate('/manage-budgets') },
            ].map((item) => (
              <Box key={item.label} onClick={item.onClick} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                px: 1, py: 0.25, borderRadius: 2, color: 'white',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                '&:active': { transform: 'scale(0.95)' },
              }}>
                {item.icon}
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, mt: 0.25, lineHeight: 1, color: 'white' }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Admin capsule */}
        {user?.isAdmin && (
          <Box sx={{
            display: 'flex', flexDirection: 'row', gap: 0.25, px: 0.75, py: 0.5, borderRadius: 2.5,
            background: '#8b5cf6',
          }}>
            {[{ icon: <LocalOffer sx={{ fontSize: 20 }} />, label: 'Categories', onClick: () => navigate('/manage-categories') },
              { icon: <Person sx={{ fontSize: 20 }} />, label: 'Users', onClick: () => navigate('/manage-users') },
            ].map((item) => (
              <Box key={item.label} onClick={item.onClick} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                px: 1, py: 0.25, borderRadius: 2, color: 'white',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                '&:active': { transform: 'scale(0.95)' },
              }}>
                {item.icon}
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, mt: 0.25, lineHeight: 1, color: 'white' }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Utilities capsule */}
        <Box sx={{
          display: 'flex', flexDirection: 'row', gap: 0.25, px: 0.75, py: 0.5, borderRadius: 2.5,
          background: theme.palette.mode === 'dark' ? '#334155' : '#64748b',
        }}>
          {[
            ...(!user?.isAdmin ? [{ icon: <ShowChart sx={{ fontSize: 20 }} />, label: 'Flow', onClick: () => navigate('/cash-flow') }] : []),
            { icon: <People sx={{ fontSize: 20 }} />, label: 'Groups', onClick: () => navigate('/manage-groups') },
            { icon: <StickyNote2 sx={{ fontSize: 20 }} />, label: 'Notes', onClick: () => {
              setNotesSuccess('');
              axios.get('/api/users/profile').then(res => {
                setUserNotes(res.data.notes || '');
              }).catch(() => {});
              setNotesDialog(true);
            }},
          ].map((item) => (
            <Box key={item.label} onClick={item.onClick} sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
              px: 1, py: 0.25, borderRadius: 2, color: 'white',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              '&:active': { transform: 'scale(0.95)' },
            }}>
              {item.icon}
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, mt: 0.25, lineHeight: 1, color: 'white' }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Expense Detail Dialog */}
      <Dialog
        open={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        {selectedExpense && (
          <>
            <DialogTitle>
              <Typography 
                variant="h6" 
                fontWeight="bold"
                sx={{
                  background: 'linear-gradient(135deg, #f97316 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {selectedExpense.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(selectedExpense.createdAt).toLocaleString()}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Amount
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {formatCurrency(selectedExpense.totalAmount)}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Paid By
                </Typography>
                <Typography variant="body1">
                  {selectedExpense.paidBy._id === user._id
                    ? 'You'
                    : selectedExpense.paidBy.name}{' '}
                  ({selectedExpense.paidBy.email})
                </Typography>
              </Box>
              {selectedExpense.category && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Category
                  </Typography>
                  <Chip 
                    label={selectedExpense.category} 
                    sx={{
                      background: 'linear-gradient(135deg, #f97316 0%, #8b5cf6 100%)',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              )}
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedExpense.isPersonal ? 'Type' : 'Split Type'}
                </Typography>
                <Chip
                  label={getSplitTypeLabel(selectedExpense)}
                  color={selectedExpense.isPersonal ? 'success' : 'default'}
                />
              </Box>
              {!selectedExpense.isPersonal && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Split Details
                </Typography>
                <List dense>
                  {selectedExpense.splits.map((split) => (
                    <ListItem key={split.user._id}>
                      <ListItemText
                        primary={
                          split.user._id === user._id ? 'You' : split.user.name
                        }
                        secondary={split.user.email}
                      />
                      <Typography variant="body1" fontWeight="500">
                        {formatCurrency(split.amount)}
                        {selectedExpense.splitType === 'percentage' &&
                          ` (${split.percentage}%)`}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </Box>
              )}
            </DialogContent>
            <DialogActions>
              {selectedExpense.createdBy._id === user._id && (
                <Button 
                  onClick={() => {
                    navigate(`/expenses/edit/${selectedExpense._id}`);
                    setSelectedExpense(null);
                  }}
                  startIcon={<Edit />}
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #f97316 0%, #8b5cf6 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #ea580c 0%, #7c3aed 100%)',
                    },
                  }}
                >
                  Edit
                </Button>
              )}
              <Button onClick={() => setSelectedExpense(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this expense?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteExpense} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Expenses Dialog */}
      <Dialog
        open={userExpensesDialog}
        onClose={() => {
          setUserExpensesDialog(false);
          setSelectedUser(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        {selectedUser && (
          <>
            <DialogTitle>
              <Typography 
                variant="h6" 
                fontWeight="bold"
                sx={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Expenses with {selectedUser.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedUser.email}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              {getExpensesWithUser().length === 0 ? (
                <Alert severity="info">
                  No expenses found with this user.
                </Alert>
              ) : (
                <List>
                  {getExpensesWithUser().map((expense, index) => (
                    <React.Fragment key={expense._id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 2,
                          mb: 1,
                          transition: 'all 0.2s',
                          '&:hover': {
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
                          },
                        }}
                        onClick={() => {
                          setUserExpensesDialog(false);
                          setSelectedExpense(expense);
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight="500">
                                {expense.description}
                              </Typography>
                              {expense.category && (
                                <Chip
                                  label={expense.category}
                                  size="small"
                                  sx={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                  }}
                                />
                              )}
                              <Chip
                                label={getSplitTypeLabel(expense)}
                                size="small"
                                variant="outlined"
                                color={expense.isPersonal ? 'success' : 'default'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                {formatCurrency(expense.totalAmount)} • Paid by{' '}
                                {expense.paidBy._id === user._id
                                  ? 'You'
                                  : expense.paidBy._id === selectedUser._id
                                  ? selectedUser.name
                                  : expense.paidBy.name}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {new Date(expense.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              {selectedUser && balances.find(b => b.user._id === selectedUser._id) && (
                <Button
                  onClick={handleEvenUpOpen}
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                    },
                  }}
                >
                  Even Up
                </Button>
              )}
              <Button
                onClick={() => {
                  setUserExpensesDialog(false);
                  setSelectedUser(null);
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Even Up Dialog */}
      <Dialog
        open={evenUpDialog}
        onClose={handleEvenUpClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle sx={{
          fontWeight: 700,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Even Up with {selectedUser?.name}
        </DialogTitle>
        <DialogContent>
          {evenUpError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {evenUpError}
            </Alert>
          )}
          {evenUpSuccess && (
            <Alert severity="success" sx={{ mb: 2, mt: 1 }}>
              {evenUpSuccess}
            </Alert>
          )}
          {selectedUser && balances.find(b => b.user._id === selectedUser._id) && (
            <>
              <Box sx={{ mb: 3, mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current Balance
                </Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatCurrency(balances.find(b => b.user._id === selectedUser._id).amount)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {balances.find(b => b.user._id === selectedUser._id).type === 'you_owe'
                    ? `You owe ${selectedUser.name}`
                    : `${selectedUser.name} owes you`}
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Settlement Amount"
                type="number"
                value={evenUpAmount}
                onChange={(e) => setEvenUpAmount(e.target.value)}
                inputProps={{
                  min: 0.01,
                  max: balances.find(b => b.user._id === selectedUser._id).amount,
                  step: 0.01,
                }}
                helperText={`Enter amount between $0.01 and ${formatCurrency(balances.find(b => b.user._id === selectedUser._id).amount)}`}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Zelle">Zelle</MenuItem>
                  <MenuItem value="Venmo">Venmo</MenuItem>
                  <MenuItem value="PayPal">PayPal</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleEvenUpClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            onClick={handleEvenUpSubmit}
            variant="contained"
            disabled={!evenUpAmount || parseFloat(evenUpAmount) <= 0}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
              },
            }}
          >
            Record Settlement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Expenses Dialog */}
      <Dialog
        open={categoryDialog}
        onClose={() => {
          setCategoryDialog(false);
          setSelectedCategory(null);
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedCategory && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <LocalOffer sx={{ color: '#8b5cf6' }} />
                <Typography variant="h6" fontWeight="bold">
                  {selectedCategory}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                All expenses in this category
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              {getExpensesByCategory().length === 0 ? (
                <Typography color="text.secondary">
                  No expenses in this category
                </Typography>
              ) : (
                <List>
                  {getExpensesByCategory().map((expense, index) => (
                    <React.Fragment key={expense._id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            bgcolor: 'rgba(6, 182, 212, 0.05)',
                          },
                        }}
                        onClick={() => {
                          setCategoryDialog(false);
                          setSelectedExpense(expense);
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight="500">
                                {expense.description}
                              </Typography>
                              <Chip
                                label={getSplitTypeLabel(expense)}
                                size="small"
                                variant="outlined"
                                color={expense.isPersonal ? 'success' : 'default'}
                              />
                              {expense.createdBy._id === user._id && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/expenses/edit/${expense._id}`);
                                  }}
                                  sx={{ ml: 'auto' }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                {formatCurrency(expense.totalAmount)} • Paid by{' '}
                                {expense.paidBy._id === user._id
                                  ? 'You'
                                  : expense.paidBy.name}
                                {' • Your share: '}{formatCurrency(getUserShare(expense))}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {new Date(expense.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setCategoryDialog(false);
                  setSelectedCategory(null);
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

export default Dashboard;
