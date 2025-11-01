/**
 * Customer Analytics Dashboard
 * Main dashboard with customer search and analytics
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button,
  TextField,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import {
  Refresh,
  Person,
  Search,
} from '@mui/icons-material';
import api from '../../services/api';
import SegmentBadge from './SegmentBadge';
import RFMScoreCard from './RFMScoreCard';
import CLVWidget from './CLVWidget';
import ChurnRiskWidget from './ChurnRiskWidget';
import RecommendationsPanel from './RecommendationsPanel';
import SegmentOverview from './SegmentOverview';

const CustomerAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Load initial customers on mount
  useEffect(() => {
    fetchInitialCustomers();
  }, []);

  // Fetch initial customer list
  const fetchInitialCustomers = async () => {
    try {
      console.log('🔄 Fetching initial customers...');
      const response = await api.customers.getAll({ limit: 100 });
      
      if (response && response.data) {
        const customersList = Array.isArray(response.data) ? response.data : [];
        console.log(`✅ Loaded ${customersList.length} customers`);
        setCustomers(customersList);
      }
    } catch (err) {
      console.error('❌ Error fetching customers:', err);
      setCustomers([]);
    }
  };

  // Autocomplete search as user types
  const handleSearchChange = async (event, value, reason) => {
    setInputValue(value);

    if (reason === 'input' && value && value.length >= 2) {
      try {
        setSearchLoading(true);
        const response = await api.customers.autocomplete(value, 15);
        
        if (response && response.data) {
          const results = Array.isArray(response.data) ? response.data : [];
          setCustomers(results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    } else if (!value || value.length < 2) {
      // Reset to initial list if search cleared
      fetchInitialCustomers();
    }
  };

  // Fetch customer analytics
  const fetchCustomerAnalytics = async (customerId) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔄 Fetching analytics for customer ${customerId}...`);
      
      const response = await api.analytics.getCustomerComplete(customerId);
      console.log('📊 Analytics Response:', response);
      
      if (response && response.data) {
        setAnalyticsData(response.data);
      } else {
        setError('Invalid analytics data format');
      }
    } catch (err) {
      console.error('❌ Error fetching analytics:', err);
      setError('Failed to load customer analytics');
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (event, customer) => {
    console.log('Selected customer:', customer);
    setSelectedCustomer(customer);
    if (customer) {
      fetchCustomerAnalytics(customer.id);
    } else {
      setAnalyticsData(null);
    }
  };

  // Refresh analytics
  const handleRefresh = () => {
    if (selectedCustomer) {
      fetchCustomerAnalytics(selectedCustomer.id);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Customer Behavior Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive analytics powered by RFM analysis, CLV prediction, and churn risk identification
        </Typography>
      </Box>

      {/* Customer Selector with Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) =>
                `${option.first_name} ${option.last_name} (${option.email})`
              }
              value={selectedCustomer}
              onChange={handleCustomerSelect}
              onInputChange={handleSearchChange}
              inputValue={inputValue}
              loading={searchLoading}
              filterOptions={(x) => x} // Disable built-in filtering (we handle it server-side)
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Customer"
                  placeholder="Type name or email to search..."
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {searchLoading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  helperText={
                    inputValue && inputValue.length < 2
                      ? 'Type at least 2 characters to search'
                      : `${customers.length} customers found`
                  }
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Person sx={{ mr: 1, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body1" fontWeight="medium">
                      {option.first_name} {option.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                      {option.loyalty_tier && ` • ${option.loyalty_tier} tier`}
                    </Typography>
                  </Box>
                </Box>
              )}
              noOptionsText={
                inputValue && inputValue.length >= 2
                  ? 'No customers found'
                  : 'Start typing to search...'
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={!selectedCustomer || loading}
              fullWidth
            >
              Refresh Analytics
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Segment Overview (Always visible) */}
      <Box mb={3}>
        <SegmentOverview />
      </Box>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Loading analytics...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Customer Analytics */}
      {analyticsData && !loading && (
        <>
          {/* Customer Header */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCustomer.email}
                  {selectedCustomer.loyalty_tier && (
                    <Typography component="span" sx={{ ml: 2, textTransform: 'capitalize' }}>
                      • {selectedCustomer.loyalty_tier} Tier
                    </Typography>
                  )}
                </Typography>
              </Box>
              <Box mt={{ xs: 2, md: 0 }}>
                {analyticsData.rfm && analyticsData.rfm.rfm_segment && (
                  <SegmentBadge segment={analyticsData.rfm.rfm_segment} size="large" />
                )}
              </Box>
            </Box>
          </Paper>

          {/* Analytics Grid */}
          <Grid container spacing={3}>
            {/* RFM Score */}
            <Grid item xs={12} md={4}>
              <RFMScoreCard rfmData={analyticsData.rfm} />
            </Grid>

            {/* CLV Widget */}
            <Grid item xs={12} md={4}>
              <CLVWidget clvData={analyticsData.clv} />
            </Grid>

            {/* Churn Risk */}
            <Grid item xs={12} md={4}>
              <ChurnRiskWidget churnData={analyticsData.churn} />
            </Grid>

            {/* Recommendations */}
            <Grid item xs={12}>
              <RecommendationsPanel customerId={selectedCustomer.id} />
            </Grid>
          </Grid>
        </>
      )}

      {/* Empty State */}
      {!selectedCustomer && !loading && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Search sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Search for a customer to view analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the search box above to find a customer by name or email
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default CustomerAnalyticsDashboard;