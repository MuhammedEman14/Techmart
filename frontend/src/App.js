/**
 * Main App Component
 * Configures Material-UI theme, routing, and navigation
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Existing components
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import TransactionsTable from './components/TransactionsTable';

// NEW: Analytics components (create these in components/analytics/ folder)
import DashboardOverview from './components/analytics/DashboardOverview';
import CustomerAnalyticsDashboard from './components/analytics/CustomerAnalyticsDashboard';
import ABTestManager from './components/analytics/ABTestManager';

// Create custom theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation />
          <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
            <Routes>
              {/* Default route - redirect to analytics overview */}
              <Route path="/" element={<Navigate to="/analytics/overview" replace />} />
              
              {/* Existing routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<TransactionsTable />} />
              
              {/* NEW: Analytics routes */}
              <Route path="/analytics/overview" element={<DashboardOverview />} />
              <Route path="/analytics/customers" element={<CustomerAnalyticsDashboard />} />
              <Route path="/analytics/ab-tests" element={<ABTestManager />} />
              <Route path= "/dashboard" element={ <Dashboard />} />
              {/* Catch all - redirect to analytics overview */}
              <Route path="*" element={<Navigate to="/analytics/overview" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;