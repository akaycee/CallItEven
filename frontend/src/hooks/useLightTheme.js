import React from 'react';
import { useTheme, createTheme } from '@mui/material';

/**
 * Returns a forced-light-mode theme derived from the current MUI theme.
 * Used on Login and Register pages so they always render with a light background
 * regardless of the user's colour-mode preference.
 *
 * @returns {Theme}
 */
export function useLightTheme() {
  const parentTheme = useTheme();
  return React.useMemo(
    () => createTheme({ ...parentTheme, palette: { ...parentTheme.palette, mode: 'light' } }),
    [parentTheme]
  );
}
