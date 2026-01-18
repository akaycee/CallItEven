import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  FormControl,
  Select,
  MenuItem,
  TextField,
  useTheme,
} from '@mui/material';
import {
  Receipt,
  AttachMoney,
  AccountBalance,
  Category as CategoryIcon,
  TrendingUp,
} from '@mui/icons-material';

export const ExpenseSummaryCard = ({
  expenseStats,
  dateFilter,
  onDateFilterChange,
  customDates,
  onCustomDateChange,
  formatCurrency,
}) => {
  const theme = useTheme();

  const statCards = [
    { 
      label: 'Total Expenses', 
      value: expenseStats.totalCount, 
      icon: <Receipt />,
      color: '#8b5cf6',
    },
    { 
      label: 'Total Amount', 
      value: formatCurrency(expenseStats.totalAmount), 
      icon: <AttachMoney />,
      color: '#ec4899',
    },
    { 
      label: 'Your Share', 
      value: formatCurrency(expenseStats.yourShare), 
      icon: <AccountBalance />,
      color: '#f97316',
    },
    { 
      label: 'Categories', 
      value: expenseStats.categoriesUsed, 
      icon: <CategoryIcon />,
      color: '#06b6d4',
    },
    { 
      label: 'Largest Expense', 
      value: formatCurrency(expenseStats.largestExpense), 
      icon: <TrendingUp />,
      color: '#10b981',
    },
  ];

  return (
    <Card
      sx={{
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)'
          : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 3,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(139, 92, 246, 0.15)' 
          : '0 8px 32px rgba(139, 92, 246, 0.2)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 12px 48px rgba(139, 92, 246, 0.25)' 
            : '0 12px 48px rgba(139, 92, 246, 0.3)',
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Expense Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={dateFilter}
                onChange={onDateFilterChange}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.5)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b5cf6',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#8b5cf6',
                  },
                }}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
            {dateFilter === 'custom' && (
              <>
                <TextField
                  type="date"
                  size="small"
                  name="startDate"
                  value={customDates.startDate}
                  onChange={onCustomDateChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 150 }}
                />
                <TextField
                  type="date"
                  size="small"
                  name="endDate"
                  value={customDates.endDate}
                  onChange={onCustomDateChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 150 }}
                />
              </>
            )}
          </Box>
        </Box>
        <Grid container spacing={2}>
          {statCards.map((stat, index) => (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`
                    : `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                  border: `1px solid ${stat.color}40`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: `0 8px 24px ${stat.color}30`,
                    border: `1px solid ${stat.color}60`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: stat.color, display: 'flex' }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {stat.label}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};
