import React, { useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  ArrowBack,
  Brightness4,
  Brightness7,
  Edit,
  Logout,
  People,
  LocalOffer,
  Receipt,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';
import { ColorModeContext } from '../index';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

/**
 * Shared navigation bar component.
 *
 * @param {object} props
 * @param {string}  props.title        - Page title displayed in the toolbar
 * @param {boolean} [props.showBack]   - Whether to show a back button (default: false)
 * @param {string}  [props.backPath]   - Where the back button navigates to (default: '/dashboard')
 * @param {boolean} [props.showLogo]   - Whether to show the logo-style title (Dashboard only)
 * @param {Function} [props.onEditProfile] - Callback when "Edit Profile" is clicked (only shown if provided)
 * @param {Array}   [props.extraMenuItems] - Additional menu items: [{ label, icon, onClick }]
 */
const NavBar = ({
  title = 'Call It Even',
  showBack = false,
  backPath = '/dashboard',
  showLogo = false,
  onEditProfile,
  extraMenuItems = [],
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { user, logout } = useContext(AuthContext);
  const [menuAnchor, setMenuAnchor] = useState(null);

  const handleMenuOpen = useCallback((e) => setMenuAnchor(e.currentTarget), []);
  const handleMenuClose = useCallback(() => setMenuAnchor(null), []);

  const handleThemeToggle = useCallback(() => {
    colorMode.toggleColorMode();
    setMenuAnchor(null);
  }, [colorMode]);

  const handleLogout = useCallback(() => {
    setMenuAnchor(null);
    logout();
    navigate('/login');
  }, [logout, navigate]);

  return (
    <>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: showLogo
            ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 30%, #f97316 60%, #06b6d4 100%)'
            : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
          backdropFilter: 'blur(20px)',
          borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
          boxShadow: showLogo ? '0 4px 20px rgba(139, 92, 246, 0.3)' : undefined,
        }}
      >
        <Toolbar sx={{ py: 1.5, position: 'relative', zIndex: 1 }}>
          {showBack && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate(backPath)}
              aria-label="Go back"
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                mr: 2,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
              }}
            >
              <ArrowBack />
            </IconButton>
          )}

          {showLogo ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                px: 2,
                py: 1,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Receipt sx={{ fontSize: 32, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  fontSize: '1.5rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                Call It Even
              </Typography>
            </Box>
          ) : (
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          )}

          <Box sx={{ flexGrow: 1 }} />

          <IconButton
            onClick={handleMenuOpen}
            aria-label="Open profile menu"
            sx={{
              p: showLogo ? 0 : undefined,
              bgcolor: showLogo ? undefined : 'rgba(255, 255, 255, 0.15)',
              '&:hover': {
                transform: 'scale(1.05)',
                bgcolor: showLogo ? undefined : 'rgba(255, 255, 255, 0.25)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontWeight: 800,
                fontSize: showLogo ? '1.1rem' : '0.85rem',
                border: showLogo ? '2px solid rgba(255, 255, 255, 0.5)' : undefined,
                backdropFilter: 'blur(10px)',
                boxShadow: showLogo ? '0 4px 12px rgba(0, 0, 0, 0.2)' : undefined,
                width: showLogo ? 48 : 32,
                height: showLogo ? 48 : 32,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {showLogo ? getInitials(user?.name) : user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid',
            borderColor: theme.palette.divider,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
            {user?.email}
          </Typography>
        </Box>

        {onEditProfile && (
          <MenuItem onClick={() => { onEditProfile(); handleMenuClose(); }}>
            <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
            <ListItemText sx={{ color: 'text.primary' }}>Edit Profile</ListItemText>
          </MenuItem>
        )}

        {showLogo && (
          <MenuItem onClick={() => { navigate('/manage-groups'); handleMenuClose(); }}>
            <ListItemIcon><People fontSize="small" /></ListItemIcon>
            <ListItemText sx={{ color: 'text.primary' }}>My Groups</ListItemText>
          </MenuItem>
        )}

        {showLogo && !user?.isAdmin && (
          <MenuItem onClick={() => { navigate('/manage-budgets'); handleMenuClose(); }}>
            <ListItemIcon><AccountBalanceWallet fontSize="small" /></ListItemIcon>
            <ListItemText sx={{ color: 'text.primary' }}>Manage Budgets</ListItemText>
          </MenuItem>
        )}

        {!showLogo && (
          <MenuItem onClick={() => { navigate('/dashboard'); handleMenuClose(); }}>
            <ListItemIcon><ArrowBack fontSize="small" /></ListItemIcon>
            <ListItemText sx={{ color: 'text.primary' }}>Back to Dashboard</ListItemText>
          </MenuItem>
        )}

        {user?.isAdmin && (
          <MenuItem onClick={() => { navigate('/manage-categories'); handleMenuClose(); }}>
            <ListItemIcon><LocalOffer fontSize="small" /></ListItemIcon>
            <ListItemText sx={{ color: 'text.primary' }}>Manage Categories</ListItemText>
          </MenuItem>
        )}

        {user?.isAdmin && (
          <MenuItem onClick={() => { navigate('/manage-users'); handleMenuClose(); }}>
            <ListItemIcon><People fontSize="small" /></ListItemIcon>
            <ListItemText sx={{ color: 'text.primary' }}>Manage Users</ListItemText>
          </MenuItem>
        )}

        {extraMenuItems.map((item, i) => (
          <MenuItem key={i} onClick={() => { item.onClick(); handleMenuClose(); }}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText sx={{ color: 'text.primary' }}>{item.label}</ListItemText>
          </MenuItem>
        ))}

        <MenuItem onClick={handleThemeToggle}>
          <ListItemIcon>
            {theme.palette.mode === 'dark' ? <Brightness7 fontSize="small" /> : <Brightness4 fontSize="small" />}
          </ListItemIcon>
          <ListItemText sx={{ color: 'text.primary' }}>
            {theme.palette.mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" sx={{ color: theme.palette.error.main }} />
          </ListItemIcon>
          <ListItemText sx={{ color: theme.palette.error.main }}>Sign Out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default NavBar;
