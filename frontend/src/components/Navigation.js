import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  ShoppingCart,
  Assessment,
  Inventory,
  Science,
  BarChart,
  PersonSearch,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    {
      title: 'Analytics',
      items: [
        { label: 'Overview', path: '/analytics/overview', icon: <Dashboard /> },
        { label: 'Customer Analytics', path: '/analytics/customers', icon: <PersonSearch /> },
        { label: 'A/B Testing', path: '/analytics/ab-tests', icon: <Science /> },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Products', path: '/products', icon: <ShoppingCart /> },
        { label: 'Customers', path: '/customers', icon: <People /> },
        { label: 'Transactions', path: '/transactions', icon: <Assessment /> },
        { label: 'Inventory', path: '/inventory', icon: <Inventory /> },
      ],
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const DrawerContent = () => (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          E-Commerce System
        </Typography>
      </Box>
      <Divider />
      {menuItems.map((section, idx) => (
        <Box key={idx}>
          <Typography variant="overline" sx={{ px: 2, pt: 2, pb: 1, display: 'block' }}>
            {section.title}
          </Typography>
          <List>
            {section.items.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {idx < menuItems.length - 1 && <Divider />}
        </Box>
      ))}
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            E-Commerce Analytics System
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {menuItems[0].items.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => handleNavigate(item.path)}
                  startIcon={item.icon}
                  sx={{
                    borderBottom: location.pathname === item.path ? 2 : 0,
                    borderRadius: 0,
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <DrawerContent />
      </Drawer>
    </>
  );
};

export default Navigation;