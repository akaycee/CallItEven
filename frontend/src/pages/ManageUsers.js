import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Switch,
  FormControlLabel,
  useTheme,
  Paper,
  CircularProgress,
} from '@mui/material';
import { 
  Delete, 
  Edit, 
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import NavBar from '../components/NavBar';
import BottomBar from '../components/BottomBar';
import { GRADIENT_PURPLE_PINK, GRADIENT_PURPLE_PINK_HOVER, cardBg, gradientText } from '../utils/themeConstants';

function ManageUsers() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalExpenses: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const { error, setError, success, setSuccess, showSuccess } = useNotification();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', isAdmin: false });

  // Cleanup on unmount handled by useNotification
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [usersRes, statsRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/stats')
      ]);
      setUsers(usersRes.data || []);
      setStats(statsRes.data || { totalUsers: 0, totalExpenses: 0, totalAmount: 0 });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (userItem) => {
    setUserToDelete(userItem);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await axios.delete(`/api/admin/users/${userToDelete._id}`);
      showSuccess(`User "${userToDelete.name}" deleted successfully`);
      setDeleteDialog(false);
      setUserToDelete(null);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete user');
      setDeleteDialog(false);
    }
  };

  const handleEditClick = (userItem) => {
    setUserToEdit(userItem);
    setEditForm({
      name: userItem.name,
      email: userItem.email,
      isAdmin: userItem.isAdmin || false
    });
    setEditDialog(true);
  };

  const handleEditSubmit = async () => {
    try {
      setError('');
      if (!editForm.name.trim() || !editForm.email.trim()) {
        setError('Name and email are required');
        return;
      }
      await axios.put(`/api/admin/users/${userToEdit._id}`, editForm);
      showSuccess(`User "${editForm.name}" updated successfully`);
      setEditDialog(false);
      setUserToEdit(null);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar title="Manage Users" />

      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: 10, px: { xs: 1.5, sm: 3 } }}>
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

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
          <Card
            sx={{
              background: cardBg.purplePink(theme.palette.mode),
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography variant="h4" fontWeight="700" color="primary">
                {stats.totalUsers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              background: cardBg.tealEmerald(theme.palette.mode),
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography variant="h4" fontWeight="700" sx={{ color: '#06b6d4' }}>
                {stats.totalExpenses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Expenses
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Typography variant="h4" fontWeight="700" sx={{ color: '#f59e0b' }}>
                ${stats.totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Amount
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Users Table */}
        <Card
          sx={{
            background: cardBg.purplePink(theme.palette.mode),
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(139, 92, 246, 0.15)' 
              : '0 8px 32px rgba(139, 92, 246, 0.2)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3,
                fontWeight: 800,
                ...gradientText(GRADIENT_PURPLE_PINK),
              }}
            >
              All Users
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No users found.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ 
                background: 'transparent',
                boxShadow: 'none',
              }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((userItem) => (
                      <TableRow 
                        key={userItem._id}
                        sx={{
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark'
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'rgba(0, 0, 0, 0.02)',
                          },
                        }}
                      >
                        <TableCell>{userItem.name}</TableCell>
                        <TableCell>{userItem.email}</TableCell>
                        <TableCell>
                          {userItem.isAdmin ? (
                            <Chip 
                              label="Admin" 
                              size="small" 
                              sx={{
                                background: GRADIENT_PURPLE_PINK,
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          ) : (
                            <Chip 
                              label="User" 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(userItem.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            aria-label={`Edit user ${userItem.name}`}
                            onClick={() => handleEditClick(userItem)}
                            sx={{
                              color: '#06b6d4',
                              mr: 1,
                              '&:hover': {
                                bgcolor: 'rgba(6, 182, 212, 0.1)',
                              },
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label={`Delete user ${userItem.name}`}
                            onClick={() => handleDeleteClick(userItem)}
                            disabled={userItem._id === user._id}
                            sx={{
                              color: userItem._id === user._id ? 'text.disabled' : '#ef4444',
                              '&:hover': {
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                              },
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
        <DialogTitle sx={{ 
          fontWeight: 700,
          color: '#ef4444',
        }}>
          Delete User
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{userToDelete?.name}"?
            This will also delete all their expenses. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog(false)}>
            Cancel
          </Button>
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

      {/* Edit User Dialog */}
      <Dialog
        open={editDialog}
        onClose={() => {
          setEditDialog(false);
          setUserToEdit(null);
          setError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 700,
          ...gradientText(GRADIENT_PURPLE_PINK),
        }}>
          Edit User
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editForm.isAdmin}
                onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.checked })}
                color="primary"
              />
            }
            label="Admin Privileges"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => {
            setEditDialog(false);
            setUserToEdit(null);
            setError('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            sx={{
              background: GRADIENT_PURPLE_PINK,
              color: 'white',
              '&:hover': {
                background: GRADIENT_PURPLE_PINK_HOVER,
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <BottomBar />
    </Box>
  );
}

export default ManageUsers;

