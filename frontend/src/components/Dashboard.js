/**
 * Main Dashboard Component
 * Central dashboard with real-time metrics, charts, and data tables
 * Implements responsive grid layout with auto-refresh functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  Switch,
  FormControlLabel,
  Paper,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from '@mui/material';
import {
  Refresh,
  Notifications,
  TrendingUp,
  People,
  ShoppingCart,
  AttachMoney,
  MoreVert,
  Dashboard as DashboardIcon,
  FilterList,
  Close,
} from '@mui/icons-material';

// Import components
import MetricCard from './MetricCard';
import SalesChart from './SalesChart';
import TopProductsTable from './TopProductsTable';
import RecentTransactions from './RecentTransactions';
import LowStockAlerts from './LowStockAlerts';
import TransactionsTable from './TransactionsTable';

// Import API service
import api from '../services/api';

const UPDATE_INTERVAL = parseInt(process.env.REACT_APP_UPDATE_INTERVAL) || 30000; // 30 seconds

// Product categories
const PRODUCT_CATEGORIES = [
  'All Categories',
  'Accessories',
  'Audio',
  'Cameras',
  'Components',
  'Gaming',
  'Laptops',
  'Smart Home',
  'Smartphones',
  'Tablets',
  'Wearables',
];

const Dashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [lowStockData, setLowStockData] = useState(null);
  const [transactionsData, setTransactionsData] = useState([]);
  const [alertsData, setAlertsData] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [alertsCount, setAlertsCount] = useState(0);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'transactions'

  /**
   * Get category filter value for API calls
   */
  const getCategoryFilter = useCallback(() => {
    return selectedCategory === 'All Categories' ? null : selectedCategory;
  }, [selectedCategory]);

  /**
   * Fetch alerts data for notifications
   */
  const fetchAlertsData = useCallback(async () => {
    try {
      const response = await api.alerts.getAll({ 
        status: 'active',
        limit: 100 
      });
      
      if (response.success && response.data) {
        setAlertsData(response.data);
        setAlertsCount(response.data.summary?.active || 0);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, []);

  /**
   * Fetch dashboard overview data
   */
  const fetchDashboardData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      
      const category = getCategoryFilter();
      const response = await api.dashboard.getOverview(null, null, null, category);
      
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showSnackbar('Failed to fetch dashboard data', 'error');
    } finally {
      if (showRefreshIndicator) setRefreshing(false);
    }
  }, [getCategoryFilter]);

  /**
   * Fetch sales analytics data
   */
  const fetchSalesData = useCallback(async () => {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const category = getCategoryFilter();
      
      const response = await api.analytics.getHourlySales(startDate, endDate, 'hour', category);
      
      if (response.success && response.data) {
        setSalesData(response.data);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  }, [getCategoryFilter]);

  /**
   * Fetch low stock inventory data
   */
  const fetchLowStockData = useCallback(async () => {
    try {
      const category = getCategoryFilter();
      const response = await api.inventory.getLowStock(10, category);
      
      if (response.success && response.data) {
        setLowStockData(response.data);
      }
    } catch (error) {
      console.error('Error fetching low stock data:', error);
    }
  }, [getCategoryFilter]);

  /**
   * Fetch recent transactions
   */
  const fetchTransactions = useCallback(async () => {
    try {
      const params = { limit: 100, page: 1 };
      
      // Note: Backend doesn't directly filter transactions by product category
      // This would require a JOIN query on the backend
      // For now, we fetch all and can filter client-side if needed
      
      const response = await api.transactions.getAll(params);
      
      if (response.success && response.data) {
        setTransactionsData(response.data);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, []);

  /**
   * Fetch all data
   */
  const fetchAllData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    
    try {
      await Promise.all([
        fetchDashboardData(false),
        fetchSalesData(),
        fetchLowStockData(),
        fetchTransactions(),
        fetchAlertsData(),
      ]);
      
      if (showRefreshIndicator) {
        showSnackbar('Dashboard refreshed successfully', 'success');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Error refreshing dashboard', 'error');
    } finally {
      setLoading(false);
      if (showRefreshIndicator) setRefreshing(false);
    }
  }, [fetchDashboardData, fetchSalesData, fetchLowStockData, fetchTransactions, fetchAlertsData]);

  /**
   * Initial data load
   */
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /**
   * Refresh data when category changes
   */
  useEffect(() => {
    if (!loading) {
      fetchAllData(false);
    }
  }, [selectedCategory]); // Only depend on selectedCategory

  /**
   * Auto-refresh timer
   */
  useEffect(() => {
    let interval;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchAllData(false);
      }, UPDATE_INTERVAL);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchAllData]);

  /**
   * Show snackbar notification
   */
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  /**
   * Handle manual refresh
   */
  const handleManualRefresh = () => {
    fetchAllData(true);
  };

  /**
   * Handle snackbar close
   */
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  /**
   * Handle category change
   */
  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    showSnackbar(`Filtering by: ${event.target.value}`, 'info');
  };

  /**
   * Clear category filter
   */
  const handleClearCategory = () => {
    setSelectedCategory('All Categories');
    showSnackbar('Category filter cleared', 'info');
  };

  /**
   * Format currency
   */
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <Box textAlign="center">
          <CircularProgress size={60} />
          <Typography variant="h6" mt={2}>
            Loading Dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar Header */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            TechMart Analytics Dashboard
          </Typography>

          {/* Category Filter */}
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 180, 
              mr: 2,
              display: { xs: 'none', sm: 'block' },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'white',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiSvgIcon-root': {
                color: 'white',
              },
            }}
          >
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={handleCategoryChange}
              startAdornment={
                selectedCategory !== 'All Categories' && (
                  <Tooltip title="Clear filter">
                    <IconButton
                      size="small"
                      onClick={handleClearCategory}
                      sx={{ 
                        ml: -0.5, 
                        mr: 0.5,
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )
              }
            >
              {PRODUCT_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                color="default"
              />
            }
            label={
              <Typography variant="caption" color="inherit" sx={{ display: { xs: 'none', md: 'block' } }}>
                Auto-refresh
              </Typography>
            }
            sx={{ mr: 2 }}
          />

          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={alertsCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title={refreshing ? 'Refreshing...' : 'Refresh Dashboard'}>
            <IconButton
              color="inherit"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <Refresh className={refreshing ? 'rotate' : ''} />
            </IconButton>
          </Tooltip>

          <IconButton
            color="inherit"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <MoreVert />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* Active Filter Indicator */}
        {selectedCategory !== 'All Categories' && (
          <Box mb={2}>
            <Chip
              icon={<FilterList />}
              label={`Filtered by: ${selectedCategory}`}
              onDelete={handleClearCategory}
              color="primary"
              sx={{ fontWeight: 500 }}
            />
          </Box>
        )}

        {viewMode === 'overview' ? (
          <>
            {/* Key Metrics Row */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Total Sales"
                  value={formatCurrency(dashboardData?.total_sales || 0)}
                  change={dashboardData?.growth_percentage}
                  icon={AttachMoney}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Transactions"
                  value={dashboardData?.total_transactions || 0}
                  icon={ShoppingCart}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Active Customers"
                  value={dashboardData?.active_customers || 0}
                  icon={People}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Avg. Order Value"
                  value={formatCurrency(dashboardData?.average_order_value || 0)}
                  icon={TrendingUp}
                  color="warning"
                />
              </Grid>
            </Grid>

            {/* Sales Chart */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12}>
                <SalesChart data={salesData} loading={false} />
              </Grid>
            </Grid>

            {/* Top Products and Recent Transactions */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} md={6}>
                <TopProductsTable
                  data={dashboardData?.top_products || []}
                  loading={false}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <RecentTransactions
                  data={dashboardData?.recent_transactions || []}
                  loading={false}
                />
              </Grid>
            </Grid>

            {/* Low Stock Alerts */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <LowStockAlerts
                  data={lowStockData}
                  loading={false}
                />
              </Grid>
            </Grid>
          </>
        ) : (
          /* Transactions View */
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TransactionsTable
                data={transactionsData}
                loading={false}
                onRefresh={fetchTransactions}
              />
            </Grid>
          </Grid>
        )}
      </Container>

      {/* Footer */}
      <Paper
        component="footer"
        elevation={3}
        sx={{ p: 2, mt: 'auto', textAlign: 'center' }}
      >
        <Typography variant="body2" color="text.secondary">
          TechMart Analytics Dashboard © 2025 • Last updated:{' '}
          {new Date().toLocaleString()}
        </Typography>
      </Paper>

      {/* View Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setViewMode('overview');
            setMenuAnchor(null);
          }}
          selected={viewMode === 'overview'}
        >
          Overview
        </MenuItem>
        <MenuItem
          onClick={() => {
            setViewMode('transactions');
            setMenuAnchor(null);
          }}
          selected={viewMode === 'transactions' && (
  /* Transactions View */
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <TransactionsTable />
    </Grid>
  </Grid>
)}
        >
          All Transactions
        </MenuItem>
      </Menu>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>

      {/* Global Styles for Animations */}
      <style>
        {`
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .rotate {
            animation: rotate 1s linear infinite;
          }
        `}
      </style>
    </Box>
  );
};

export default Dashboard;