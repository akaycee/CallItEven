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
  Chip,
  useTheme,
  IconButton,
} from '@mui/material';
import { 
  Delete, 
  Add, 
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import NavBar from '../components/NavBar';
import BottomBar from '../components/BottomBar';

function ManageCategories() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { error, setError, success, setSuccess, showSuccess } = useNotification();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Auth + fetch on mount
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/categories?detailed=true');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setError('');
      await axios.delete(`/api/categories/${encodeURIComponent(categoryToDelete.name)}`);
      showSuccess(`Category "${categoryToDelete.name}" deleted successfully`);
      setDeleteDialog(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete category');
      setDeleteDialog(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      setError('');
      if (!newCategoryName.trim()) {
        setError('Category name is required');
        return;
      }
      await axios.post('/api/categories', { name: newCategoryName.trim() });
      showSuccess(`Category "${newCategoryName}" added successfully`);
      setAddDialog(false);
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add category');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <NavBar title="Manage Categories" />

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
                All Categories
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDialog(true)}
                sx={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
                  },
                }}
              >
                Add Category
              </Button>
            </Box>

            {loading ? (
              <Typography>Loading...</Typography>
            ) : categories.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No categories found. This might be an error - there should be at least 10 default categories.
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Total Categories: {categories.length}
                </Typography>
                <List>
                  {categories.map((category) => (
                  <ListItem
                    key={category.name}
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteClick(category)}
                        sx={{
                          color: '#ef4444',
                          '&:hover': {
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                          },
                        }}
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="600">
                            {category.name}
                          </Typography>
                          {category.isDefault && (
                            <Chip 
                              label="Default" 
                              size="small" 
                              sx={{
                                background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)',
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        !category.isDefault && category.createdBy && (
                          <Typography variant="caption" color="text.secondary">
                            Created by {category.createdBy.name} on {new Date(category.createdAt).toLocaleDateString()}
                          </Typography>
                        )
                      }
                    />
                  </ListItem>
                ))}
                </List>
              </>
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
          Delete Category
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the category "{categoryToDelete?.name}"?
            This action cannot be undone.
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

      {/* Add Category Dialog */}
      <Dialog
        open={addDialog}
        onClose={() => {
          setAddDialog(false);
          setNewCategoryName('');
          setError('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Add New Category
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            margin="normal"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddCategory();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => {
            setAddDialog(false);
            setNewCategoryName('');
            setError('');
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddCategory}
            variant="contained"
            disabled={!newCategoryName.trim()}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
              },
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <BottomBar />
    </Box>
  );
}

export default ManageCategories;
