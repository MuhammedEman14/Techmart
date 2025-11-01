/**
 * Top Customers List Component
 * Display customers with highest predicted CLV
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import { TrendingUp, Person } from '@mui/icons-material';
import api from '../../services/api';
import SegmentBadge from './SegmentBadge';

const TopCustomersList = ({ limit = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchTopCustomers();
  }, [limit]);

  const fetchTopCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔍 Fetch from API
      const response = await api.analytics.getTopCLVCustomers(limit);
      console.log('Top CLV Customers Response:', response);

      // ✅ Handle multiple response formats safely
      if (response?.success && Array.isArray(response.data)) {
        setCustomers(response.data);
      } else if (Array.isArray(response)) {
        setCustomers(response);
      } else {
        setCustomers([]);
        setError('Unexpected response format from server');
      }
    } catch (err) {
      console.error('Error fetching top customers:', err);
      setError('Failed to load top customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // ⏳ Loading State
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // ❌ Error State
  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // ⚠️ Empty State
  if (!customers.length) {
    return (
      <Card>
        <CardContent>
          <Typography color="textSecondary" align="center">
            No top customers found.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // ✅ Success State
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <TrendingUp color="success" />
          <Typography variant="h6" fontWeight="bold">
            Top {limit} Customers by CLV
          </Typography>
        </Box>

        <List>
          {customers.map((item, index) => {
            // Safely handle both nested (item.customer) or flat (item.name, item.email)
            const customer = item.customer || item;

            return (
              <React.Fragment key={customer.id || index}>
                {index > 0 && <Divider />}
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight="bold">
                          {customer.first_name
                            ? `${customer.first_name} ${customer.last_name || ''}`
                            : customer.name || 'Unknown Customer'}
                        </Typography>
                        <SegmentBadge segment={item.rfm_segment} size="small" />
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {customer.email || '—'}
                        </Typography>

                        <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                          <Chip
                            label={`CLV: $${parseFloat(
                              item.clv_predicted || item.clv || 0
                            ).toLocaleString()}`}
                            size="small"
                            color="success"
                          />
                          <Chip
                            label={`Spent: $${parseFloat(
                              item.monetary_value || 0
                            ).toLocaleString()}`}
                            size="small"
                            variant="outlined"
                          />
                          {item.clv_confidence && (
                            <Chip
                              label={`${item.clv_confidence}% confidence`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
};

export default TopCustomersList;
