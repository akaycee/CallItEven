import React, { useContext } from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material';
import { Person, People } from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { GRADIENT_EMERALD_TEAL } from '../utils/themeConstants';

/**
 * Toggle between personal and household view.
 * Auto-hidden if user has no familyGroup.
 *
 * @param {string} value - 'personal' | 'household'
 * @param {function} onChange - callback(event, newValue)
 * @param {string} [familyName] - optional family name to display
 */
const HouseholdToggle = ({ value, onChange, familyName }) => {
  const { familyGroup } = useContext(AuthContext);
  const theme = useTheme();

  // Hide if no family group
  if (!familyGroup) return null;

  const displayName = familyName || familyGroup?.name || 'Household';

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={onChange}
        size="small"
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'rgba(15, 23, 42, 0.8)'
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: 3,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.08)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          '& .MuiToggleButton-root': {
            border: 'none',
            borderRadius: '12px !important',
            px: 2,
            py: 0.75,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: theme.palette.text.secondary,
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              background: GRADIENT_EMERALD_TEAL,
              color: 'white',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              '&:hover': {
                background: GRADIENT_EMERALD_TEAL,
              },
            },
          },
        }}
      >
        <ToggleButton value="personal" aria-label="personal view">
          <Person sx={{ fontSize: 18, mr: 0.5 }} />
          <Typography variant="body2" sx={{ fontWeight: 'inherit', color: 'inherit' }}>Me</Typography>
        </ToggleButton>
        <ToggleButton value="household" aria-label="household view">
          <People sx={{ fontSize: 18, mr: 0.5 }} />
          <Typography variant="body2" sx={{ fontWeight: 'inherit', color: 'inherit' }}>{displayName}</Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default HouseholdToggle;
