import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/auth/login', formData);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #14b8a6 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'moveBackground 20s linear infinite',
        },
        '@keyframes moveBackground': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(50px, 50px)' },
        },
      }}
    >
      <Container maxWidth="sm">
        <Card 
          elevation={0}
          sx={{
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            },
          }}
        >
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                sx={{
                  background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #14b8a6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                  fontSize: '2.5rem',
                  letterSpacing: '-0.03em',
                }}
              >
                CallItEven
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem' }}>
                Split expenses the easy way
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ 
                  mt: 3, 
                  mb: 2, 
                  py: 1.5,
                  background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #14b8a6 100%)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #0f766e 100%)',
                  },
                }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>

              <Box textAlign="center">
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>
                    Sign up
                  </Link>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default Login;
