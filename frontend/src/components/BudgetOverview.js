import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  useTheme,
} from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';

const BudgetOverview = ({ budgetSummary = [], formatCurrency, onCategoryClick }) => {
  const theme = useTheme();

  if (budgetSummary.length === 0) {
    return null;
  }

  const getProgressColor = (spent, budget) => {
    const ratio = spent / budget;
    if (ratio > 1) return '#ef4444';     // red — over budget
    if (ratio > 0.75) return '#f59e0b';  // amber — approaching
    return '#10b981';                     // green — healthy
  };

  const getProgressValue = (spent, budget) => {
    return Math.min((spent / budget) * 100, 100);
  };

  return (
    <Card
      elevation={0}
      sx={{
        mb: 4,
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AccountBalanceWallet sx={{ color: '#10b981' }} />
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Monthly Budgets
          </Typography>
        </Box>

        {budgetSummary.map((item) => {
          const progressColor = getProgressColor(item.spentAmount, item.budgetAmount);
          const ratio = item.budgetAmount > 0 ? item.spentAmount / item.budgetAmount : 0;

          return (
            <Box
              key={item.category}
              onClick={() => onCategoryClick && onCategoryClick(item.category)}
              sx={{
                mb: 2.5,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme.palette.divider,
                cursor: onCategoryClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: progressColor,
                  boxShadow: `0 2px 8px ${progressColor}20`,
                  transform: onCategoryClick ? 'translateX(4px)' : 'none',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body1" fontWeight={600}>
                  {item.category}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ color: progressColor }}>
                    {formatCurrency(item.spentAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    / {formatCurrency(item.budgetAmount)}
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
              </Box>
              <LinearProgress
                variant="determinate"
                value={getProgressValue(item.spentAmount, item.budgetAmount)}
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
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {ratio > 1
                  ? `${formatCurrency(item.spentAmount - item.budgetAmount)} over budget`
                  : `${formatCurrency(item.budgetAmount - item.spentAmount)} remaining`}
              </Typography>
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default BudgetOverview;
