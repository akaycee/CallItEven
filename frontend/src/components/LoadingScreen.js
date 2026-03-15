import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const LoadingScreen = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
    <CircularProgress aria-label="Loading" />
  </Box>
);

export default LoadingScreen;
