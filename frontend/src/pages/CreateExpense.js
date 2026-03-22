import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Card,
  CardContent,
  IconButton,
  useTheme,
} from '@mui/material';
import { ArrowBack, Brightness4, Brightness7 } from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ColorModeContext } from '../index';
import ExpenseForm from '../components/ExpenseForm';
import BottomBar from '../components/BottomBar';
import { GRADIENT_CYAN_TRIPLE } from '../utils/themeConstants';

function CreateExpense({ onDone, isDialog = false }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { user } = useContext(AuthContext);
  const handleClose = () => onDone ? onDone() : navigate('/dashboard');
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    paidBy: user._id,
    splitType: 'equal',
    category: '',
    tag: '',
  });
  const [participants, setParticipants] = useState([{ user: user, amount: '', percentage: '' }]);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPersonal, setIsPersonal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      axios.get('/api/categories', { signal }),
      axios.get('/api/groups', { signal }),
    ]).then(([catRes, groupsRes]) => {
      setCategories(catRes.data);
      setGroups(groupsRes.data || []);
    }).catch(err => {
      if (!axios.isCancel(err)) console.error('Error loading form data:', err);
    });
    return () => controller.abort();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('/api/categories');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

    setLoading(true);

    try {
      const splits = isPersonal
        ? [{ user: user._id, amount: parseFloat(formData.totalAmount), percentage: 100 }]
        : calculateSplits();
      await axios.post('/api/expenses', {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        splits,
        isPersonal,
      });
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: isDialog ? 'auto' : '100vh', bgcolor: 'background.default' }}>
      {!isDialog && (
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
            onClick={handleClose}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              mr: 2,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
              },
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              fontSize: '1.4rem',
            }}
          >
          <IconButton 
            color="inherit" 
            onClick={colorMode.toggleColorMode}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.25)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s',
            }}
          >
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
            Create New Expense
          </Typography>
        </Toolbar>
      </AppBar>
      )}

      <Container maxWidth="md" sx={{ mt: isDialog ? 0 : 4, mb: isDialog ? 4 : 10 }}>
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
              onRefreshCategories={fetchCategories}
              groups={groups}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              onSubmit={handleSubmit}
              onCancel={handleClose}
              loading={loading}
              error={error}
              submitLabel="Create Expense"
              categoryError={categoryError}
              setCategoryError={setCategoryError}
              currentUser={user}
            />
          </CardContent>
        </Card>
      </Container>
      {!isDialog && <BottomBar />}
    </Box>
  );
}

export default CreateExpense;

