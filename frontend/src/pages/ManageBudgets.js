import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  useTheme,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import { Delete, Add, Edit } from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import NavBar from '../components/NavBar';

function ManageBudgets() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [budgets, setBudgets] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [newBudget, setNewBudget] = useState({ category: '', amount: '' });
  const [editAmount, setEditAmount] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [categoryExpensesDialog, setCategoryExpensesDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [budgetDateFilter, setBudgetDateFilter] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const timeoutRefs = useRef([]);

  useEffect(() => {
    return () => timeoutRefs.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [budgetDateFilter, customStart, customEnd]);

  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate, endDate;
    switch (budgetDateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now);
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
        endDate = new Date(now);
        break;
      case 'custom':
        if (customStart && customEnd) {
          startDate = new Date(customStart);
          endDate = new Date(customEnd);
        } else {
          return null;
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }, [budgetDateFilter, customStart, customEnd]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const range = getDateRange();
      const summaryParams = range
        ? `?startDate=${range.startDate}&endDate=${range.endDate}`
        : '';
      const [budgetsRes, summaryRes, categoriesRes, expensesRes] = await Promise.all([
        axios.get('/api/budgets'),
        axios.get(`/api/budgets/summary${summaryParams}`),
        axios.get('/api/categories'),
        axios.get('/api/expenses'),
      ]);
      setBudgets(budgetsRes.data);
      setBudgetSummary(summaryRes.data);
      setCategories(categoriesRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const handleAddBudget = async () => {
    try {
      setError('');
      if (!newBudget.category) {
        setError('Please select a category');
        return;
      }
      if (!newBudget.amount || parseFloat(newBudget.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      await axios.post('/api/budgets', {
        category: newBudget.category,
        amount: parseFloat(newBudget.amount),
      });
      setSuccess(`Budget for "${newBudget.category}" created successfully`);
      setAddDialog(false);
      setNewBudget({ category: '', amount: '' });
      fetchData();
      timeoutRefs.current.push(setTimeout(() => setSuccess(''), 3000));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create budget');
    }
  };

  const handleEditClick = (budget) => {
    setSelectedBudget(budget);
    setEditAmount(budget.amount.toString());
    setEditDialog(true);
  };

  const handleEditConfirm = async () => {
    try {
      setError('');
      if (!editAmount || parseFloat(editAmount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      await axios.put(`/api/budgets/${selectedBudget._id}`, {
        amount: parseFloat(editAmount),
      });
      setSuccess(`Budget for "${selectedBudget.category}" updated successfully`);
      setEditDialog(false);
      setSelectedBudget(null);
      setEditAmount('');
      fetchData();
      timeoutRefs.current.push(setTimeout(() => setSuccess(''), 3000));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update budget');
    }
  };

  const handleDeleteClick = (budget) => {
    setSelectedBudget(budget);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await axios.delete(`/api/budgets/${selectedBudget._id}`);
      setSuccess(`Budget for "${selectedBudget.category}" deleted successfully`);
      setDeleteDialog(false);
      setSelectedBudget(null);
      fetchData();
      timeoutRefs.current.push(setTimeout(() => setSuccess(''), 3000));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete budget');
    }
  };

  // Categories that don't already have a budget
  const availableCategories = categories.filter(
    (cat) => !budgets.some((b) => b.category === cat)
  );

  const getProgressColor = (spent, budget) => {
    const ratio = spent / budget;
    if (ratio > 1) return '#ef4444';
    if (ratio > 0.75) return '#f59e0b';
    return '#10b981';
  };

  const getUserShare = (expense) => {
    const userSplit = expense.splits?.find(s => s.user?._id === user._id);
    return userSplit ? userSplit.amount : 0;
  };

  const getFilteredExpensesByCategory = (category) => {
    const range = getDateRange();
    if (!range) return [];
    const startDate = new Date(range.startDate);
    const endDate = new Date(range.endDate);
    endDate.setHours(23, 59, 59, 999);
    return expenses.filter(exp => {
      const expDate = new Date(exp.createdAt);
      return (exp.category || 'Uncategorized') === category
        && expDate >= startDate
        && expDate <= endDate
        && !exp.category?.startsWith('Settlement')
        && exp.splits?.some(s => s.user?._id === user._id);
    });
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setCategoryExpensesDialog(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar title="Manage Budgets" showBack backPath="/dashboard" />

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(16, 185, 129, 0.15)'
              : '0 8px 32px rgba(16, 185, 129, 0.2)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Budgets
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select
                    value={budgetDateFilter}
                    onChange={(e) => setBudgetDateFilter(e.target.value)}
                    sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="year">This Year</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
                {budgetDateFilter === 'custom' && (
                  <>
                    <TextField
                      type="date"
                      size="small"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      sx={{ width: 150 }}
                      InputLabelProps={{ shrink: true }}
                    />
                    <Typography variant="body2" color="text.secondary">to</Typography>
                    <TextField
                      type="date"
                      size="small"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      sx={{ width: 150 }}
                      InputLabelProps={{ shrink: true }}
                    />
                  </>
                )}
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setAddDialog(true)}
                  disabled={availableCategories.length === 0}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
                    },
                  }}
                >
                  Add Budget
                </Button>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Set spending limits per category. Budgets track your share of all expenses (personal and shared).
            </Typography>

            {loading ? (
              <Typography>Loading...</Typography>
            ) : budgets.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No budgets set yet. Click "Add Budget" to set your first monthly budget.
                </Typography>
              </Box>
            ) : (
              <List>
                {budgets.map((budget) => {
                  const summary = budgetSummary.find((s) => s.category === budget.category);
                  const spentAmount = summary ? summary.spentAmount : 0;
                  const progressColor = getProgressColor(spentAmount, budget.amount);
                  const ratio = budget.amount > 0 ? spentAmount / budget.amount : 0;

                  return (
                    <ListItem
                      key={budget._id}
                      onClick={() => handleCategoryClick(budget.category)}
                      sx={{
                        mb: 1.5,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        flexDirection: 'column',
                        alignItems: 'stretch',
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: progressColor,
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body1"
                            fontWeight={600}
                          >
                            {budget.category}
                          </Typography>
                          {ratio > 1 && (
                            <Chip
                              label="Over Budget"
                              size="small"
                              sx={{
                                bgcolor: '#ef444420',
                                color: '#ef4444',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                              }}
                            />
                          )}
                        </Box>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleEditClick(budget); }}
                            sx={{ color: '#06b6d4' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(budget); }}
                            sx={{ color: '#ef4444' }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: progressColor, fontWeight: 600 }}>
                          {formatCurrency(spentAmount)} spent
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(budget.amount)} budget
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(ratio * 100, 100)}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: progressColor,
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {ratio > 1
                          ? `${formatCurrency(spentAmount - budget.amount)} over budget`
                          : `${formatCurrency(budget.amount - spentAmount)} remaining`}
                      </Typography>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Add Budget Dialog */}
      <Dialog
        open={addDialog}
        onClose={() => {
          setAddDialog(false);
          setNewBudget({ category: '', amount: '' });
          setError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Add Monthly Budget
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={newBudget.category}
              onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
              label="Category"
            >
              {availableCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Monthly Budget Amount"
            type="number"
            value={newBudget.amount}
            onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ step: '0.01', min: '0.01' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddBudget();
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setAddDialog(false);
              setNewBudget({ category: '', amount: '' });
              setError('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddBudget}
            variant="contained"
            disabled={!newBudget.category || !newBudget.amount}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
              },
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => {
          setEditDialog(false);
          setSelectedBudget(null);
          setEditAmount('');
          setError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Edit Budget — {selectedBudget?.category}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Monthly Budget Amount"
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ step: '0.01', min: '0.01' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditConfirm();
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setEditDialog(false);
              setSelectedBudget(null);
              setEditAmount('');
              setError('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditConfirm}
            variant="contained"
            disabled={!editAmount || parseFloat(editAmount) <= 0}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>Delete Budget</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the budget for "{selectedBudget?.category}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Expenses Dialog */}
      <Dialog
        open={categoryExpensesDialog}
        onClose={() => {
          setCategoryExpensesDialog(false);
          setSelectedCategory(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        {selectedCategory && (
          <>
            <DialogTitle>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {selectedCategory}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expenses counting toward your budget
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              {getFilteredExpensesByCategory(selectedCategory).length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  No expenses in this category for the selected period.
                </Typography>
              ) : (
                <List>
                  {getFilteredExpensesByCategory(selectedCategory).map((expense, index) => (
                    <React.Fragment key={expense._id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'rgba(16, 185, 129, 0.05)',
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight="500">
                                {expense.description}
                              </Typography>
                              {expense.isPersonal && (
                                <Chip
                                  label="Personal"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                {formatCurrency(expense.totalAmount)}
                                {!expense.isPersonal && ` • Your share: ${formatCurrency(getUserShare(expense))}`}
                                {' • '}
                                {expense.paidBy?._id === user._id ? 'Paid by You' : `Paid by ${expense.paidBy?.name}`}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {new Date(expense.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <Typography variant="body1" fontWeight={600} sx={{ color: '#10b981', ml: 2, whiteSpace: 'nowrap' }}>
                          {formatCurrency(getUserShare(expense))}
                        </Typography>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setCategoryExpensesDialog(false);
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

export default ManageBudgets;
