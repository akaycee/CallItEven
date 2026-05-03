import React, { useState, useEffect, useContext } from 'react';
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
  Chip,
  Divider,
  CircularProgress,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Delete, Add, Edit, TrendingUp, TrendingDown, Refresh, Search } from '@mui/icons-material';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency } from '../utils/formatCurrency';
import NavBar from '../components/NavBar';
import BottomBar from '../components/BottomBar';
import HouseholdToggle from '../components/HouseholdToggle';
import { cardBg, gradientText } from '../utils/themeConstants';

Chart.register(ArcElement, Tooltip, Legend);

const INVESTMENT_TYPES = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'bonds', label: 'Bonds' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'etf', label: 'ETF' },
  { value: 'savings_account', label: 'Savings Account' },
  { value: 'espp', label: 'ESPP' },
  { value: 'other', label: 'Other' },
];

const ACCOUNT_TYPES = [
  { value: 'taxable', label: 'Taxable Brokerage' },
  { value: 'roth_ira', label: 'Roth IRA' },
  { value: 'traditional_ira', label: 'Traditional IRA' },
  { value: '401k', label: '401k' },
  { value: 'hsa', label: 'HSA' },
  { value: '529', label: '529' },
  { value: 'other', label: 'Other' },
];

const GRADIENT_BLUE_INDIGO = 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)';
const GRADIENT_BLUE_INDIGO_HOVER = 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)';

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return diffMin + 'm ago';
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + 'h ago';
  const diffDay = Math.floor(diffHr / 24);
  return diffDay + 'd ago';
}

function getEsppQualification(inv) {
  if (inv.type !== 'espp') return null;
  const now = new Date();
  const purchaseDate = new Date(inv.purchaseDate);
  const offeringDate = inv.offeringDate ? new Date(inv.offeringDate) : null;

  const oneYearFromPurchase = new Date(purchaseDate);
  oneYearFromPurchase.setFullYear(oneYearFromPurchase.getFullYear() + 1);

  const twoYearsFromOffering = offeringDate ? new Date(offeringDate) : null;
  if (twoYearsFromOffering) twoYearsFromOffering.setFullYear(twoYearsFromOffering.getFullYear() + 2);

  const purchaseQualified = now >= oneYearFromPurchase;
  const offeringQualified = !twoYearsFromOffering || now >= twoYearsFromOffering;

  if (purchaseQualified && offeringQualified) {
    return { status: 'qualified', color: '#10b981', label: 'Qualified Disposition' };
  }

  const qualDate = !twoYearsFromOffering ? oneYearFromPurchase
    : oneYearFromPurchase > twoYearsFromOffering ? oneYearFromPurchase : twoYearsFromOffering;
  const daysLeft = Math.ceil((qualDate - now) / (1000 * 60 * 60 * 24));
  return { status: 'disqualifying', color: '#f97316', label: `Disqualifying (${daysLeft}d until qualified)` };
}

function ManageInvestments() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error, setError, success, setSuccess, showSuccess } = useNotification();
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [viewMode, setViewMode] = useState('personal');
  const [refreshing, setRefreshing] = useState(false);
  const [chartGroupBy, setChartGroupBy] = useState('type');

  // Ticker verification state
  const [investmentMode, setInvestmentMode] = useState('manual'); // 'ticker' | 'manual'
  const [tickerInput, setTickerInput] = useState('');
  const [tickerVerified, setTickerVerified] = useState(false);
  const [tickerInfo, setTickerInfo] = useState(null); // { symbol, name, price, exchange, currency }
  const [verifying, setVerifying] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const emptyForm = {
    name: '', type: 'stocks', account: 'taxable', purchasePrice: '', currentValue: '',
    quantity: '1', purchaseDate: new Date().toISOString().split('T')[0],
    description: '', tag: '', ticker: null, interestRate: '', offeringDate: '', esppDiscount: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const controller = new AbortController();
    refreshAndFetch(controller.signal);
    return () => controller.abort();
  }, [user, typeFilter, accountFilter, viewMode]);

  const refreshAndFetch = async (signal) => {
    try {
      setLoading(true);
      setError('');
      // Auto-refresh ticker prices on page load
      try { await axios.put('/api/investments/refresh-prices', null, { signal }); } catch (e) { /* silent */ }
      await fetchDataOnly(signal);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(err.response?.data?.message || 'Failed to load investments');
    } finally { setLoading(false); }
  };

  const fetchDataOnly = async (signal) => {
    let params = typeFilter ? `?type=${typeFilter}` : '';
    if (accountFilter) params += (params ? '&' : '?') + `account=${accountFilter}`;
    if (viewMode === 'household') params += (params ? '&' : '?') + 'household=true';
    const [invRes, sumRes] = await Promise.all([
      axios.get(`/api/investments${params}`, { signal }),
      axios.get(`/api/investments/summary${viewMode === 'household' ? '?household=true' : ''}`, { signal }),
    ]);
    setInvestments(invRes.data);
    setSummary(sumRes.data);
  };

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      setError('');
      await fetchDataOnly(signal);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(err.response?.data?.message || 'Failed to load investments');
    } finally { setLoading(false); }
  };

  const handleRefreshPrices = async () => {
    try {
      setRefreshing(true);
      const res = await axios.put('/api/investments/refresh-prices');
      await fetchDataOnly();
      const msg = res.data.failed > 0
        ? `Updated ${res.data.updated} investments (${res.data.failed} failed)`
        : `Updated ${res.data.updated} investment prices`;
      showSuccess(msg);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refresh prices');
    } finally { setRefreshing(false); }
  };

  const handleVerifyTicker = async () => {
    try {
      setVerifying(true);
      setDialogError('');
      setTickerVerified(false);
      setTickerInfo(null);
      const symbol = tickerInput.trim().toUpperCase();
      if (!symbol) { setDialogError('Enter a ticker symbol'); setVerifying(false); return; }
      const dateParam = form.purchaseDate ? `?date=${form.purchaseDate}` : '';
      const res = await axios.get(`/api/investments/lookup/${encodeURIComponent(symbol)}${dateParam}`);
      setTickerInfo(res.data);
      setTickerVerified(false); // Not confirmed yet, just fetched
    } catch (err) {
      setDialogError(err.response?.data?.message || 'Ticker not found');
      setTickerInfo(null);
    } finally { setVerifying(false); }
  };

  const handleConfirmTicker = () => {
    if (!tickerInfo) return;
    setTickerVerified(true);
    setForm(f => ({
      ...f,
      ticker: tickerInfo.symbol,
      currentValue: tickerInfo.price.toString(),
      purchasePrice: tickerInfo.historicalPrice != null ? tickerInfo.historicalPrice.toString() : f.purchasePrice,
      name: f.name || tickerInfo.name,
    }));
  };

  const handlePurchaseDateChange = async (newDate) => {
    setForm(f => ({ ...f, purchaseDate: newDate }));
    // If ticker is verified, fetch historical price for the new date
    if (tickerVerified && form.ticker && newDate) {
      try {
        const res = await axios.get(`/api/investments/lookup/${encodeURIComponent(form.ticker)}?date=${newDate}`);
        if (res.data.historicalPrice != null) {
          setForm(f => ({ ...f, purchasePrice: res.data.historicalPrice.toString() }));
          setTickerInfo(prev => ({ ...prev, historicalPrice: res.data.historicalPrice, historicalDate: res.data.historicalDate }));
        }
      } catch (err) { /* silent - keep existing purchase price */ }
    }
  };

  const handleAdd = async () => {
    try {
      setDialogError('');
      if (!form.name.trim()) { setDialogError('Name is required'); return; }
      if (!form.purchasePrice || parseFloat(form.purchasePrice) < 0) { setDialogError('Valid purchase price required'); return; }
      if (!form.currentValue || parseFloat(form.currentValue) < 0) { setDialogError('Valid current value required'); return; }
      if (investmentMode === 'ticker' && !tickerVerified) { setDialogError('Please verify the ticker first'); return; }
      await axios.post('/api/investments', {
        ...form,
        purchasePrice: parseFloat(form.purchasePrice),
        currentValue: parseFloat(form.currentValue),
        quantity: parseFloat(form.quantity) || 1,
        ticker: investmentMode === 'ticker' ? form.ticker : null,
        interestRate: form.type === 'savings_account' && form.interestRate ? parseFloat(form.interestRate) : null,
        offeringDate: form.type === 'espp' && form.offeringDate ? form.offeringDate : null,
        esppDiscount: form.type === 'espp' && form.esppDiscount ? parseFloat(form.esppDiscount) : null,
      });
      showSuccess('Investment added!');
      setAddDialog(false);
      resetFormState();
      fetchData();
    } catch (err) { setDialogError(err.response?.data?.message || 'Failed to add investment'); }
  };

  const handleEdit = async () => {
    try {
      setDialogError('');
      if (investmentMode === 'ticker' && !tickerVerified) { setDialogError('Please verify the ticker first'); return; }
      await axios.put(`/api/investments/${selectedInvestment._id}`, {
        ...form,
        purchasePrice: parseFloat(form.purchasePrice),
        currentValue: parseFloat(form.currentValue),
        quantity: parseFloat(form.quantity) || 1,
        ticker: investmentMode === 'ticker' ? form.ticker : null,
        interestRate: form.type === 'savings_account' && form.interestRate ? parseFloat(form.interestRate) : null,
        offeringDate: form.type === 'espp' && form.offeringDate ? form.offeringDate : null,
        esppDiscount: form.type === 'espp' && form.esppDiscount ? parseFloat(form.esppDiscount) : null,
      });
      showSuccess('Investment updated!');
      setEditDialog(false);
      setSelectedInvestment(null);
      resetFormState();
      fetchData();
    } catch (err) { setDialogError(err.response?.data?.message || 'Failed to update'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/investments/${selectedInvestment._id}`);
      showSuccess('Investment deleted');
      setDeleteDialog(false);
      setSelectedInvestment(null);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to delete'); }
  };

  const openEdit = (inv) => {
    setSelectedInvestment(inv);
    const hasTicker = !!inv.ticker;
    setInvestmentMode(hasTicker ? 'ticker' : 'manual');
    setTickerInput(inv.ticker || '');
    setTickerVerified(hasTicker);
    setTickerInfo(hasTicker ? { symbol: inv.ticker, name: inv.name, price: inv.currentValue, exchange: '', currency: 'USD' } : null);
    setForm({
      name: inv.name, type: inv.type,
      purchasePrice: inv.purchasePrice.toString(), currentValue: inv.currentValue.toString(),
      quantity: (inv.quantity || 1).toString(), purchaseDate: inv.purchaseDate?.split('T')[0] || '',
      description: inv.description || '', tag: inv.tag || '',
      ticker: inv.ticker || null, account: inv.account || 'taxable',
      interestRate: inv.interestRate != null ? inv.interestRate.toString() : '',
      offeringDate: inv.offeringDate ? inv.offeringDate.split('T')[0] : '',
      esppDiscount: inv.esppDiscount != null ? inv.esppDiscount.toString() : '',
    });
    setEditDialog(true);
  };

  const resetFormState = () => {
    setForm(emptyForm);
    setInvestmentMode('manual');
    setTickerInput('');
    setTickerVerified(false);
    setTickerInfo(null);
    setDialogError('');
  };

  const typeColors = ['#3b82f6','#6366f1','#10b981','#f97316','#ec4899','#06b6d4','#8b5cf6','#ef4444','#facc15','#a855f7','#14b8a6','#f43f5e'];

  const chartData = (() => {
    if (!investments || investments.length === 0) return null;
    const groups = {};
    investments.forEach(inv => {
      let key;
      if (chartGroupBy === 'type') {
        key = inv.type || 'other';
      } else if (chartGroupBy === 'account') {
        key = inv.account || 'taxable';
      } else {
        key = inv.tag || 'Untagged';
      }
      if (!groups[key]) groups[key] = 0;
      groups[key] += inv.currentValue * (inv.quantity || 1);
    });
    const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return null;
    const labelMap = chartGroupBy === 'type'
      ? (k) => INVESTMENT_TYPES.find(t => t.value === k)?.label || k
      : chartGroupBy === 'account'
        ? (k) => ACCOUNT_TYPES.find(a => a.value === k)?.label || k
        : (k) => k;
    return {
      keys: entries.map(e => e[0]),
      labels: entries.map(e => labelMap(e[0])),
      datasets: [{ data: entries.map(e => e[1]), backgroundColor: typeColors.slice(0, entries.length), borderWidth: 2, borderColor: theme.palette.background.paper, hoverOffset: 18 }],
    };
  })();

  const handleChartClick = (event, elements) => {
    if (elements.length > 0 && chartData) {
      const index = elements[0].index;
      const clickedKey = chartData.keys[index];
      if (chartGroupBy === 'type') {
        setTypeFilter(prev => prev === clickedKey ? '' : clickedKey);
      } else if (chartGroupBy === 'account') {
        setAccountFilter(prev => prev === clickedKey ? '' : clickedKey);
      }
      // For tag, no server-side filter — could add client-side later
    }
  };

  const renderForm = () => (
    <>
      {dialogError && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setDialogError('')}>{dialogError}</Alert>}
      {/* Investment Mode Toggle */}
      <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1 }}>
        <Button
          variant={investmentMode === 'ticker' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => { setInvestmentMode('ticker'); setTickerVerified(false); setTickerInfo(null); setTickerInput(''); }}
          sx={investmentMode === 'ticker' ? { background: GRADIENT_BLUE_INDIGO, '&:hover': { background: GRADIENT_BLUE_INDIGO_HOVER } } : {}}
        >
          Stock Ticker
        </Button>
        <Button
          variant={investmentMode === 'manual' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => { setInvestmentMode('manual'); setTickerVerified(false); setTickerInfo(null); setTickerInput(''); setForm(f => ({ ...f, ticker: null })); }}
          sx={investmentMode === 'manual' ? { background: GRADIENT_BLUE_INDIGO, '&:hover': { background: GRADIENT_BLUE_INDIGO_HOVER } } : {}}
        >
          Manual Account
        </Button>
      </Box>

      {/* Ticker Verification Section */}
      {investmentMode === 'ticker' && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              label="Ticker Symbol"
              placeholder="e.g. AAPL"
              value={tickerInput}
              onChange={e => { setTickerInput(e.target.value.toUpperCase()); setTickerVerified(false); setTickerInfo(null); }}
              margin="normal"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <Button
              variant="contained"
              onClick={handleVerifyTicker}
              disabled={verifying || !tickerInput.trim()}
              sx={{ mb: 1, minWidth: 100, background: GRADIENT_BLUE_INDIGO, '&:hover': { background: GRADIENT_BLUE_INDIGO_HOVER } }}
              startIcon={verifying ? <CircularProgress size={16} color="inherit" /> : <Search />}
            >
              {verifying ? 'Looking up...' : 'Verify'}
            </Button>
          </Box>

          {/* Ticker Info Card (shown after lookup, before confirm) */}
          {tickerInfo && !tickerVerified && (
            <Card sx={{ mt: 1, mb: 1, background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{tickerInfo.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {tickerInfo.symbol} {tickerInfo.exchange ? `\u00B7 ${tickerInfo.exchange}` : ''} {tickerInfo.currency ? `\u00B7 ${tickerInfo.currency}` : ''}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b82f6', mt: 0.5 }}>
                  Current: {formatCurrency(tickerInfo.price)}
                </Typography>
                {tickerInfo.historicalPrice != null && (
                  <Typography variant="body2" sx={{ color: '#8b5cf6', fontWeight: 600 }}>
                    Purchase date price: {formatCurrency(tickerInfo.historicalPrice)}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleConfirmTicker}
                  sx={{ mt: 1, background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)' } }}
                >
                  Confirm Ticker
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Verified badge */}
          {tickerVerified && tickerInfo && (
            <Alert severity="success" sx={{ mt: 1, mb: 1 }}>
              Verified: {tickerInfo.name} ({tickerInfo.symbol}) @ {formatCurrency(tickerInfo.price)}
              {tickerInfo.historicalPrice != null && ` | Purchase date: ${formatCurrency(tickerInfo.historicalPrice)}`}
            </Alert>
          )}
        </Box>
      )}

      <TextField fullWidth label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required margin="normal" />
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select value={form.type} label="Type" onChange={e => setForm({...form, type: e.target.value})}>
              {INVESTMENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Account</InputLabel>
            <Select value={form.account} label="Account" onChange={e => setForm({...form, account: e.target.value})}>
              {ACCOUNT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label={form.type === 'espp' ? 'FMV at Purchase' : 'Purchase Price'}
            type="number"
            value={form.purchasePrice}
            onChange={e => setForm({...form, purchasePrice: e.target.value})}
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ step: '0.01', min: '0' }}
            helperText={form.type === 'espp' ? 'Fair market value on the purchase date' : investmentMode === 'ticker' && tickerVerified ? 'Auto-filled from purchase date' : ''}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Current Value"
            type="number"
            value={form.currentValue}
            onChange={e => { if (investmentMode !== 'ticker' || !tickerVerified) setForm({...form, currentValue: e.target.value}); }}
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              readOnly: investmentMode === 'ticker' && tickerVerified,
            }}
            inputProps={{ step: '0.01', min: '0' }}
            helperText={investmentMode === 'ticker' && tickerVerified ? 'Auto-filled from ticker price' : ''}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField fullWidth label="Quantity" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} margin="normal" inputProps={{ step: '1', min: '0' }} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Purchase Date" type="date" value={form.purchaseDate} onChange={e => handlePurchaseDateChange(e.target.value)} margin="normal" InputLabelProps={{ shrink: true }} />
        </Grid>
      </Grid>
      {form.type === 'savings_account' && (
        <TextField
          fullWidth
          label="Interest Rate (APY %)"
          type="number"
          value={form.interestRate}
          onChange={e => setForm({...form, interestRate: e.target.value})}
          margin="normal"
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          inputProps={{ step: '0.01', min: '0' }}
        />
      )}
      {form.type === 'espp' && (
        <TextField
          fullWidth
          label="Offering Date"
          type="date"
          value={form.offeringDate}
          onChange={e => setForm({...form, offeringDate: e.target.value})}
          margin="normal"
          InputLabelProps={{ shrink: true }}
          helperText="Start of the ESPP offering period (needed for qualified disposition calculation)"
        />
      )}
      {form.type === 'espp' && (
        <TextField
          fullWidth
          label="ESPP Discount"
          type="number"
          value={form.esppDiscount}
          onChange={e => setForm({...form, esppDiscount: e.target.value})}
          margin="normal"
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          inputProps={{ step: '1', min: '0', max: '100' }}
          helperText={form.esppDiscount && form.purchasePrice ? `Cost basis: ${formatCurrency(parseFloat(form.purchasePrice) * (1 - parseFloat(form.esppDiscount) / 100))}` : 'Discount percentage applied to FMV (e.g., 15)'}
        />
      )}
      <TextField fullWidth label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} margin="normal" multiline rows={2} />
      <TextField fullWidth label="Tag" value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} margin="normal" />
    </>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar title="Investments" showBack backPath="/dashboard" />

      <Container maxWidth="md" sx={{ mt: { xs: 2, sm: 4 }, mb: 10, px: { xs: 1.5, sm: 3 } }}>
        <HouseholdToggle value={viewMode} onChange={(e, val) => { if (val) setViewMode(val); }} />

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Card sx={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary">Total Invested</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#3b82f6' }}>{formatCurrency(summary.totalInvested)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card sx={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary">Current Value</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(summary.currentValue)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card sx={{ background: summary.gainLoss >= 0 ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.1) 100%)', border: `1px solid ${summary.gainLoss >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary">Gain/Loss</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {summary.gainLoss >= 0 ? <TrendingUp sx={{ color: '#10b981', fontSize: 18 }} /> : <TrendingDown sx={{ color: '#ef4444', fontSize: 18 }} />}
                    <Typography variant="h6" sx={{ fontWeight: 700, color: summary.gainLoss >= 0 ? '#10b981' : '#ef4444' }}>{formatCurrency(Math.abs(summary.gainLoss))} ({summary.gainLossPercent.toFixed(1)}%)</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Portfolio Chart */}
        {chartData && chartData.labels.length > 0 && (
          <Card elevation={0} sx={{ mb: 3, background: cardBg.purpleTeal ? cardBg.purpleTeal(theme.palette.mode) : 'transparent', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, ...gradientText(GRADIENT_BLUE_INDIGO) }}>
                  Portfolio by {chartGroupBy === 'type' ? 'Type' : chartGroupBy === 'account' ? 'Account' : 'Tag'}
                </Typography>
                <ToggleButtonGroup
                  value={chartGroupBy}
                  exclusive
                  onChange={(e, val) => { if (val) setChartGroupBy(val); }}
                  size="small"
                >
                  <ToggleButton value="type" sx={{ textTransform: 'none', fontSize: '0.75rem' }}>Type</ToggleButton>
                  <ToggleButton value="account" sx={{ textTransform: 'none', fontSize: '0.75rem' }}>Account</ToggleButton>
                  <ToggleButton value="tag" sx={{ textTransform: 'none', fontSize: '0.75rem' }}>Tag</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box sx={{ maxWidth: 300, mx: 'auto' }}>
                <Doughnut data={chartData} options={{ responsive: true, onClick: handleChartClick, onHover: (event, elements) => { event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default'; }, plugins: { legend: { position: 'bottom', labels: { color: theme.palette.text.primary, usePointStyle: true } }, tooltip: { callbacks: { label: (ctx) => { const val = ctx.parsed || 0; const total = ctx.dataset.data.reduce((a, b) => a + b, 0); const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0; return ` ${ctx.label}: ${formatCurrency(val)} (${pct}%)`; } } } } }} />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Filters & Add button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}>
                <MenuItem value="">All Types</MenuItem>
                {INVESTMENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Account</InputLabel>
              <Select value={accountFilter} label="Account" onChange={e => setAccountFilter(e.target.value)}>
                <MenuItem value="">All Accounts</MenuItem>
                {ACCOUNT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
              onClick={handleRefreshPrices}
              disabled={refreshing}
              size="small"
            >
              Refresh Prices
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { resetFormState(); setAddDialog(true); }} sx={{ background: GRADIENT_BLUE_INDIGO, '&:hover': { background: GRADIENT_BLUE_INDIGO_HOVER } }}>
              Add Investment
            </Button>
          </Box>
        </Box>

        {/* Investment List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : investments.length === 0 ? (
          <Alert severity="info">No investments found. Add your first investment!</Alert>
        ) : (
          <List>
            {investments.map((inv, idx) => {
              const gainLoss = (inv.currentValue - inv.purchasePrice) * (inv.quantity || 1);
              const gainPct = inv.purchasePrice > 0 ? ((inv.currentValue - inv.purchasePrice) / inv.purchasePrice * 100) : 0;
              const hasTicker = !!inv.ticker;
              const esppQual = getEsppQualification(inv);
              return (
                <React.Fragment key={inv._id}>
                  {idx > 0 && <Divider />}
                  <ListItem sx={{ borderRadius: 2, mb: 1, transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.05)' } }}
                    secondaryAction={
                      <Box>
                        <IconButton size="small" onClick={() => openEdit(inv)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => { setSelectedInvestment(inv); setDeleteDialog(true); }} color="error"><Delete fontSize="small" /></IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={<Box display="flex" alignItems="center" gap={1} flexWrap="wrap"><Typography fontWeight={600}>{inv.name}</Typography>{hasTicker && <Chip label={inv.ticker} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 600 }} />}{!hasTicker && <Chip label="Manual" size="small" sx={{ bgcolor: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }} />}<Chip label={INVESTMENT_TYPES.find(t => t.value === inv.type)?.label || inv.type} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }} /><Chip label={ACCOUNT_TYPES.find(a => a.value === inv.account)?.label || inv.account || 'Taxable'} size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} />{inv.tag && <Chip label={inv.tag} size="small" variant="outlined" />}</Box>}
                      secondary={<Box><Typography variant="body2" component="span">Buy: {formatCurrency(inv.purchasePrice)} {'\u00D7'} {inv.quantity || 1} = {formatCurrency(inv.purchasePrice * (inv.quantity || 1))} {'\u2192'} Now: {formatCurrency(inv.currentValue * (inv.quantity || 1))}</Typography><Typography variant="body2" sx={{ color: gainLoss >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}> {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({gainPct.toFixed(1)}%)</Typography>{inv.type === 'savings_account' && inv.interestRate != null && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>APY: {inv.interestRate}%</Typography>}{inv.type === 'espp' && inv.esppDiscount != null && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Discount: {inv.esppDiscount}% {'\u00B7'} Cost basis: {formatCurrency(inv.purchasePrice * (1 - inv.esppDiscount / 100))}</Typography>}{esppQual && <Chip label={esppQual.label} size="small" sx={{ mt: 0.5, bgcolor: esppQual.status === 'qualified' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(249, 115, 22, 0.15)', color: esppQual.color, fontWeight: 600 }} />}{hasTicker && inv.lastPriceUpdate && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Price updated {formatTimeAgo(inv.lastPriceUpdate)}</Typography>}</Box>}
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Container>

      <BottomBar />

      {/* Add Dialog */}
      <Dialog open={addDialog} onClose={() => { setAddDialog(false); resetFormState(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, background: cardBg.purpleTeal ? cardBg.purpleTeal(theme.palette.mode) : undefined, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.98)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)' } }}>
        <DialogTitle sx={{ fontWeight: 700, ...gradientText(GRADIENT_BLUE_INDIGO) }}>Add Investment</DialogTitle>
        <DialogContent>{renderForm()}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setAddDialog(false); resetFormState(); }}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" disabled={investmentMode === 'ticker' && !tickerVerified} sx={{ background: GRADIENT_BLUE_INDIGO, '&:hover': { background: GRADIENT_BLUE_INDIGO_HOVER } }}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => { setEditDialog(false); resetFormState(); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, background: cardBg.purpleTeal ? cardBg.purpleTeal(theme.palette.mode) : undefined, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.98)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)' } }}>
        <DialogTitle sx={{ fontWeight: 700, ...gradientText(GRADIENT_BLUE_INDIGO) }}>Edit Investment</DialogTitle>
        <DialogContent>{renderForm()}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setEditDialog(false); resetFormState(); }}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained" disabled={investmentMode === 'ticker' && !tickerVerified} sx={{ background: GRADIENT_BLUE_INDIGO, '&:hover': { background: GRADIENT_BLUE_INDIGO_HOVER } }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Investment</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete "{selectedInvestment?.name}"?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ManageInvestments;
