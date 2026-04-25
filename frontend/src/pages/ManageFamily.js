import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  useTheme,
  Chip,
} from '@mui/material';
import { Delete, PersonAdd, FamilyRestroom } from '@mui/icons-material';
import axios from 'axios';
import NavBar from '../components/NavBar';
import BottomBar from '../components/BottomBar';
import { AuthContext } from '../context/AuthContext';
import { GRADIENT_EMERALD_TEAL, GRADIENT_EMERALD_TEAL_HOVER, gradientText, cardBg } from '../utils/themeConstants';
import { getInitials } from '../utils/getInitials';

function ManageFamily() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, familyGroup, fetchFamilyGroup } = useContext(AuthContext);

  const [familyName, setFamilyName] = useState('');
  const [memberEmails, setMemberEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchTimerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    if (familyGroup) {
      setFamilyName(familyGroup.name);
    }
  }, [familyGroup]);

  const handleSearchUsers = useCallback((email) => {
    setEmailInput(email);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (email.length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(`/api/users/search?email=${email}`);
        const existingEmails = familyGroup?.members?.map(m => m.email) || memberEmails;
        const filtered = data.filter(u => !existingEmails.includes(u.email) && u.email !== user.email);
        setSearchResults(filtered);
      } catch {
        // ignore
      }
    }, 300);
  }, [familyGroup, memberEmails, user.email]);

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/family', {
        name: familyName,
        memberEmails
      });
      setSuccess('Family group created!');
      await fetchFamilyGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create family group');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFamily = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const emails = familyGroup.members
        .filter(m => m._id !== user._id)
        .map(m => m.email);
      await axios.put(`/api/family/${familyGroup._id}`, {
        name: familyName,
        memberEmails: emails
      });
      setSuccess('Family updated!');
      await fetchFamilyGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update family');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (memberEmail) => {
    if (!familyGroup) {
      setMemberEmails(prev => [...prev, memberEmail]);
      setEmailInput('');
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const currentEmails = familyGroup.members
        .filter(m => m._id !== user._id)
        .map(m => m.email);
      currentEmails.push(memberEmail);
      await axios.put(`/api/family/${familyGroup._id}`, {
        memberEmails: currentEmails
      });
      setSuccess('Member added!');
      await fetchFamilyGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!familyGroup) return;
    setLoading(true);
    setError('');
    try {
      const remainingEmails = familyGroup.members
        .filter(m => m._id !== memberId && m._id !== user._id)
        .map(m => m.email);
      await axios.put(`/api/family/${familyGroup._id}`, {
        memberEmails: remainingEmails
      });
      setSuccess('Member removed');
      await fetchFamilyGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFamily = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.delete(`/api/family/${familyGroup._id}`);
      setDeleteDialog(false);
      setSuccess('Family group deleted');
      setFamilyName('');
      setMemberEmails([]);
      await fetchFamilyGroup();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete family');
    } finally {
      setLoading(false);
    }
  };

  const isCreator = familyGroup?.createdBy?._id === user?._id || familyGroup?.createdBy === user?._id;

  return (
    <Box sx={{ minHeight: '100vh', pb: 10, bgcolor: 'background.default' }}>
      <NavBar title="Family Group" showBack backPath="/dashboard" />

      <Container maxWidth="sm" sx={{ mt: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {!familyGroup ? (
          /* ── Create Family ── */
          <Card sx={{
            borderRadius: 4,
            background: cardBg.emeraldTeal(theme.palette.mode),
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: theme.palette.divider,
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <FamilyRestroom sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, ...gradientText(GRADIENT_EMERALD_TEAL) }}>
                  Create Your Family
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Track household finances together
                </Typography>
              </Box>

              <form onSubmit={handleCreateFamily}>
                <TextField
                  fullWidth
                  label="Family Name"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  required
                  margin="normal"
                  placeholder="e.g., The Smiths"
                />

                <Autocomplete
                  freeSolo
                  options={searchResults}
                  getOptionLabel={(option) => typeof option === 'string' ? option : `${option.name} (${option.email})`}
                  inputValue={emailInput}
                  onInputChange={(e, value) => handleSearchUsers(value)}
                  onChange={(e, value) => {
                    if (value && typeof value !== 'string') {
                      handleAddMember(value.email);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Add members by email"
                      margin="normal"
                      placeholder="Search by email..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                      </Box>
                    </li>
                  )}
                />

                {memberEmails.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {memberEmails.map((email) => (
                      <Chip
                        key={email}
                        label={email}
                        onDelete={() => setMemberEmails(prev => prev.filter(e => e !== email))}
                        size="small"
                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)' }}
                      />
                    ))}
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading || !familyName || memberEmails.length < 1}
                  sx={{
                    mt: 3,
                    background: GRADIENT_EMERALD_TEAL,
                    fontWeight: 700,
                    '&:hover': { background: GRADIENT_EMERALD_TEAL_HOVER },
                  }}
                >
                  {loading ? 'Creating...' : 'Create Family Group'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* ── Existing Family ── */
          <Card sx={{
            borderRadius: 4,
            background: cardBg.emeraldTeal(theme.palette.mode),
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: theme.palette.divider,
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <FamilyRestroom sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
                {isCreator ? (
                  <TextField
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    onBlur={handleUpdateFamily}
                    variant="standard"
                    inputProps={{ style: { textAlign: 'center', fontWeight: 800, fontSize: '1.5rem' } }}
                    sx={{ mb: 1 }}
                  />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 800, ...gradientText(GRADIENT_EMERALD_TEAL) }}>
                    {familyGroup.name}
                  </Typography>
                )}
              </Box>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Members ({familyGroup.members.length})
              </Typography>

              <List>
                {familyGroup.members.map((member) => (
                  <ListItem
                    key={member._id}
                    secondaryAction={
                      isCreator && member._id !== user._id && (
                        <IconButton edge="end" onClick={() => handleRemoveMember(member._id)} color="error" size="small">
                          <Delete />
                        </IconButton>
                      )
                    }
                    sx={{
                      bgcolor: 'background.paper',
                      mb: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                        {getInitials(member.name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member._id === user._id ? `${member.name} (You)` : member.name}
                      secondary={member.email}
                    />
                  </ListItem>
                ))}
              </List>

              {isCreator && (
                <>
                  <Autocomplete
                    freeSolo
                    options={searchResults}
                    getOptionLabel={(option) => typeof option === 'string' ? option : `${option.name} (${option.email})`}
                    inputValue={emailInput}
                    onInputChange={(e, value) => handleSearchUsers(value)}
                    onChange={(e, value) => {
                      if (value && typeof value !== 'string') {
                        handleAddMember(value.email);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Add member"
                        margin="normal"
                        placeholder="Search by email..."
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <PersonAdd sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body2">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{option.email}</Typography>
                        </Box>
                      </li>
                    )}
                  />

                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={() => setDeleteDialog(true)}
                    sx={{ mt: 3 }}
                  >
                    Delete Family Group
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </Container>

      <BottomBar />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Family Group?</DialogTitle>
        <DialogContent>
          <Typography>
            This will remove all family connections. Individual expenses, income, and budgets will remain.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteFamily} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ManageFamily;
