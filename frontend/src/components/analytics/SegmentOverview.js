/**
 * Segment Overview Component
 * Display customer segmentation with charts
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import SegmentBadge from './SegmentBadge';

// Segment colors
const SEGMENT_COLORS = {
  Champions: '#4caf50',
  Loyal: '#2196f3',
  Potential: '#00bcd4',
  'At Risk': '#ff9800',
  Lost: '#f44336',
};

const SegmentOverview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchSegmentData();
  }, []);

  const fetchSegmentData = async () => {
    try {
      setLoading(true);
      const response = await api.analytics.getSegmentsOverview();

      // ✅ Fixed: your apiClient already returns response.data, so no .data again
      if (response?.success && response.data) {
        setData(response.data);
        setError(null);
      } else {
        setError(response?.message || 'Unexpected API format');
      }
    } catch (err) {
      console.error('Error fetching segment data:', err);
      setError('Failed to load segment data');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data || !data.segments) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">No segment data available</Alert>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const pieData = Object.entries(data.segments).map(([name, segment]) => ({
    name,
    value: parseInt(segment.count),
    percentage: parseFloat(segment.percentage),
  }));

  const barData = Object.entries(data.segments).map(([name, segment]) => ({
    name,
    customers: parseInt(segment.count),
    value: parseFloat(segment.total_value),
    avgRFM: parseFloat(segment.avg_rfm_score),
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            {d.name}
          </Typography>
          <Typography variant="body2">Customers: {d.customers}</Typography>
          <Typography variant="body2">
            Total Value: ${parseFloat(d.value).toLocaleString()}
          </Typography>
          <Typography variant="body2">Avg RFM Score: {d.avgRFM}</Typography>
        </Box>
      );
    }
    return null;
  };

  // Render main layout
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Customer Segmentation Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Total Customers: {data.total_customers?.toLocaleString() || 0}
        </Typography>

        <Grid container spacing={3} mt={1}>
          {/* Segment cards */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {Object.entries(data.segments).map(([name, segment]) => (
                <Grid item xs={12} sm={6} md={2.4} key={name}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" justifyContent="center" mb={1}>
                        <SegmentBadge segment={name} />
                      </Box>
                      <Typography variant="h4" align="center" fontWeight="bold">
                        {segment.count}
                      </Typography>
                      <Typography variant="body2" align="center" color="text.secondary">
                        {segment.percentage}%
                      </Typography>
                      <Typography variant="caption" align="center" display="block" mt={1}>
                        ${parseFloat(segment.total_value).toLocaleString()}
                      </Typography>
                      <Typography
                        variant="caption"
                        align="center"
                        display="block"
                        color="text.secondary"
                      >
                        Total Value
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Pie chart */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Customer Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEGMENT_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          {/* Bar chart */}
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Total Value by Segment
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#2196f3" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SegmentOverview;
