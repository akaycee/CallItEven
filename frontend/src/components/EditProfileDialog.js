import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import { GRADIENT_PURPLE_PINK, GRADIENT_PURPLE_PINK_HOVER, cardBg, gradientText } from '../utils/themeConstants';

export const EditProfileDialog = React.memo(({
  open,
  onClose,
  profileForm,
  onFormChange,
  onSubmit,
  error,
  success,
}) => {
  const theme = useTheme();

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: cardBg.purplePink(theme.palette.mode),
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
        },
      }}
    >
      <DialogTitle sx={{ 
        fontWeight: 700,
        ...gradientText(GRADIENT_PURPLE_PINK),
      }}>
        Edit Profile
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, mt: 1 }}>
            {success}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={profileForm.name}
          onChange={onFormChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={profileForm.email}
          onChange={onFormChange}
          margin="normal"
          required
        />
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Leave password fields blank to keep current password
        </Typography>
        <TextField
          fullWidth
          label="New Password"
          name="password"
          type="password"
          value={profileForm.password}
          onChange={onFormChange}
          margin="normal"
          helperText="Minimum 6 characters"
        />
        <TextField
          fullWidth
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          value={profileForm.confirmPassword}
          onChange={onFormChange}
          margin="normal"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button 
          onClick={onSubmit}
          variant="contained"
          disabled={!profileForm.name || !profileForm.email}
          sx={{
            background: GRADIENT_PURPLE_PINK,
            color: 'white',
            '&:hover': {
              background: GRADIENT_PURPLE_PINK_HOVER,
            },
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
});
