import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Fab,
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
} from '@mui/material';
import {
  Add,
  Logout,
  Receipt,
  TrendingUp,
  TrendingDown,
  Delete,
  Brightness4,
  Brightness7,
  LocalOffer,
  Edit,
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ColorModeContext } from '../index';

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

  useEffect(() => {
    fetchData();
  }, []);

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
    logout();
    navigate('/login');
  };

  const handleDeleteExpense = async () => {
    try {
      await axios.delete(`/api/expenses/${expenseToDelete}`);
      setExpenses(expenses.filter((exp) => exp._id !== expenseToDelete));
      setDeleteDialog(false);
      setExpenseToDelete(null);
      fetchData(); // Refresh balances
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

  const getSplitTypeLabel = (type) => {
    const labels = {
      equal: 'Split Equally',
      percentage: 'By Percentage',
      unequal: 'Custom Split',
    };
    return labels[type] || type;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #14b8a6 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Receipt sx={{ mr: 2, fontSize: 28 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              fontSize: '1.4rem',
            }}
          >
            CallItEven
          </Typography>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 3,
              px: 2,
              py: 0.5,
              mr: 2,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {user?.name}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<LocalOffer />}
            onClick={() => navigate('/expenses/my-tagged')}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              mr: 1,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
              },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            My Expenses
          </Button>
          <IconButton
            onClick={colorMode.toggleColorMode}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              mr: 1,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s',
            }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          <IconButton
            color="inherit"
            onClick={handleLogout}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s',
            }}
          >
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Balance Summary */}
        <Card 
          elevation={0}
          sx={{ 
            mb: 4,
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(20, 184, 166, 0.05) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #14b8a6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Balance Summary
            </Typography>
            {balances.length === 0 ? (
              <Typography color="text.secondary">
                No outstanding balances. Create an expense to get started!
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {balances.map((balance) => (
                  <Grid item xs={12} sm={6} md={4} key={balance.user._id}>
                    <Card 
                      elevation={0}
                      sx={{
                        height: '100%',
                        background: balance.type === 'owes_you' 
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                        border: `1px solid ${balance.type === 'owes_you' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-4px) scale(1.02)',
                          boxShadow: balance.type === 'owes_you'
                            ? '0 20px 30px -10px rgba(16, 185, 129, 0.3)'
                            : '0 20px 30px -10px rgba(239, 68, 68, 0.3)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box display="flex" alignItems="center" mb={2}>
                          {balance.type === 'owes_you' ? (
                            <TrendingUp 
                              sx={{ 
                                mr: 1.5, 
                                fontSize: 28,
                                color: 'success.main',
                              }} 
                            />
                          ) : (
                            <TrendingDown 
                              sx={{ 
                                mr: 1.5, 
                                fontSize: 28,
                                color: 'error.main',
                              }} 
                            />
                          )}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600,
                              color: balance.type === 'owes_you' ? 'success.main' : 'error.main',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              fontSize: '0.75rem',
                            }}
                          >
                            {balance.type === 'owes_you' ? 'owes you' : 'you owe'}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="h5" 
                          fontWeight="bold"
                          sx={{ mb: 1.5, color: 'text.primary' }}
                        >
                          {formatCurrency(balance.amount)}
                        </Typography>
                        <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5 }}>
                          {balance.user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {balance.user.email}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card elevation={0}>
          <CardContent sx={{ p: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 800,
                mb: 3,
              }}
            >
              Recent Expenses
            </Typography>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : expenses.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No expenses yet. Click the + button to create your first expense!
              </Alert>
            ) : (
              <List>
                {expenses.map((expense, index) => (
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
                              label={getSplitTypeLabel(expense.splitType)}
                              size="small"
                              variant="outlined"
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

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ 
          position: 'fixed', 
          bottom: 32, 
          right: 32,
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #14b8a6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #0f766e 100%)',
          },
        }}
        onClick={() => navigate('/expenses/new')}
      >
        <Add sx={{ fontSize: 32 }} />
      </Fab>

      {/* Expense Detail Dialog */}
      <Dialog
        open={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedExpense && (
          <>
            <DialogTitle>
              <Typography variant="h6" fontWeight="bold">
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
                  <Chip label={selectedExpense.category} color="primary" />
                </Box>
              )}
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Split Type
                </Typography>
                <Chip label={getSplitTypeLabel(selectedExpense.splitType)} />
              </Box>
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
                    background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #14b8a6 100%)',
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
    </Box>
  );
}

export default Dashboard;
