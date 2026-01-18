import React from 'react';
import { Box, Typography } from '@mui/material';

export const FullCelebration = ({ show }) => {
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(236, 72, 153, 0.95) 100%)',
        animation: 'fadeIn 0.3s ease-in',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        '@keyframes bounce': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-20px) scale(1.1)' },
        },
        '@keyframes confetti': {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: 0 },
        },
      }}
    >
      {/* Confetti */}
      {[...Array(30)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 10,
            height: 10,
            background: ['#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#fbbf24'][i % 6],
            left: `${Math.random() * 100}%`,
            animation: `confetti ${2 + Math.random() * 2}s linear infinite`,
            animationDelay: `${Math.random() * 2}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
          }}
        />
      ))}
      
      {/* Main Content */}
      <Box
        sx={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          animation: 'bounce 0.6s ease-in-out',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '4rem', md: '6rem' },
            fontWeight: 900,
            color: 'white',
            mb: 2,
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          🎉
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '2rem', md: '3rem' },
            fontWeight: 800,
            color: 'white',
            mb: 2,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          All Evened Up!
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 600,
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          Payment recorded successfully ✨
        </Typography>
      </Box>
    </Box>
  );
};

export const PartialCelebration = ({ show }) => {
  if (!show) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.95) 0%, rgba(6, 182, 212, 0.95) 100%)',
        animation: 'fadeIn 0.3s ease-in',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        '@keyframes slideIn': {
          from: { transform: 'translateX(-100vw) rotate(-20deg)' },
          to: { transform: 'translateX(0) rotate(0deg)' },
        },
        '@keyframes wiggle': {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        '@keyframes float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      }}
    >
      {/* Floating coins */}
      {[...Array(15)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            fontSize: '2rem',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${2 + Math.random()}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.7,
          }}
        >
          💰
        </Box>
      ))}
      
      {/* Main Content */}
      <Box
        sx={{
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          animation: 'slideIn 0.6s ease-out',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '4rem', md: '6rem' },
            fontWeight: 900,
            color: 'white',
            mb: 2,
            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'wiggle 1s ease-in-out infinite',
          }}
        >
          💸
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '2rem', md: '3rem' },
            fontWeight: 800,
            color: 'white',
            mb: 2,
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          Progress! Cha-ching!
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 600,
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          Every little bit counts! 🎯
        </Typography>
      </Box>
    </Box>
  );
};
