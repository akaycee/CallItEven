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
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
  Chip,
  Alert,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { ArrowBack, Person, Delete, Add, Brightness4, Brightness7 } from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ColorModeContext } from '../index';

function CreateExpense() {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    paidBy: user._id,
    splitType: 'equal',
    category: '',
  });
  const [participants, setParticipants] = useState([{ user: user, amount: '', percentage: '' }]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchGroups();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('/api/categories');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const { data } = await axios.get('/api/groups');
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const validateCategory = async (categoryName) => {
    // If category is in the existing list, it's valid
    if (!categoryName || categories.includes(categoryName)) {
      setCategoryError('');
      return true;
    }

    // If it's a new category, check if user can create it
    try {
      await axios.post('/api/categories', { name: categoryName });
      setCategoryError('');
      // Refresh categories list
      fetchCategories();
      return true;
    } catch (error) {
      if (error.response?.data?.message === 'Invalid category') {
        setCategoryError('Invalid category. Please select from the list.');
        return false;
      }
      setCategoryError('');
      return true;
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
      
      // Check if email looks valid but no results found
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email) && filtered.length === 0 && data.length === 0) {
        setInviteEmail(email);
        setInviteDialog(true);
      }
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

    if (categoryError) {
      setError('Please select a valid category from the list');
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

    setLoading(true);

    try {
      const splits = calculateSplits();
      await axios.post('/api/expenses', {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        splits,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

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

              <Autocomplete
                freeSolo
                options={categories}
                value={formData.category}
                onChange={(e, value) => {
                  setFormData({ ...formData, category: value || '' });
                  if (value) {
                    validateCategory(value);
                  } else {
                    setCategoryError('');
                  }
                }}
                onInputChange={async (e, value) => {
                  setFormData({ ...formData, category: value });
                  if (value && value.trim()) {
                    validateCategory(value);
                  } else {
                    setCategoryError('');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    margin="normal"
                    placeholder="Select or type a category"
                    helperText={categoryError}
                    error={!!categoryError}
                  />
                )}
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

                {/* Group Selection */}
                {groups.length > 0 && (
                  <Autocomplete
                    options={groups}
                    getOptionLabel={(option) => `${option.name} (${option.members.length} members)`}
                    value={selectedGroup}
                    onChange={(e, value) => {
                      setSelectedGroup(value);
                      if (value) {
                        // Auto-populate participants from group
                        const groupParticipants = value.members.map(member => ({
                          user: member,
                          amount: '',
                          percentage: ''
                        }));
                        setParticipants(groupParticipants);
                      } else {
                        // Reset to just current user
                        setParticipants([{ user: user, amount: '', percentage: '' }]);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Use a group (optional)"
                        margin="normal"
                        helperText="Select a group to auto-add all members"
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body1" fontWeight="600">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.members.map(m => m.name).join(', ')}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    sx={{ mb: 2 }}
                  />
                )}

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
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #14b8a6 100%)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #0f766e 100%)',
                    },
                  }}
                >
                  {loading ? 'Creating...' : 'Create Expense'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>

      {/* Invite Dialog */}
      <Dialog
        open={inviteDialog}
        onClose={() => setInviteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle sx={{
          fontWeight: 700,
          background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          User Not Found 🤔
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{inviteEmail}</strong> hasn't joined Call It Even yet!
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Want to split expenses together? Send them this link and get the party started! 🎉
          </Typography>
          <TextField
            fullWidth
            value={window.location.origin}
            InputProps={{
              readOnly: true,
            }}
            onClick={(e) => {
              e.target.select();
              navigator.clipboard.writeText(window.location.origin);
            }}
            helperText="Click to copy the link"
            sx={{ mb: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button 
            onClick={() => {
              const subject = encodeURIComponent('Join me on Call It Even! 🎉');
              const body = encodeURIComponent(
                `Hey!\n\nI've been using Call It Even to track shared expenses, and I'd love to split expenses with you!\n\nIt's super easy - just sign up at:\n${window.location.origin}\n\nLooking forward to settling up together! 💰`
              );
              window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
            }}
            variant="outlined"
            sx={{
              borderColor: '#06b6d4',
              color: '#06b6d4',
              '&:hover': {
                borderColor: '#0891b2',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
              },
            }}
          >
            Send Email
          </Button>
          <Button 
            onClick={() => setInviteDialog(false)}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #0891b2 0%, #059669 100%)',
              },
            }}
          >
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CreateExpense;
