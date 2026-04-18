import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  ShoppingCart,
  AccountBalanceWallet,
  ShowChart,
  People,
  StickyNote2,
  LocalOffer,
  Person,
  Savings,
  FamilyRestroom,
} from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { GRADIENT_PURPLE_PINK, GRADIENT_PURPLE_PINK_HOVER, cardBg, gradientText } from '../utils/themeConstants';
import { KF_DOCK_BOUNCE, KF_HINT_PULSE } from '../utils/keyframes';
import { KF_BOUNCE } from '../utils/keyframes';

/**
 * Persistent bottom tab bar shown on all authenticated pages.
 *
 * @param {object}   props
 * @param {Function} [props.onAddIncome]   - Override for "Add Income" button (default: navigate to /manage-income)
 * @param {Function} [props.onAddExpense]  - Override for "Add Expense" button (default: navigate to /expenses/new)
 */
const BottomBar = ({ onAddIncome, onAddExpense }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const [showDockHint, setShowDockHint] = useState(
    () => !localStorage.getItem('hasSeenDock')
  );
  const [notesDialog, setNotesDialog] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState('');
  const [notesError, setNotesError] = useState('');

  const handleOpenNotes = () => {
    setNotesSuccess('');
    setNotesError('');
    axios.get('/api/users/profile').then(res => {
      setUserNotes(res.data.notes || '');
    }).catch(() => {
      setNotesError('Could not load your notes. You can still type new ones.');
    });
    setNotesDialog(true);
  };

  const handleAddIncome = onAddIncome || (() => navigate('/manage-income'));
  const handleAddExpense = onAddExpense || (() => navigate('/expenses/new'));

  return (
    <>
      {/* Bottom Tab Bar */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          px: 2,
          py: 1,
          background: theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08)',
          animation: showDockHint ? 'dockBounce 0.6s ease-out' : 'none',
          ...KF_DOCK_BOUNCE,
        }}
      >
        {/* First-visit hint */}
        {showDockHint && (
          <Box
            onClick={() => {
              setShowDockHint(false);
              localStorage.setItem('hasSeenDock', 'true');
            }}
            sx={{
              position: 'absolute',
              top: -44,
              left: '50%',
              transform: 'translateX(-50%)',
              background: GRADIENT_PURPLE_PINK,
              color: 'white',
              px: 2,
              py: 0.75,
              borderRadius: 2,
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
              animation: 'hintPulse 2s ease-in-out infinite',
              ...KF_HINT_PULSE,
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #ec4899',
              },
            }}
          >
            Your tools live here ✨ Tap to dismiss
          </Box>
        )}

        {/* Income capsule */}
        {!user?.isAdmin && (
          <Box sx={{
            display: 'flex', flexDirection: 'row', gap: 0.25, px: 0.75, py: 0.5, borderRadius: 2.5,
            background: '#10b981',
          }}>
            {[{ icon: <TrendingUp sx={{ fontSize: 20 }} />, label: 'Add', onClick: handleAddIncome },
              { icon: <AttachMoney sx={{ fontSize: 20 }} />, label: 'Income', onClick: () => navigate('/manage-income') },
            ].map((item) => (
              <Box key={item.label} onClick={item.onClick} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                px: 1, py: 0.25, borderRadius: 2, color: 'white',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                '&:active': { transform: 'scale(0.95)' },
              }}>
                {item.icon}
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, mt: 0.25, lineHeight: 1, color: 'white' }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Expense capsule */}
        {!user?.isAdmin && (
          <Box sx={{
            display: 'flex', flexDirection: 'row', gap: 0.25, px: 0.75, py: 0.5, borderRadius: 2.5,
            background: '#f97316',
          }}>
            {[{ icon: <ShoppingCart sx={{ fontSize: 20 }} />, label: 'Add', onClick: handleAddExpense },
              { icon: <AccountBalanceWallet sx={{ fontSize: 20 }} />, label: 'Budgets', onClick: () => navigate('/manage-budgets') },
            ].map((item) => (
              <Box key={item.label} onClick={item.onClick} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                px: 1, py: 0.25, borderRadius: 2, color: 'white',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                '&:active': { transform: 'scale(0.95)' },
              }}>
                {item.icon}
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, mt: 0.25, lineHeight: 1, color: 'white' }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Admin capsule */}
        {user?.isAdmin && (
          <Box sx={{
            display: 'flex', flexDirection: 'row', gap: 0.25, px: 0.75, py: 0.5, borderRadius: 2.5,
            background: '#8b5cf6',
          }}>
            {[{ icon: <LocalOffer sx={{ fontSize: 20 }} />, label: 'Categories', onClick: () => navigate('/manage-categories') },
              { icon: <Person sx={{ fontSize: 20 }} />, label: 'Users', onClick: () => navigate('/manage-users') },
            ].map((item) => (
              <Box key={item.label} onClick={item.onClick} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
                px: 1, py: 0.25, borderRadius: 2, color: 'white',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                '&:active': { transform: 'scale(0.95)' },
              }}>
                {item.icon}
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, mt: 0.25, lineHeight: 1, color: 'white' }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Utilities capsule */}
        <Box sx={{
          display: 'flex', flexDirection: 'row', gap: 0.25, px: 0.75, py: 0.5, borderRadius: 2.5,
          background: theme.palette.mode === 'dark' ? '#334155' : '#64748b',
        }}>
          {[
            ...(!user?.isAdmin ? [{ icon: <ShowChart sx={{ fontSize: 20 }} />, label: 'Flow', onClick: () => navigate('/cash-flow') }] : []),
            ...(!user?.isAdmin ? [{ icon: <AccountBalanceWallet sx={{ fontSize: 20 }} />, label: 'Invest', onClick: () => navigate('/manage-investments') }] : []),
            ...(!user?.isAdmin ? [{ icon: <Savings sx={{ fontSize: 20 }} />, label: 'Save', onClick: () => navigate('/manage-savings') }] : []),
            { icon: <People sx={{ fontSize: 20 }} />, label: 'Groups', onClick: () => navigate('/manage-groups') },
            ...(!user?.isAdmin ? [{ icon: <FamilyRestroom sx={{ fontSize: 20 }} />, label: 'Family', onClick: () => navigate('/manage-family') }] : []),
            { icon: <StickyNote2 sx={{ fontSize: 20 }} />, label: 'Notes', onClick: handleOpenNotes },
          ].map((item) => (
            <Box key={item.label} onClick={item.onClick} sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
              px: 1, py: 0.25, borderRadius: 2, color: 'white',
              transition: 'all 0.2s ease',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              '&:active': { transform: 'scale(0.95)' },
            }}>
              {item.icon}
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, mt: 0.25, lineHeight: 1, color: 'white' }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Notes Dialog */}
      <Dialog
        open={notesDialog}
        onClose={() => { setNotesDialog(false); setNotesError(''); }}
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
          My Notes
        </DialogTitle>
        <DialogContent>
          {notesError && (
            <Alert severity="warning" sx={{ mb: 1, mt: 1 }}>{notesError}</Alert>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, mt: 1, display: 'block' }}>
            Keep track of reminders — e.g., which card expenses have been added through
          </Typography>
          <TextField
            fullWidth
            label="Notes"
            value={userNotes}
            onChange={(e) => { setUserNotes(e.target.value); setNotesSuccess(''); }}
            multiline
            rows={6}
            placeholder="e.g., Chase card expenses added through March 10"
            inputProps={{ maxLength: 5000 }}
            helperText={notesSuccess || `${userNotes.length}/5000`}
            FormHelperTextProps={{
              sx: notesSuccess ? { color: 'success.main' } : {},
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setNotesDialog(false); setNotesError(''); }} sx={{ color: 'text.secondary' }}>
            Close
          </Button>
          <Button
            variant="contained"
            disabled={notesSaving}
            onClick={async () => {
              setNotesSaving(true);
              try {
                await axios.put('/api/users/notes', { notes: userNotes });
                setNotesSuccess('Notes saved!');
                setTimeout(() => setNotesSuccess(''), 2000);
              } catch (err) {
                // silently fail
              } finally {
                setNotesSaving(false);
              }
            }}
            sx={{
              background: GRADIENT_PURPLE_PINK,
              color: 'white',
              '&:hover': {
                background: GRADIENT_PURPLE_PINK_HOVER,
              },
            }}
          >
            {notesSaving ? 'Saving...' : 'Save Notes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BottomBar;
