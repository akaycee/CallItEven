import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Avatar,
  AvatarGroup,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Delete,
  Add,
  Group as GroupIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import NavBar from '../components/NavBar';
import BottomBar from '../components/BottomBar';

function ManageGroups() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useContext(AuthContext);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [groupToEdit, setGroupToEdit] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '', memberEmails: [] });
  const [searchEmail, setSearchEmail] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmails, setInviteEmails] = useState([]);
  const debounceRef = useRef(null);
  const timeoutRefs = useRef([]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchGroups();
  }, [user, navigate]);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await axios.get('/api/groups');
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError(error.response?.data?.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchUsers = useCallback(async (email) => {
    if (!email || email.length < 2) {
      setUsers([]);
      return;
    }
    
    // Debounce search requests
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const { data } = await axios.get(`/api/users/search?email=${email}`);
        setUsers(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  const handleDeleteClick = useCallback((group) => {
    setGroupToDelete(group);
    setDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await axios.delete(`/api/groups/${groupToDelete._id}`);
      setSuccess(`Group "${groupToDelete.name}" deleted successfully`);
      setDeleteDialog(false);
      setGroupToDelete(null);
      fetchGroups();
      timeoutRefs.current.push(setTimeout(() => setSuccess(''), 3000));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete group');
      setDeleteDialog(false);
    }
  };

  const handleEditClick = useCallback((group) => {
    setGroupToEdit(group);
    setGroupForm({
      name: group.name,
      memberEmails: group.members.map(m => m.email).filter(e => e !== user.email)
    });
    setEditDialog(true);
  }, [user]);

  const handleEditSubmit = async () => {
    try {
      setError('');
      if (!groupForm.name.trim()) {
        setError('Group name is required');
        return;
      }
      if (groupForm.memberEmails.length < 1) {
        setError('At least one other member is required');
        return;
      }
      const { data } = await axios.put(`/api/groups/${groupToEdit._id}`, groupForm);
      
      if (data.notFoundEmails && data.notFoundEmails.length > 0) {
        setInviteEmails(data.notFoundEmails);
        setInviteDialog(true);
      }
      
      setSuccess(`Group "${groupForm.name}" updated successfully`);
      setEditDialog(false);
      setGroupToEdit(null);
      setGroupForm({ name: '', memberEmails: [] });
      fetchGroups();
      timeoutRefs.current.push(setTimeout(() => setSuccess(''), 3000));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update group');
    }
  };

  const handleAddGroup = async () => {
    try {
      setError('');
      if (!groupForm.name.trim()) {
        setError('Group name is required');
        return;
      }
      if (groupForm.memberEmails.length < 1) {
        setError('At least one other member is required');
        return;
      }
      const { data } = await axios.post('/api/groups', groupForm);
      
      if (data.notFoundEmails && data.notFoundEmails.length > 0) {
        setInviteEmails(data.notFoundEmails);
        setInviteDialog(true);
      }
      
      setSuccess(`Group "${groupForm.name}" added successfully`);
      setAddDialog(false);
      setGroupForm({ name: '', memberEmails: [] });
      fetchGroups();
      timeoutRefs.current.push(setTimeout(() => setSuccess(''), 3000));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add group');
    }
  };

  // Add aria-label to delete buttons
  const groupsList = useMemo(() => (
    groups.map((group) => (
      <ListItem
        key={group._id}
        onClick={() => group.createdBy._id === user._id && handleEditClick(group)}
        sx={{
          mb: 1,
          borderRadius: 2,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          transition: 'all 0.2s',
          cursor: group.createdBy._id === user._id ? 'pointer' : 'default',
          '&:hover': {
            background: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.02)',
          },
        }}
        secondaryAction={
          <Box>
            {group.createdBy._id === user._id && (
              <IconButton
                edge="end"
                aria-label={`Delete group ${group.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(group);
                }}
                sx={{
                  color: '#ef4444',
                  '&:hover': {
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                  },
                }}
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        }
      >
        <GroupIcon sx={{ mr: 2, color: 'primary.main' }} />
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" fontWeight="600">
                {group.name}
              </Typography>
              <Chip
                label={`${group.members.length} members`}
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            </Box>
          }
          secondary={
            <Box sx={{ mt: 1 }}>
              <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                {group.members.map((member) => (
                  <Avatar
                    key={member._id}
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: '0.75rem',
                      bgcolor: 'primary.main',
                    }}
                    title={member.name}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </Avatar>
                ))}
              </AvatarGroup>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {group.members.map(m => m.name).join(', ')}
              </Typography>
            </Box>
          }
        />
      </ListItem>
    ))
  ), [groups, user, theme, handleEditClick, handleDeleteClick]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar title="Manage Groups" showBack backPath="/dashboard" />

      <Container maxWidth="md" sx={{ mt: 4, mb: 10 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(139, 92, 246, 0.15)'
              : '0 8px 32px rgba(139, 92, 246, 0.2)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                My Groups
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setGroupForm({ name: '', memberEmails: [] });
                  setAddDialog(true);
                }}
                sx={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                  },
                }}
              >
                Create Group
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : groups.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <GroupIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography color="text.secondary">
                  No groups yet. Create your first group to get started!
                </Typography>
              </Box>
            ) : (
              <List>{groupsList}</List>
            )}
          </CardContent>
        </Card>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#ef4444' }}>
          Delete Group
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the group "{groupToDelete?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              '&:hover': {
                bgcolor: '#dc2626',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Group Dialog */}
      <Dialog
        open={addDialog || editDialog}
        onClose={() => {
          setAddDialog(false);
          setEditDialog(false);
          setGroupToEdit(null);
          setGroupForm({ name: '', memberEmails: [] });
          setError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {editDialog ? 'Edit Group' : 'Create New Group'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            fullWidth
            label="Group Name"
            value={groupForm.name}
            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
            margin="normal"
          />
          <Autocomplete
            multiple
            freeSolo
            options={users.map(u => u.email)}
            value={groupForm.memberEmails}
            onChange={(e, newValue) => setGroupForm({ ...groupForm, memberEmails: newValue })}
            onInputChange={(e, newInputValue) => {
              setSearchEmail(newInputValue);
              searchUsers(newInputValue);
            }}
            loading={searchLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Member Emails"
                placeholder="Type email to search..."
                margin="normal"
                helperText="Add at least one other member. You will be automatically included."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setAddDialog(false);
              setEditDialog(false);
              setGroupToEdit(null);
              setGroupForm({ name: '', memberEmails: [] });
              setError('');
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={editDialog ? handleEditSubmit : handleAddGroup}
            variant="contained"
            disabled={!groupForm.name.trim() || groupForm.memberEmails.length < 1}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
              },
            }}
          >
            {editDialog ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

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
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle sx={{
          fontWeight: 700,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {inviteEmails.length === 1 ? 'User Not Found 🤔' : 'Users Not Found 🤔'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{inviteEmails.join(', ')}</strong> {inviteEmails.length === 1 ? "hasn't" : "haven't"} joined Call It Even yet!
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Want to add them to your group? Send them this link - they'll be automatically added when they sign up! 🎉
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
                `Hey!\n\nI've been using Call It Even to track shared expenses, and I'd love to add you to my group!\n\nIt's super easy - just sign up at:\n${window.location.origin}\n\nLooking forward to settling up together! 💰`
              );
              window.location.href = `mailto:${inviteEmails.join(',')}?subject=${subject}&body=${body}`;
            }}
            variant="outlined"
            sx={{
              borderColor: '#8b5cf6',
              color: '#8b5cf6',
              '&:hover': {
                borderColor: '#7c3aed',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
              },
            }}
          >
            Send Email
          </Button>
          <Button 
            onClick={() => setInviteDialog(false)}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
              },
            }}
          >
            Got It
          </Button>
        </DialogActions>
      </Dialog>
      <BottomBar />
    </Box>
  );
}

export default ManageGroups;
