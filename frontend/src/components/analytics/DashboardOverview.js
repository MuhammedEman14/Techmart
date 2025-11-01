import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  TrendingUp,
  Warning,
  AttachMoney,
} from '@mui/icons-material';
import api from '../../services/api';
import SegmentOverview from './SegmentOverview';
import TopCustomersList from './TopCustomersList';
import HighRiskCustomersList from './HighRiskCustomersList';

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.analytics.getDashboard();
      console.log('Dashboard API Response:', response.data); // Debug log
      setDashboardData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Make sure analytics have been calculated.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Alert severity="info">
          Run analytics calculation first: POST http://localhost:5000/api/analytics/calculate-all
        </Alert>
      </Container>
    );
  }

  // ADD NULL CHECK
  if (!dashboardData || !dashboardData.metrics) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">
          No dashboard data available. Please calculate analytics first.
        </Alert>
      </Container>
    );
  }

  // Safe data extraction with defaults
  const totalCustomers = dashboardData.total_customers || 0;
  const segments = dashboardData.segments || {};
  const metrics = dashboardData.metrics || {};
  const avgRFM = metrics.avg_rfm_score || 0;
  const avgCLV = metrics.avg_clv || 0;
  const avgChurn = metrics.avg_churn_risk || 0;
  const totalValue = metrics.total_predicted_value || 0;

  const MetricCard = ({ title, value, subtitle, icon, color }) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.100`,
              p: 1.5,
              borderRadius: 2,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Analytics Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Real-time insights into customer behavior and business metrics
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Customers"
            value={totalCustomers.toLocaleString()}
            subtitle="Active in database"
            icon={<People sx={{ fontSize: 32, color: 'primary.main' }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Average RFM Score"
            value={parseFloat(avgRFM).toFixed(1)}
            subtitle="Out of 15"
            icon={<TrendingUp sx={{ fontSize: 32, color: 'success.main' }} />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Average CLV"
            value={`$${parseFloat(avgCLV).toLocaleString()}`}
            subtitle="Predicted lifetime value"
            icon={<AttachMoney sx={{ fontSize: 32, color: 'info.main' }} />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Churn Risk"
            value={`${parseFloat(avgChurn).toFixed(0)}%`}
            subtitle="Risk score"
            icon={<Warning sx={{ fontSize: 32, color: 'warning.main' }} />}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Segment Overview */}
      <Box mb={4}>
        <SegmentOverview segments={segments} />
      </Box>

      {/* Customer Lists */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TopCustomersList limit={10} />
        </Grid>
        <Grid item xs={12} md={6}>
          <HighRiskCustomersList limit={10} />
        </Grid>
      </Grid>

      {/* Total Predicted Value Banner */}
      <Box mt={4}>
        <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Total Predicted Customer Value
                </Typography>
                <Typography variant="body1">
                  Combined predicted lifetime value of all customers
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} textAlign={{ xs: 'left', md: 'right' }}>
                <Typography variant="h3" fontWeight="bold">
                  ${parseFloat(totalValue).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default DashboardOverview;
