import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  Select,
  MenuItem,
  TextField,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Savings,
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import { getDateRange } from '../utils/getDateRange';
import NavBar from '../components/NavBar';
import BottomBar from '../components/BottomBar';
import { cardBg } from '../utils/themeConstants';
import CashFlowSankey from '../components/CashFlowSankey';
import CashFlowBarChart from '../components/CashFlowBarChart';

function CashFlow() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('year');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const controller = new AbortController();
    fetchGroups(controller.signal);
    return () => controller.abort();
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, customStart, customEnd, groupFilter]);

  const fetchGroups = async (signal) => {
    try {
      const res = await axios.get('/api/groups', { signal });
      setGroups(res.data);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error('Error fetching groups:', err);
    }
  };

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      setError('');
      const range = getDateRange(dateFilter, customStart, customEnd);
      if (!range) return;
      
      let url = `/api/cashflow?startDate=${range.startDate}&endDate=${range.endDate}`;
      if (groupFilter) url += `&group=${groupFilter}`;

      const res = await axios.get(url, { signal });
      setData(res.data);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error('Error fetching cash flow:', err);
      setError(err.response?.data?.message || 'Failed to load cash flow data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar title="Cash Flow" showBack backPath="/dashboard" />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 10 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              sx={{ fontWeight: 600, fontSize: '0.85rem' }}
            >
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
          {dateFilter === 'custom' && (
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
          {groups.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                displayEmpty
                sx={{ fontWeight: 600, fontSize: '0.85rem' }}
              >
                <MenuItem value="">All Groups</MenuItem>
                {groups.map(g => (
                  <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card
                  sx={{
                    background: cardBg.emeraldTeal(theme.palette.mode),
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#10b981' }}>
                      {formatCurrency(data.totalIncome)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={600}>
                      Total Income
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card
                  sx={{
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)',
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)'}`,
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingDown sx={{ fontSize: 40, color: '#f97316', mb: 1 }} />
                    <Typography variant="h4" fontWeight={800} sx={{ color: '#f97316' }}>
                      {formatCurrency(data.totalExpenses)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={600}>
                      Total Expenses
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card
                  sx={{
                    background: theme.palette.mode === 'dark'
                      ? data.netSavings >= 0
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)'
                      : data.netSavings >= 0
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
                    borderRadius: 3,
                    border: `1px solid ${
                      data.netSavings >= 0
                        ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)')
                        : (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)')
                    }`,
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Savings sx={{ fontSize: 40, color: data.netSavings >= 0 ? '#8b5cf6' : '#ef4444', mb: 1 }} />
                    <Typography
                      variant="h4"
                      fontWeight={800}
                      sx={{ color: data.netSavings >= 0 ? '#8b5cf6' : '#ef4444' }}
                    >
                      {data.netSavings >= 0 ? '+' : '-'}{formatCurrency(data.netSavings)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" fontWeight={600}>
                      Net Savings
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Sankey Diagram */}
            <Box sx={{ mb: 4 }}>
              <CashFlowSankey
                incomeBySource={data.incomeBySource}
                expensesByCategory={data.expensesByCategory}
                totalIncome={data.totalIncome}
              />
            </Box>

            {/* Bar Chart */}
            <Box sx={{ mb: 4 }}>
              <CashFlowBarChart monthly={data.monthly} />
            </Box>
          </>
        ) : null}
      </Container>
      <BottomBar />
    </Box>
  );
}

export default CashFlow;

