import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Grid,
  useTheme,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export const BalanceSummaryCard = ({ balances, formatCurrency, handleUserClick }) => {
  const theme = useTheme();

  // Calculate summary from balances array
  const summary = useMemo(() => {
    const owedToYou = balances
      .filter(b => b.type === 'owes_you')
      .reduce((sum, b) => sum + b.amount, 0);
    const youOwe = balances
      .filter(b => b.type === 'you_owe')
      .reduce((sum, b) => sum + b.amount, 0);

    return {
      owedToYou,
      youOwe,
      owedToYouDetails: balances.filter(b => b.type === 'owes_you'),
      youOweDetails: balances.filter(b => b.type === 'you_owe'),
    };
  }, [balances]);

  if (balances.length === 0) {
    return (
      <Card
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
            : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: 3,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 32px rgba(6, 182, 212, 0.15)' 
            : '0 8px 32px rgba(6, 182, 212, 0.2)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)'}`,
          mb: 4,
        }}
      >
        <CardContent>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Balance Summary
          </Typography>
          <Typography color="text.secondary">
            No outstanding balances. Create an expense to get started!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
          : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: 3,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(6, 182, 212, 0.15)' 
          : '0 8px 32px rgba(6, 182, 212, 0.2)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.2)'}`,
        transition: 'all 0.3s ease',
        mb: 4,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 12px 48px rgba(6, 182, 212, 0.25)' 
            : '0 12px 48px rgba(6, 182, 212, 0.3)',
        },
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 3,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Balance Summary
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} />
              People owe you
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
              {formatCurrency(summary.owedToYou)}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingDownIcon sx={{ fontSize: 16, color: '#ef4444' }} />
              You owe
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ef4444' }}>
              {formatCurrency(summary.youOwe)}
            </Typography>
          </Box>
        </Box>
        <Grid container spacing={2}>
          {balances.map((balance) => (
            <Grid item xs={12} sm={6} md={4} key={balance.user._id}>
              <Card 
                elevation={0}
                onClick={() => handleUserClick(balance)}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  background: balance.type === 'owes_you' 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
                  border: `1px solid ${balance.type === 'owes_you' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(249, 115, 22, 0.4)'}`,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: balance.type === 'owes_you'
                      ? '0 20px 30px -10px rgba(16, 185, 129, 0.5)'
                      : '0 20px 30px -10px rgba(249, 115, 22, 0.5)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    {balance.type === 'owes_you' ? (
                      <TrendingUpIcon 
                        sx={{ 
                          mr: 1.5, 
                          fontSize: 28,
                          color: '#10b981',
                        }} 
                      />
                    ) : (
                      <TrendingDownIcon 
                        sx={{ 
                          mr: 1.5, 
                          fontSize: 28,
                          color: '#f97316',
                        }} 
                      />
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        color: balance.type === 'owes_you' ? '#10b981' : '#f97316',
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
      </CardContent>
    </Card>
  );
};
