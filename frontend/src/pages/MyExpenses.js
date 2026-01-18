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
  Chip,
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
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Receipt,
  Brightness4,
  Brightness7,
  Logout,
  Edit,
} from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ColorModeContext } from '../index';

ChartJS.register(ArcElement, Tooltip, Legend);

function MyExpenses() {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { user, logout } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  useEffect(() => {
    fetchTaggedExpenses();
  }, []);

  const fetchTaggedExpenses = async () => {
    try {
      const response = await axios.get('/api/expenses/tagged');
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching tagged expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const getUserShare = (expense) => {
    const userSplit = expense.splits.find(split => split.user._id === user._id);
    return userSplit ? userSplit.amount : 0;
  };

  const getCategoryData = () => {
    const categoryTotals = {};
    
    expenses.forEach(expense => {
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
  };

  const handleCategoryClick = (event, elements) => {
    if (elements.length > 0) {
      const index = elements[0].index;
      const categoryData = getCategoryData();
      const category = categoryData.labels[index];
      setSelectedCategory(category);
      setCategoryDialog(true);
    }
  };

  const getExpensesByCategory = () => {
    if (!selectedCategory) return [];
    return expenses.filter(expense => 
      (expense.category || 'Uncategorized') === selectedCategory
    );
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
          <IconButton
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Receipt sx={{ mr: 2, fontSize: 28 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            My Expenses
            {!loading && expenses.length > 0 && (
              <Chip
                label={expenses.length}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  height: 28,
                  '& .MuiChip-label': {
                    px: 1.5,
                  },
                }}
              />
            )}
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
        {/* Category Breakdown Pie Chart */}
        {!loading && expenses.length > 0 && (
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
                  mb: 2,
                }}
              >
                Expenses by Category
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click on a category to view expenses in that category
              </Typography>
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
                    options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        onClick: handleCategoryClick,
                        onHover: (event, elements) => {
                          if (elements.length > 0) {
                            const index = elements[0].index;
                            const categoryData = getCategoryData();
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
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(15, 23, 42, 0.95)' 
                            : 'rgba(255, 255, 255, 0.95)',
                          titleColor: theme.palette.text.primary,
                          bodyColor: theme.palette.text.primary,
                          borderColor: theme.palette.divider,
                          borderWidth: 1,
                          padding: 12,
                          cornerRadius: 8,
                          titleFont: {
                            size: 14,
                            weight: '600',
                            family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          },
                          bodyFont: {
                            size: 13,
                            family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          },
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.parsed || 0;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `  ${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                          }
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
                    }}
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
                            {expenses.filter(e => (e.category || 'Uncategorized') === hoveredCategory.name).length}
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
            </CardContent>
          </Card>
        )}

        {/* Tagged Expenses List */}
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
              All Expenses
            </Typography>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : expenses.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                You're not tagged in any expenses yet. When someone includes you in an expense split, it will appear here.
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
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
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
                            {expense.paidBy._id === user._id && (
                              <Chip
                                label="You Paid"
                                size="small"
                                color="success"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              Total: {formatCurrency(expense.totalAmount)} • Your share: {formatCurrency(getUserShare(expense))}
                            </Typography>
                            <Typography variant="body2" component="span" sx={{ mx: 1 }}>
                              • Paid by{' '}
                              {expense.paidBy._id === user._id
                                ? 'You'
                                : expense.paidBy.name}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {new Date(expense.createdAt).toLocaleDateString()} at {new Date(expense.createdAt).toLocaleTimeString()}
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
                  Your Share
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {formatCurrency(getUserShare(selectedExpense))}
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
                  All Participants
                </Typography>
                <List dense>
                  {selectedExpense.splits.map((split) => (
                    <ListItem 
                      key={split.user._id}
                      sx={{
                        bgcolor: split.user._id === user._id ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                        borderRadius: 1,
                        mb: 0.5,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography>
                              {split.user._id === user._id ? 'You' : split.user.name}
                            </Typography>
                            {split.user._id === user._id && (
                              <Chip label="You" size="small" color="primary" />
                            )}
                          </Box>
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
              <Typography variant="h6" fontWeight="bold">
                {selectedCategory} Expenses
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your share: {formatCurrency(
                  getExpensesByCategory().reduce((sum, exp) => sum + getUserShare(exp), 0)
                )}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              {getExpensesByCategory().length === 0 ? (
                <Alert severity="info">
                  No expenses found in this category.
                </Alert>
              ) : (
                <List>
                  {getExpensesByCategory().map((expense, index) => (
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
                          },
                        }}
                        onClick={() => {
                          setCategoryDialog(false);
                          setSelectedExpense(expense);
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                              <Typography variant="body1" fontWeight="500">
                                {expense.description}
                              </Typography>
                              <Chip
                                label={getSplitTypeLabel(expense.splitType)}
                                size="small"
                                variant="outlined"
                              />
                              {expense.paidBy._id === user._id && (
                                <Chip
                                  label="You Paid"
                                  size="small"
                                  color="success"
                                  sx={{ fontWeight: 600 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                Total: {formatCurrency(expense.totalAmount)} • Your share: {formatCurrency(getUserShare(expense))}
                              </Typography>
                              <Typography variant="body2" component="span" sx={{ mx: 1 }}>
                                • Paid by{' '}
                                {expense.paidBy._id === user._id
                                  ? 'You'
                                  : expense.paidBy.name}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {new Date(expense.createdAt).toLocaleDateString()} at {new Date(expense.createdAt).toLocaleTimeString()}
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

export default MyExpenses;
