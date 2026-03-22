import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
} from '@mui/material';
import { GRADIENT_EMERALD_TEAL, GRADIENT_EMERALD_TEAL_HOVER, cardBg, gradientText } from '../utils/themeConstants';

export const EvenUpDialog = React.memo(({
  open,
  onClose,
  evenUpForm,
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
          background: cardBg.emeraldTeal(theme.palette.mode),
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
        },
      }}
    >
      <DialogTitle sx={{ 
        fontWeight: 700,
        ...gradientText(GRADIENT_EMERALD_TEAL),
      }}>
        Even Up
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
          label="Amount"
          name="amount"
          type="number"
          value={evenUpForm.amount}
          onChange={onFormChange}
          margin="normal"
          required
          InputProps={{
            startAdornment: <span style={{ marginRight: 8 }}>$</span>,
          }}
        />
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Payment Method</InputLabel>
          <Select
            name="paymentMethod"
            value={evenUpForm.paymentMethod}
            onChange={onFormChange}
            label="Payment Method"
          >
            <MenuItem value="Cash">Cash</MenuItem>
            <MenuItem value="Zelle">Zelle</MenuItem>
            <MenuItem value="Venmo">Venmo</MenuItem>
            <MenuItem value="PayPal">PayPal</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Notes (optional)"
          name="notes"
          value={evenUpForm.notes}
          onChange={onFormChange}
          margin="normal"
          multiline
          rows={2}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Cancel
        </Button>
        <Button 
          onClick={onSubmit}
          variant="contained"
          disabled={!evenUpForm.amount || !evenUpForm.paymentMethod}
          sx={{
            background: GRADIENT_EMERALD_TEAL,
            color: 'white',
            '&:hover': {
              background: GRADIENT_EMERALD_TEAL_HOVER,
            },
          }}
        >
          Record Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
});
