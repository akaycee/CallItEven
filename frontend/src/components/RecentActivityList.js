import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Receipt, AccountBalance } from '@mui/icons-material';

export const RecentActivityList = ({
  filteredActivity,
  activityFilter,
  onActivityFilterChange,
  loading,
  onExpenseClick,
  formatCurrency,
  formatDate,
}) => {
  const theme = useTheme();

  const getActivityIcon = (type) => {
    return type === 'settlement' ? <AccountBalance sx={{ color: '#10b981' }} /> : <Receipt sx={{ color: '#8b5cf6' }} />;
  };

  const getActivityColor = (type) => {
    return type === 'settlement' ? '#10b981' : '#8b5cf6';
  };

  return (
    <Card
      sx={{
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
          : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Recent Activity
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={activityFilter}
              onChange={onActivityFilterChange}
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
              <MenuItem value="all">All Activity</MenuItem>
              <MenuItem value="expenses">Expenses Only</MenuItem>
              <MenuItem value="settlements">Settlements Only</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredActivity.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No activity to display
          </Typography>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredActivity.map((expense) => (
              <ListItem
                key={expense._id}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.02)',
                    transform: 'translateX(8px)',
                    borderColor: getActivityColor(expense.type),
                  },
                }}
                onClick={() => onExpenseClick(expense)}
              >
                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                  {getActivityIcon(expense.type)}
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {expense.description}
                      </Typography>
                      <Chip 
                        label={expense.type === 'settlement' ? 'Settlement' : expense.category}
                        size="small"
                        sx={{
                          background: `linear-gradient(135deg, ${getActivityColor(expense.type)}20 0%, ${getActivityColor(expense.type)}10 100%)`,
                          border: `1px solid ${getActivityColor(expense.type)}40`,
                          color: getActivityColor(expense.type),
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(expense.date)} • Paid by {expense.paidBy?.name || 'Unknown'}
                    </Typography>
                  }
                />
                <Typography variant="h6" sx={{ fontWeight: 700, color: getActivityColor(expense.type) }}>
                  {formatCurrency(expense.amount)}
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
