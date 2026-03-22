import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { GRADIENT_PURPLE_PINK, gradientText } from '../utils/themeConstants';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: 'background.default' }}
    >
      <Typography
        variant="h1"
        sx={{
          fontWeight: 900,
          fontSize: { xs: '6rem', md: '8rem' },
          ...gradientText(GRADIENT_PURPLE_PINK),
        }}
      >
        404
      </Typography>
      <Typography variant="h5" color="text.secondary" sx={{ mb: 3, fontWeight: 600 }}>
        Page not found
      </Typography>
      <Button
        variant="contained"
        onClick={() => navigate('/dashboard')}
        sx={{
          background: GRADIENT_PURPLE_PINK,
          color: 'white',
          px: 4,
          py: 1.5,
          fontWeight: 700,
        }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default NotFound;
