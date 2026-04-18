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
  LinearProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Delete, Add, Edit, Savings, CheckCircle, Timer } from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import { formatCurrency } from '../utils/formatCurrency';
import NavBar from '../components/NavBar';
import BottomBar from '../components/BottomBar';
import HouseholdToggle from '../components/HouseholdToggle';
import { FullCelebration } from '../components/CelebrationOverlay';
import { cardBg, gradientText, GRADIENT_EMERALD_TEAL, GRADIENT_EMERALD_TEAL_HOVER } from '../utils/themeConstants';

const GRADIENT_PURPLE_EMERALD = 'linear-gradient(135deg, #8b5cf6 0%, #10b981 100%)';
const GRADIENT_PURPLE_EMERALD_HOVER = 'linear-gradient(135deg, #7c3aed 0%, #059669 100%)';

function ManageSavings() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error, setError, success, setSuccess, showSuccess } = useNotification();
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [contributeDialog, setContributeDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [viewMode, setViewMode] = useState('personal');
  const [showCelebration, setShowCelebration] = useState(false);

  const emptyForm = {
    name: '', targetAmount: '', currentAmount: '0',
    deadline: '', category: 'General', description: '',
    isFamilyGoal: false,
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [user, viewMode]);

  const fetchData = async (signal) => {
    try {
      setLoading(true);
      setError('');
      const params = viewMode === 'household' ? '?household=true' : '';
      const [goalsRes, sumRes] = await Promise.all([
        axios.get(`/api/savings${params}`, { signal }),
        axios.get(`/api/savings/summary${params}`, { signal }),
      ]);
      setGoals(goalsRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(err.response?.data?.message || 'Failed to load savings goals');
    } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    try {
      setError('');
      if (!form.name.trim()) { setError('Name is required'); return; }
      if (!form.targetAmount || parseFloat(form.targetAmount) <= 0) { setError('Valid target amount required'); return; }
      await axios.post('/api/savings', {
        ...form,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount) || 0,
        deadline: form.deadline || undefined,
      });
      showSuccess('Savings goal created!');
      setAddDialog(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to create goal'); }
  };

  const handleEdit = async () => {
    try {
      setError('');
      await axios.put(`/api/savings/${selectedGoal._id}`, {
        ...form,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount) || 0,
        deadline: form.deadline || undefined,
      });
      showSuccess('Goal updated!');
      setEditDialog(false);
      setSelectedGoal(null);
      setForm(emptyForm);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to update goal'); }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/savings/${selectedGoal._id}`);
      showSuccess('Goal deleted');
      setDeleteDialog(false);
      setSelectedGoal(null);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to delete goal'); }
  };

  const handleContribute = async () => {
    try {
      setError('');
      const amount = parseFloat(contributeAmount);
      if (!amount || amount <= 0) { setError('Enter a valid amount'); return; }
      const res = await axios.put(`/api/savings/${selectedGoal._id}/contribute`, { amount });
      if (res.data.isComplete) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3500);
      }
      showSuccess(`Added ${formatCurrency(amount)} to "${selectedGoal.name}"!`);
      setContributeDialog(false);
      setContributeAmount('');
      setSelectedGoal(null);
      fetchData();
    } catch (err) { setError(err.response?.data?.message || 'Failed to add contribution'); }
  };

  const openEdit = (goal) => {
    setSelectedGoal(goal);
    setForm({
      name: goal.name, targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline?.split('T')[0] || '',
      category: goal.category || 'General', description: goal.description || '',
      isFamilyGoal: !!goal.isFamilyGoal,
    });
    setEditDialog(true);
  };

  const renderForm = () => (
    <>
      <TextField fullWidth label="Goal Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required margin="normal" />
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField fullWidth label="Target Amount" type="number" value={form.targetAmount} onChange={e => setForm({...form, targetAmount: e.target.value})} margin="normal" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
        </Grid>
        <Grid item xs={6}>
          <TextField fullWidth label="Current Amount" type="number" value={form.currentAmount} onChange={e => setForm({...form, currentAmount: e.target.value})} margin="normal" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
        </Grid>
      </Grid>
      <TextField fullWidth label="Deadline" type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} margin="normal" InputLabelProps={{ shrink: true }} />
      <TextField fullWidth label="Category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} margin="normal" />
      <TextField fullWidth label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} margin="normal" multiline rows={2} />
      <FormControlLabel control={<Switch checked={form.isFamilyGoal} onChange={e => setForm({...form, isFamilyGoal: e.target.checked})} />} label="Family Goal" sx={{ mt: 1 }} />
    </>
  );

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
      <FullCelebration show={showCelebration} />
      <NavBar title="Savings Goals" showBack backPath="/dashboard" />

      <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
        <HouseholdToggle value={viewMode} onChange={(e, val) => { if (val) setViewMode(val); }} />

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary">Total Saved</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#8b5cf6' }}>{formatCurrency(summary.totalSaved)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary">Active Goals</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>{summary.goalCount - summary.completedCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary">Completed</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#06b6d4' }}>{summary.completedCount}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary">Next Deadline</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#f97316' }}>{summary.nearestDeadline ? `${summary.nearestDeadline.name} (${daysUntil(summary.nearestDeadline.deadline)}d)` : 'None'}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Add button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm(emptyForm); setAddDialog(true); }} sx={{ background: GRADIENT_PURPLE_EMERALD, '&:hover': { background: GRADIENT_PURPLE_EMERALD_HOVER } }}>
            New Goal
          </Button>
        </Box>

        {/* Goals List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : goals.length === 0 ? (
          <Alert severity="info">No savings goals found. Create your first goal!</Alert>
        ) : (
          <List>
            {goals.map((goal, idx) => {
              const progress = goal.progress || 0;
              const days = daysUntil(goal.deadline);
              return (
                <React.Fragment key={goal._id}>
                  {idx > 0 && <Divider />}
                  <ListItem
                    sx={{ flexDirection: 'column', alignItems: 'stretch', borderRadius: 2, mb: 1, py: 2, transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.03)' } }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {goal.isComplete ? <CheckCircle sx={{ color: '#10b981' }} /> : <Savings sx={{ color: '#8b5cf6' }} />}
                        <Typography fontWeight={700}>{goal.name}</Typography>
                        <Chip label={goal.category} size="small" sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }} />
                        {goal.isFamilyGoal && <Chip label="Family" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} />}
                      </Box>
                      <Box>
                        <Button size="small" onClick={() => { setSelectedGoal(goal); setContributeAmount(''); setContributeDialog(true); }} sx={{ mr: 0.5, color: '#10b981', fontWeight: 600 }}>+ Add</Button>
                        <IconButton size="small" onClick={() => openEdit(goal)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => { setSelectedGoal(goal); setDeleteDialog(true); }} color="error"><Delete fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">{formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: goal.isComplete ? '#10b981' : '#8b5cf6' }}>{progress.toFixed(0)}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={Math.min(progress, 100)} sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(139, 92, 246, 0.1)', '& .MuiLinearProgress-bar': { background: goal.isComplete ? GRADIENT_EMERALD_TEAL : GRADIENT_PURPLE_EMERALD, borderRadius: 4 } }} />
                    </Box>
                    {days !== null && !goal.isComplete && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Timer sx={{ fontSize: 14, color: days <= 7 ? '#ef4444' : 'text.secondary' }} />
                        <Typography variant="caption" sx={{ color: days <= 7 ? '#ef4444' : 'text.secondary' }}>{days > 0 ? `${days} days left` : 'Overdue!'}</Typography>
                      </Box>
                    )}
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Container>

      <BottomBar />

      {/* Add Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, background: cardBg.emeraldTeal(theme.palette.mode), backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.98)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)' } }}>
        <DialogTitle sx={{ fontWeight: 700, ...gradientText(GRADIENT_PURPLE_EMERALD) }}>New Savings Goal</DialogTitle>
        <DialogContent>{renderForm()}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" sx={{ background: GRADIENT_PURPLE_EMERALD, '&:hover': { background: GRADIENT_PURPLE_EMERALD_HOVER } }}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, background: cardBg.emeraldTeal(theme.palette.mode), backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.98)' : 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)' } }}>
        <DialogTitle sx={{ fontWeight: 700, ...gradientText(GRADIENT_PURPLE_EMERALD) }}>Edit Goal</DialogTitle>
        <DialogContent>{renderForm()}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEdit} variant="contained" sx={{ background: GRADIENT_PURPLE_EMERALD, '&:hover': { background: GRADIENT_PURPLE_EMERALD_HOVER } }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={contributeDialog} onClose={() => setContributeDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add to "{selectedGoal?.name}"</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current: {formatCurrency(selectedGoal?.currentAmount || 0)} / {formatCurrency(selectedGoal?.targetAmount || 0)}
          </Typography>
          <TextField fullWidth label="Amount" type="number" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} inputProps={{ step: '0.01', min: '0.01' }} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContributeDialog(false)}>Cancel</Button>
          <Button onClick={handleContribute} variant="contained" sx={{ background: GRADIENT_EMERALD_TEAL, '&:hover': { background: GRADIENT_EMERALD_TEAL_HOVER } }}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Goal</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete "{selectedGoal?.name}"?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ManageSavings;
