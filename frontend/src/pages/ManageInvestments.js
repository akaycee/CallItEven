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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Delete, Add, Edit, TrendingUp, TrendingDown } from '@mui/icons-material';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement } from 'chart.js';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency } from '../utils/formatCurrency';
import NavBar from '../components/NavBar';
import BottomBar from '../components/BottomBar';
import HouseholdToggle from '../components/HouseholdToggle';
import { cardBg, gradientText } from '../utils/themeConstants';

Chart.register(ArcElement);

const INVESTMENT_TYPES = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'bonds', label: 'Bonds' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'etf', label: 'ETF' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'other', label: 'Other' },
];

const GRADIENT_BLUE_INDIGO = 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)';
const GRADIENT_BLUE_INDIGO_HOVER = 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)';

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
  const [viewMode, setViewMode] = useState('personal');

  const emptyForm = {
    name: '', type: 'stocks', purchasePrice: '', currentValue: '',
    quantity: '1', purchaseDate: new Date().toISOString().split('T')[0],
    description: '', tag: '', hideFromFamily: false,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [user, typeFilter, viewMode]);

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      setError('');
      let params = typeFilter ? `?type=${typeFilter}` : '';
      if (viewMode === 'household') params += (params ? '&' : '?') + 'household=true';
      const [invRes, sumRes] = await Promise.all([
        axios.get(`/api/investments${params}`, { signal }),
        axios.get(`/api/investments/summary${viewMode === 'household' ? '?household=true' : ''}`, { signal }),
      ]);
      setInvestments(invRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(err.response?.data?.message || 'Failed to load investments');
    } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    try {
      setError('');
      if (!form.name.trim()) { setError('Name is required'); return; }
      if (!form.purchasePrice || parseFloat(form.purchasePrice) < 0) { setError('Valid purchase price required'); return; }
      if (!form.currentValue || parseFloat(form.currentValue) < 0) { setError('Valid current value required'); return; }
      await axios.post('/api/investments', {
        ...form,
        purchasePrice: parseFloat(form.purchasePrice),
        currentValue: parseFloat(form.currentValue),
        quantity: parseFloat(form.quantity) || 1,
      });
      showSuccess('Investment added!');
      setAddDialog(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to add investment'); }
  };

  const handleEdit = async () => {
    try {
      setError('');
      await axios.put(`/api/investments/${selectedInvestment._id}`, {
        ...form,
        purchasePrice: parseFloat(form.purchasePrice),
        currentValue: parseFloat(form.currentValue),
        quantity: parseFloat(form.quantity) || 1,
      });
      showSuccess('Investment updated!');
      setEditDialog(false);
      setSelectedInvestment(null);
      setForm(emptyForm);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to update'); }
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
    setForm({
      name: inv.name, type: inv.type,
      purchasePrice: inv.purchasePrice.toString(), currentValue: inv.currentValue.toString(),
      quantity: (inv.quantity || 1).toString(), purchaseDate: inv.purchaseDate?.split('T')[0] || '',
      description: inv.description || '', tag: inv.tag || '', hideFromFamily: !!inv.hideFromFamily,
    });
    setEditDialog(true);
  };

  const typeColors = ['#3b82f6','#6366f1','#10b981','#f97316','#ec4899','#06b6d4','#8b5cf6','#ef4444'];

  const chartData = summary?.byType ? {
    labels: summary.byType.map(t => INVESTMENT_TYPES.find(it => it.value === t.type)?.label || t.type),
    datasets: [{ data: summary.byType.map(t => t.currentValue), backgroundColor: typeColors.slice(0, summary.byType.length), borderWidth: 2, borderColor: theme.palette.background.paper }],
  } : null;

  const renderForm = () => (
    <>
      <TextField fullWidth label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required margin="normal" />
      <FormControl fullWidth margin="normal">
        <InputLabel>Type</InputLabel>
        <Select value={form.type} label="Type" onChange={e => setForm({...form, type: e.target.value})}>
          {INVESTMENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
        </Select>
      </FormControl>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField fullWidth label="Purchase Price" type="number" value={form.purchasePrice} onChange={e => setForm({...form, purchasePrice: e.target.value})} margin="normal" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} inputProps={{ step: '0.01', min: '0' }} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Current Value" type="number" value={form.currentValue} onChange={e => setForm({...form, currentValue: e.target.value})} margin="normal" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} inputProps={{ step: '0.01', min: '0' }} />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField fullWidth label="Quantity" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} margin="normal" inputProps={{ step: '1', min: '0' }} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Purchase Date" type="date" value={form.purchaseDate} onChange={e => setForm({...form, purchaseDate: e.target.value})} margin="normal" InputLabelProps={{ shrink: true }} />
        </Grid>
      </Grid>
      <TextField fullWidth label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} margin="normal" multiline rows={2} />
      <TextField fullWidth label="Tag" value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} margin="normal" />
      <FormControlLabel control={<Switch checked={form.hideFromFamily} onChange={e => setForm({...form, hideFromFamily: e.target.checked})} />} label="Hide from Family" sx={{ mt: 1 }} />
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

        {/* Type Chart */}
        {chartData && chartData.labels.length > 0 && (
          <Card elevation={0} sx={{ mb: 3, background: cardBg.purpleTeal ? cardBg.purpleTeal(theme.palette.mode) : 'transparent', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, ...gradientText(GRADIENT_BLUE_INDIGO) }}>Portfolio by Type</Typography>
              <Box sx={{ maxWidth: 300, mx: 'auto' }}>
                <Doughnut data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { color: theme.palette.text.primary, usePointStyle: true } } } }} />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Filters & Add button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} label="Type" onChange={e => setTypeFilter(e.target.value)}>
              <MenuItem value="">All Types</MenuItem>
              {INVESTMENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setAddDialog(true); }} sx={{ background: GRADIENT_BLUE_INDIGO, '&:hover': { background: GRADIENT_BLUE_INDIGO_HOVER } }}>
            Add Investment
          </Button>
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
                      primary={<Box display="flex" alignItems="center" gap={1}><Typography fontWeight={600}>{inv.name}</Typography><Chip label={INVESTMENT_TYPES.find(t => t.value === inv.type)?.label || inv.type} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }} />{inv.tag && <Chip label={inv.tag} size="small" variant="outlined" />}</Box>}
                      secondary={<Box><Typography variant="body2" component="span">Buy: {formatCurrency(inv.purchasePrice)} × {inv.quantity || 1} = {formatCurrency(inv.purchasePrice * (inv.quantity || 1))} → Now: {formatCurrency(inv.currentValue * (inv.quantity || 1))}</Typography><Typography variant="body2" sx={{ color: gainLoss >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}> {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} ({gainPct.toFixed(1)}%)</Typography></Box>}
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
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, background: cardBg.purpleTeal ? cardBg.purpleTeal(theme.palette.mode) : undefined, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.98)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)' } }}>
        <DialogTitle sx={{ fontWeight: 700, ...gradientText(GRADIENT_BLUE_INDIGO) }}>Add Investment</DialogTitle>
        <DialogContent>{renderForm()}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" sx={{ background: GRADIENT_BLUE_INDIGO, '&:hover': { background: GRADIENT_BLUE_INDIGO_HOVER } }}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, background: cardBg.purpleTeal ? cardBg.purpleTeal(theme.palette.mode) : undefined, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.98)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)' } }}>
        <DialogTitle sx={{ fontWeight: 700, ...gradientText(GRADIENT_BLUE_INDIGO) }}>Edit Investment</DialogTitle>
        <DialogContent>{renderForm()}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained" sx={{ background: GRADIENT_BLUE_INDIGO, '&:hover': { background: GRADIENT_BLUE_INDIGO_HOVER } }}>Save</Button>
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
