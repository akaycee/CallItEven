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
  Switch,
  FormControlLabel,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Delete,
  Add,
  Edit,
  Repeat,
  AttachMoney,
  TrendingUp,
  AccountBalance,
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency } from '../utils/formatCurrency';
import { getDateRange } from '../utils/getDateRange';
import NavBar from '../components/NavBar';
import BottomBar from '../components/BottomBar';
import { GRADIENT_EMERALD_TEAL, GRADIENT_EMERALD_TEAL_HOVER, cardBg, gradientText } from '../utils/themeConstants';

function ManageIncome({ onDone, isDialog = false }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [incomes, setIncomes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, setError, success, setSuccess, showSuccess } = useNotification();
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [dateFilter, setDateFilter] = useState('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const emptyForm = {
    source: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'General',
    group: '',
    tag: '',
    isRecurring: false,
    recurrenceFrequency: 'monthly',
    recurrenceEndDate: '',
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [user, dateFilter, customStart, customEnd]);

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      setError('');
      const range = getDateRange(dateFilter, customStart, customEnd);
      const params = range
        ? `?startDate=${range.startDate}&endDate=${range.endDate}`
        : '';
      const [incomeRes, groupsRes] = await Promise.all([
        axios.get(`/api/income${params}`, { signal }),
        axios.get('/api/groups', { signal }),
      ]);
      setIncomes(incomeRes.data);
      setGroups(groupsRes.data);
    } catch (error) {
      if (axios.isCancel(error)) return;
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      setError('');
      if (!form.source.trim()) {
        setError('Please enter a source');
        return;
      }
      if (!form.amount || parseFloat(form.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      if (!form.date) {
        setError('Please select a date');
        return;
      }

      const payload = {
        source: form.source,
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description,
        category: form.category || 'General',
        group: form.group || undefined,
        tag: form.tag || '',
        isRecurring: form.isRecurring,
      };
      if (form.isRecurring) {
        payload.recurrence = {
          frequency: form.recurrenceFrequency,
          endDate: form.recurrenceEndDate || undefined,
        };
      }

      await axios.post('/api/income', payload);
      showSuccess(`Income "${form.source}" added successfully`);
      setAddDialog(false);
      setForm(emptyForm);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add income');
    }
  };

  const handleEditClick = (income) => {
    setSelectedIncome(income);
    setForm({
      source: income.source,
      amount: income.amount.toString(),
      date: new Date(income.date).toISOString().split('T')[0],
      description: income.description || '',
      category: income.category || 'General',
      group: income.group || '',
      tag: income.tag || '',
      isRecurring: income.isRecurring || false,
      recurrenceFrequency: income.recurrence?.frequency || 'monthly',
      recurrenceEndDate: income.recurrence?.endDate
        ? new Date(income.recurrence.endDate).toISOString().split('T')[0]
        : '',
    });
    setEditDialog(true);
  };

  const handleEditConfirm = async () => {
    try {
      setError('');
      if (!form.source.trim()) {
        setError('Please enter a source');
        return;
      }
      if (!form.amount || parseFloat(form.amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const payload = {
        source: form.source,
        amount: parseFloat(form.amount),
        date: form.date,
        description: form.description,
        category: form.category || 'General',
        group: form.group || undefined,
        tag: form.tag || '',
        isRecurring: form.isRecurring,
      };
      if (form.isRecurring) {
        payload.recurrence = {
          frequency: form.recurrenceFrequency,
          endDate: form.recurrenceEndDate || undefined,
        };
      }

      await axios.put(`/api/income/${selectedIncome._id}`, payload);
      showSuccess(`Income "${form.source}" updated successfully`);
      setEditDialog(false);
      setSelectedIncome(null);
      setForm(emptyForm);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update income');
    }
  };

  const handleDeleteClick = (income) => {
    setSelectedIncome(income);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await axios.delete(`/api/income/${selectedIncome._id}`);
      showSuccess(`Income "${selectedIncome.source}" deleted successfully`);
      setDeleteDialog(false);
      setSelectedIncome(null);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete income');
    }
  };

  // Summary stats
  const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
  const uniqueSources = [...new Set(incomes.map(inc => inc.source))].length;
  const largestSource = incomes.length > 0
    ? incomes.reduce((max, inc) => inc.amount > max.amount ? inc : max, incomes[0])
    : null;

  const INCOME_CATEGORIES = ['General', 'Employment', 'Freelance', 'Investment', 'Rental', 'Business', 'Gift', 'Other'];

  const renderIncomeForm = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
      <TextField
        label="Source"
        value={form.source}
        onChange={(e) => setForm({ ...form, source: e.target.value })}
        placeholder="e.g., Salary, Freelance, Rental"
        fullWidth
        required
      />
      <TextField
        label="Amount"
        type="number"
        value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
        InputProps={{
          startAdornment: <InputAdornment position="start">$</InputAdornment>,
        }}
        fullWidth
        required
      />
      <TextField
        label="Date"
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        InputLabelProps={{ shrink: true }}
        fullWidth
        required
      />
      <TextField
        label="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Optional description"
        fullWidth
        multiline
        rows={2}
      />
      <FormControl fullWidth>
        <InputLabel>Category</InputLabel>
        <Select
          value={form.category}
          label="Category"
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {INCOME_CATEGORIES.map(cat => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Tag"
        value={form.tag}
        onChange={(e) => setForm({ ...form, tag: e.target.value })}
        placeholder="Optional tag for filtering (e.g., vacation, project-x)"
        fullWidth
      />
      {groups.length > 0 && (
        <FormControl fullWidth>
          <InputLabel>Group (optional)</InputLabel>
          <Select
            value={form.group}
            label="Group (optional)"
            onChange={(e) => setForm({ ...form, group: e.target.value })}
          >
            <MenuItem value="">None</MenuItem>
            {groups.map(g => (
              <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <FormControlLabel
        control={
          <Switch
            checked={form.isRecurring}
            onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
            color="primary"
          />
        }
        label="Recurring Income"
      />
      {form.isRecurring && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Frequency</InputLabel>
            <Select
              value={form.recurrenceFrequency}
              label="Frequency"
              onChange={(e) => setForm({ ...form, recurrenceFrequency: e.target.value })}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="biweekly">Biweekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="End Date (optional)"
            type="date"
            value={form.recurrenceEndDate}
            onChange={(e) => setForm({ ...form, recurrenceEndDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
        </Box>
      )}
    </Box>
  );

  // When rendered as a dialog, show only the add form inline
  if (isDialog) {
    return (
      <Box sx={{ p: 3 }}>
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
        {renderIncomeForm()}
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => onDone && onDone()}
            sx={{ borderWidth: 2, '&:hover': { borderWidth: 2 } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            fullWidth
            disabled={!form.source || !form.amount}
            onClick={async () => {
              await handleAdd();
              if (onDone && !error) {
                setTimeout(() => onDone(), 500);
              }
            }}
            sx={{
              background: GRADIENT_EMERALD_TEAL,
              color: 'white',
              fontWeight: 700,
              '&:hover': { background: GRADIENT_EMERALD_TEAL_HOVER },
            }}
          >
            Add Income
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar title="Manage Income" showBack backPath="/dashboard" />

      <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
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

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: cardBg.emeraldTeal(theme.palette.mode),
                borderRadius: 3,
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 32, color: '#10b981', mb: 1 }} />
                <Typography variant="h5" fontWeight={800} sx={{ color: '#10b981' }}>
                  {formatCurrency(totalIncome)}
                </Typography>
                <Typography variant="body2" color="text.secondary">Total Income</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: cardBg.purplePink(theme.palette.mode),
                borderRadius: 3,
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <AccountBalance sx={{ fontSize: 32, color: '#8b5cf6', mb: 1 }} />
                <Typography variant="h5" fontWeight={800} sx={{ color: '#8b5cf6' }}>
                  {uniqueSources}
                </Typography>
                <Typography variant="body2" color="text.secondary">Income Sources</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card
              sx={{
                background: cardBg.orangeTeal(theme.palette.mode),
                borderRadius: 3,
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)'}`,
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 32, color: '#f97316', mb: 1 }} />
                <Typography variant="h5" fontWeight={800} sx={{ color: '#f97316' }}>
                  {largestSource ? formatCurrency(largestSource.amount) : '$0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Largest: {largestSource?.source || 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main List Card */}
        <Card
          sx={{
            background: cardBg.emeraldTeal(theme.palette.mode),
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
                  ...gradientText(GRADIENT_EMERALD_TEAL),
                }}
              >
                Income Sources
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
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
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => { setForm(emptyForm); setAddDialog(true); }}
                  sx={{
                    background: GRADIENT_EMERALD_TEAL,
                    color: 'white',
                    '&:hover': {
                      background: GRADIENT_EMERALD_TEAL_HOVER,
                    },
                  }}
                >
                  Add Income
                </Button>
                <TextField
                  size="small"
                  placeholder="Filter by tag..."
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  sx={{ minWidth: 150 }}
                  InputProps={{
                    sx: { fontSize: '0.85rem' },
                  }}
                />
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : incomes.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No income entries yet. Click "Add Income" to track your first income source.
                </Typography>
              </Box>
            ) : (
              <List>
                {incomes
                  .filter(inc => !tagFilter || (inc.tag && inc.tag.toLowerCase().includes(tagFilter.toLowerCase())))
                  .map((income, index) => (
                  <React.Fragment key={income._id || `expanded-${index}`}>
                    <ListItem
                      sx={{
                        mb: 1,
                        borderRadius: 2,
                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        p: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#10b981',
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight={600}>{income.source}</Typography>
                            {income.isRecurring && (
                              <Chip
                                icon={<Repeat sx={{ fontSize: 14 }} />}
                                label={income.recurrence?.frequency}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {income._isExpanded && (
                              <Chip label="Recurring" size="small" color="info" variant="outlined" />
                            )}
                            {income.group && (
                              <Chip label="Group" size="small" color="secondary" variant="outlined" />
                            )}
                            {income.tag && (
                              <Chip label={income.tag} size="small" color="default" variant="outlined" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(income.date).toLocaleDateString()} Â· {income.category}
                              {income.description && ` Â· ${income.description}`}
                            </Typography>
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{ color: '#10b981', mr: 1 }}
                        >
                          {formatCurrency(income.amount)}
                        </Typography>
                        {!income._isExpanded && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(income)}
                              aria-label="Edit income"
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(income)}
                              aria-label="Delete income"
                              sx={{ color: theme.palette.error.main }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Add Income Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Income</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {renderIncomeForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddDialog(false); setError(''); }}>Cancel</Button>
          <Button
            onClick={handleAdd}
            variant="contained"
            sx={{
              background: GRADIENT_EMERALD_TEAL,
              '&:hover': { background: GRADIENT_EMERALD_TEAL_HOVER },
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Income Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Income</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {renderIncomeForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setEditDialog(false); setError(''); }}>Cancel</Button>
          <Button
            onClick={handleEditConfirm}
            variant="contained"
            sx={{
              background: GRADIENT_EMERALD_TEAL,
              '&:hover': { background: GRADIENT_EMERALD_TEAL_HOVER },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Income</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedIncome?.source}</strong> ({formatCurrency(selectedIncome?.amount || 0)})?
            {selectedIncome?.isRecurring && ' This will delete all future occurrences of this recurring income.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <BottomBar />
    </Box>
  );
}

export default ManageIncome;

