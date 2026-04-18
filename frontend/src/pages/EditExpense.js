import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  useTheme,
} from '@mui/material';
import { ArrowBack, Brightness4, Brightness7 } from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ColorModeContext } from '../index';
import ExpenseForm from '../components/ExpenseForm';
import BottomBar from '../components/BottomBar';
import { GRADIENT_CYAN_TRIPLE } from '../utils/themeConstants';

function EditExpense() {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    paidBy: '',
    splitType: 'equal',
    category: '',
    tag: '',
    date: '',
  });
  const [participants, setParticipants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPersonal, setIsPersonal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    fetchExpense(signal);
    axios.get('/api/categories', { signal })
      .then(({ data }) => setCategories(data))
      .catch(err => { if (!axios.isCancel(err)) console.error('Error fetching categories:', err); });
    return () => controller.abort();
  }, [id]);

  const fetchExpense = async (signal) => {
    try {
      const { data } = await axios.get(`/api/expenses/${id}`, { signal });
      
      // Check if user is the creator
      if (data.createdBy._id !== user._id) {
        setError('You are not authorized to edit this expense');
        setLoading(false);
        return;
      }

      setFormData({
        description: data.description,
        totalAmount: data.totalAmount.toString(),
        paidBy: data.paidBy._id,
        splitType: data.splitType,
        category: data.category || '',
        tag: data.tag || '',
        date: data.date ? new Date(data.date).toISOString().split('T')[0] : (data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : ''),
      });

      setIsPersonal(!!data.isPersonal);

      setParticipants(
        data.splits.map((split) => ({
          user: split.user,
          amount: split.amount.toString(),
          percentage: split.percentage?.toString() || '',
        }))
      );

      setLoading(false);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError(err.response?.data?.message || 'Failed to load expense');
      setLoading(false);
    }
  };

  const calculateSplits = () => {
    const totalAmount = parseFloat(formData.totalAmount);
    
    if (formData.splitType === 'equal') {
      const amountPerPerson = totalAmount / participants.length;
      return participants.map((p) => ({
        user: p.user._id,
        amount: parseFloat(amountPerPerson.toFixed(2)),
        percentage: parseFloat((100 / participants.length).toFixed(2)),
      }));
    } else if (formData.splitType === 'percentage') {
      return participants.map((p) => ({
        user: p.user._id,
        amount: parseFloat((totalAmount * parseFloat(p.percentage || 0) / 100).toFixed(2)),
        percentage: parseFloat(p.percentage || 0),
      }));
    } else if (formData.splitType === 'unequal') {
      return participants.map((p) => ({
        user: p.user._id,
        amount: parseFloat(p.amount || 0),
        percentage: parseFloat((parseFloat(p.amount || 0) / totalAmount * 100).toFixed(2)),
      }));
    }
  };

  const validateForm = () => {
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return false;
    }

    const totalAmount = parseFloat(formData.totalAmount);
    if (!totalAmount || totalAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return false;
    }

    if (categoryError) {
      setError('Please select a valid category from the list');
      return false;
    }

    // Skip participant/split validation for personal expenses
    if (isPersonal) {
      return true;
    }

    if (participants.length < 1) {
      setError('Please add at least one participant');
      return false;
    }

    if (formData.splitType === 'percentage') {
      const totalPercentage = participants.reduce(
        (sum, p) => sum + parseFloat(p.percentage || 0),
        0
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        setError('Percentages must add up to 100%');
        return false;
      }
    }

    if (formData.splitType === 'unequal') {
      const totalSplit = participants.reduce(
        (sum, p) => sum + parseFloat(p.amount || 0),
        0
      );
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        setError('Split amounts must add up to total amount');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // If category is new and not empty, add it to the backend
      if (formData.category && !categories.includes(formData.category)) {
        await axios.post('/api/categories', { name: formData.category });
      }

      const splits = isPersonal
        ? [{ user: user._id, amount: parseFloat(formData.totalAmount), percentage: 100 }]
        : calculateSplits();
      await axios.put(`/api/expenses/${id}`, {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        splits,
        isPersonal,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update expense');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !formData.description) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: GRADIENT_CYAN_TRIPLE,
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              mr: 2,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '-0.02em', fontSize: '1.4rem' }}
          >
            Edit Expense
          </Typography>
          <IconButton
            color="inherit"
            onClick={colorMode.toggleColorMode}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)', transform: 'scale(1.05)' },
              transition: 'all 0.2s',
            }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
        <Card elevation={0}>
          <CardContent sx={{ p: 5 }}>
            <ExpenseForm
              formData={formData}
              setFormData={setFormData}
              participants={participants}
              setParticipants={setParticipants}
              isPersonal={isPersonal}
              setIsPersonal={setIsPersonal}
              categories={categories}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/dashboard')}
              loading={submitting}
              error={error}
              submitLabel="Update Expense"
              categoryError={categoryError}
              setCategoryError={setCategoryError}
              currentUser={user}
            />
          </CardContent>
        </Card>
      </Container>
      <BottomBar />
    </Box>
  );
}

export default EditExpense;

