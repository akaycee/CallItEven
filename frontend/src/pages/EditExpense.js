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
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  Alert,
  InputAdornment,
  List,
  ListItem,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { ArrowBack, Delete, Brightness4, Brightness7 } from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ColorModeContext } from '../index';

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
  });
  const [participants, setParticipants] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExpense();
  }, [id]);

  const fetchExpense = async () => {
    try {
      const { data } = await axios.get(`/api/expenses/${id}`);
      
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
      });

      setParticipants(
        data.splits.map((split) => ({
          user: split.user,
          amount: split.amount.toString(),
          percentage: split.percentage?.toString() || '',
        }))
      );

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load expense');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearchUsers = async (email) => {
    setSearchEmail(email);
    if (email.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await axios.get(`/api/users/search?email=${email}`);
      // Filter out users already in participants
      const participantIds = participants.map((p) => p.user._id);
      const filtered = data.filter((u) => !participantIds.includes(u._id));
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAddParticipant = (selectedUser) => {
    setParticipants([...participants, { user: selectedUser, amount: '', percentage: '' }]);
    setSearchEmail('');
    setSearchResults([]);
  };

  const handleRemoveParticipant = (index) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const handleParticipantChange = (index, field, value) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
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
      const splits = calculateSplits();
      await axios.put(`/api/expenses/${id}`, {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        splits,
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
          background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #14b8a6 100%)',
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
            Edit Expense
          </Typography>
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
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Card elevation={0}>
          <CardContent sx={{ p: 5 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                margin="normal"
                placeholder="e.g., Dinner at restaurant"
              />

              <TextField
                fullWidth
                label="Total Amount"
                name="totalAmount"
                type="number"
                value={formData.totalAmount}
                onChange={handleChange}
                required
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ step: '0.01', min: '0.01' }}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Paid By</InputLabel>
                <Select
                  name="paidBy"
                  value={formData.paidBy}
                  onChange={handleChange}
                  label="Paid By"
                >
                  {participants.map((p) => (
                    <MenuItem key={p.user._id} value={p.user._id}>
                      {p.user._id === user._id ? 'You' : p.user.name} ({p.user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Split Type</InputLabel>
                <Select
                  name="splitType"
                  value={formData.splitType}
                  onChange={handleChange}
                  label="Split Type"
                >
                  <MenuItem value="equal">Split Equally</MenuItem>
                  <MenuItem value="percentage">By Percentage</MenuItem>
                  <MenuItem value="unequal">Unequal Amounts</MenuItem>
                </Select>
              </FormControl>

              {/* Participants */}
              <Box sx={{ mt: 4, mb: 2 }}>
                <Typography variant="h6" gutterBottom fontWeight={700}>
                  Participants
                </Typography>

                {/* Search for users */}
                <Autocomplete
                  freeSolo
                  options={searchResults}
                  getOptionLabel={(option) => `${option.name} (${option.email})`}
                  inputValue={searchEmail}
                  onInputChange={(e, value) => handleSearchUsers(value)}
                  onChange={(e, value) => {
                    if (value) {
                      handleAddParticipant(value);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Add participant by email"
                      margin="normal"
                      placeholder="Search by email..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />

                {/* Participant List */}
                <List sx={{ mt: 2 }}>
                  {participants.map((participant, index) => (
                    <ListItem
                      key={index}
                      sx={{
                        bgcolor: 'background.paper',
                        mb: 1.5,
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: 'divider',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 12px rgba(6, 182, 212, 0.2)',
                        },
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5}>
                          <Box>
                            <Typography variant="body1" fontWeight="500">
                              {participant.user._id === user._id
                                ? 'You'
                                : participant.user.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {participant.user.email}
                            </Typography>
                          </Box>
                        </Grid>

                        {formData.splitType === 'percentage' && (
                          <Grid item xs={10} sm={5}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Percentage"
                              value={participant.percentage}
                              onChange={(e) =>
                                handleParticipantChange(index, 'percentage', e.target.value)
                              }
                              InputProps={{
                                endAdornment: <InputAdornment position="end">%</InputAdornment>,
                              }}
                              inputProps={{ step: '0.01', min: '0', max: '100' }}
                            />
                          </Grid>
                        )}

                        {formData.splitType === 'unequal' && (
                          <Grid item xs={10} sm={5}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Amount"
                              value={participant.amount}
                              onChange={(e) =>
                                handleParticipantChange(index, 'amount', e.target.value)
                              }
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                              inputProps={{ step: '0.01', min: '0' }}
                            />
                          </Grid>
                        )}

                        {formData.splitType === 'equal' && (
                          <Grid item xs={10} sm={5}>
                            <Typography variant="body2" color="text.secondary">
                              {formData.totalAmount
                                ? `$${(
                                    parseFloat(formData.totalAmount) / participants.length
                                  ).toFixed(2)}`
                                : '-'}
                            </Typography>
                          </Grid>
                        )}

                        <Grid item xs={2}>
                          {participants.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveParticipant(index)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          )}
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))}
                </List>
              </Box>

              {/* Submit Button */}
              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={submitting}
                  sx={{
                    background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #14b8a6 100%)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #0f766e 100%)',
                    },
                  }}
                >
                  {submitting ? 'Updating...' : 'Update Expense'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default EditExpense;
