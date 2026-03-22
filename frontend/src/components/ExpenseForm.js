import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
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
  Typography,
  Switch,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import axios from 'axios';
import { GRADIENT_TEAL_EMERALD, gradientText } from '../utils/themeConstants';

/**
 * Shared form for creating and editing expenses.
 *
 * Props:
 *  formData / setFormData        — controlled form state
 *  participants / setParticipants — controlled participants array
 *  isPersonal / setIsPersonal    — personal expense toggle
 *  categories                    — list of category strings
 *  onRefreshCategories           — called after a new category is created
 *  groups                        — (optional) list of group objects for group selector
 *  selectedGroup / setSelectedGroup — (optional) controlled selected group
 *  onSubmit                      — form submit handler (e)
 *  onCancel                      — cancel / back handler
 *  loading                       — disables submit button while true
 *  error                         — top-level form error string
 *  submitLabel                   — text for the submit button
 *  categoryError / setCategoryError — lifted to parent so validateForm can inspect
 *  currentUser                   — logged-in user object
 */
function ExpenseForm({
  formData,
  setFormData,
  participants,
  setParticipants,
  isPersonal,
  setIsPersonal,
  categories,
  onRefreshCategories,
  groups,
  selectedGroup,
  setSelectedGroup,
  onSubmit,
  onCancel,
  loading,
  error,
  submitLabel = 'Save',
  categoryError,
  setCategoryError,
  currentUser,
}) {
  const theme = useTheme();
  const searchTimerRef = useRef(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // ── form field change ──────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── category validation (only fires on explicit selection / blur) ──────────
  const validateCategory = async (categoryName) => {
    if (!categoryName || categories.includes(categoryName)) {
      setCategoryError('');
      return;
    }
    try {
      await axios.post('/api/categories', { name: categoryName });
      setCategoryError('');
      if (onRefreshCategories) onRefreshCategories();
    } catch (err) {
      if (err.response?.data?.message === 'Invalid category') {
        setCategoryError('Invalid category. Please select from the list.');
      } else {
        setCategoryError('');
      }
    }
  };

  // ── debounced user search ──────────────────────────────────────────────────
  const handleSearchUsers = (email) => {
    setSearchEmail(email);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (email.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`/api/users/search?email=${email}`);
        const participantIds = participants.map((p) => p.user._id);
        const filtered = data.filter((u) => !participantIds.includes(u._id));
        setSearchResults(filtered);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email) && filtered.length === 0 && data.length === 0) {
          setInviteEmail(email);
          setInviteDialog(true);
        }
      } catch (err) {
        console.error('Error searching users:', err);
      }
    }, 300);
  };

  // ── participant management ─────────────────────────────────────────────────
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

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={onSubmit}>
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
            if (value) validateCategory(value);
            else setCategoryError('');
          }}
          onInputChange={(e, value) => {
            setFormData({ ...formData, category: value });
            if (!value || !value.trim()) setCategoryError('');
            // validateCategory is only called on explicit selection (onChange), not every keystroke
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

        <TextField
          fullWidth
          label="Tag"
          name="tag"
          value={formData.tag}
          onChange={handleChange}
          margin="normal"
          placeholder="Optional tag for filtering (e.g., vacation, project-x)"
        />

        <FormControlLabel
          control={
            <Switch
              checked={isPersonal}
              onChange={(e) => {
                setIsPersonal(e.target.checked);
                if (e.target.checked) {
                  setParticipants([{ user: currentUser, amount: '', percentage: '' }]);
                  if (setSelectedGroup) setSelectedGroup(null);
                }
              }}
              color="primary"
            />
          }
          label="Personal Expense (not split with anyone)"
          sx={{ mt: 2, mb: 1 }}
        />

        {!isPersonal && (
          <>
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
                    {p.user._id === currentUser._id ? 'You' : p.user.name} ({p.user.email})
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

              {/* Group Selection (only shown when groups are provided) */}
              {groups && groups.length > 0 && (
                <Autocomplete
                  options={groups}
                  getOptionLabel={(option) =>
                    `${option.name} (${option.members.length} members)`
                  }
                  value={selectedGroup}
                  onChange={(e, value) => {
                    if (setSelectedGroup) setSelectedGroup(value);
                    if (value) {
                      setParticipants(
                        value.members.map((member) => ({
                          user: member,
                          amount: '',
                          percentage: '',
                        }))
                      );
                    } else {
                      setParticipants([{ user: currentUser, amount: '', percentage: '' }]);
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
                        <Typography variant="body1" fontWeight="600">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.members.map((m) => m.name).join(', ')}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  sx={{ mb: 2 }}
                />
              )}

              {/* User Search */}
              <Autocomplete
                freeSolo
                options={searchResults}
                getOptionLabel={(option) => `${option.name} (${option.email})`}
                inputValue={searchEmail}
                onInputChange={(e, value) => handleSearchUsers(value)}
                onChange={(e, value) => {
                  if (value) handleAddParticipant(value);
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
                            {participant.user._id === currentUser._id
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
                              endAdornment: (
                                <InputAdornment position="end">%</InputAdornment>
                              ),
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
                              startAdornment: (
                                <InputAdornment position="start">$</InputAdornment>
                              ),
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
          </>
        )}

        {/* Submit / Cancel */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={onCancel}
            sx={{ borderWidth: 2, '&:hover': { borderWidth: 2 } }}
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
                background:
                  'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #0f766e 100%)',
              },
            }}
          >
            {loading ? `${submitLabel.replace(/^(Create|Update)/, 'Saving')}...` : submitLabel}
          </Button>
        </Box>
      </form>

      {/* Invite Dialog (shown when searched email isn't registered) */}
      <Dialog
        open={inviteDialog}
        onClose={() => setInviteDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
            backgroundColor:
              theme.palette.mode === 'dark'
                ? 'rgba(30, 30, 30, 0.98)'
                : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            ...gradientText(GRADIENT_TEAL_EMERALD),
          }}
        >
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
            InputProps={{ readOnly: true }}
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
    </>
  );
}

export default ExpenseForm;
