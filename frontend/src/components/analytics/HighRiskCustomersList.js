/**
 * High Risk Customers List Component
 * Display customers at high risk of churning
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
  Button,
} from '@mui/material';
import {
  Warning,
  Person,
  Email,
} from '@mui/icons-material';
import api from '../../services/api';
import SegmentBadge from './SegmentBadge';

const HighRiskCustomersList = ({ limit = 20 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchHighRiskCustomers();
  }, [limit]);

  const fetchHighRiskCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.analytics.getHighRiskCustomers(limit);
      setCustomers(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching high risk customers:', err);
      setError('Failed to load high risk customers');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      default:
        return 'info';
    }
  };

  const handleSendEmail = (customer) => {
    console.log('Send retention email to:', customer.email);
    // Implement email sending logic
  };

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

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Warning color="error" />
          <Typography variant="h6" fontWeight="bold">
            High Risk Customers
          </Typography>
        </Box>

        {customers.length === 0 ? (
          <Alert severity="success">
            Great! No customers at high risk of churning.
          </Alert>
        ) : (
          <List>
            {customers.map((item, index) => (
              <React.Fragment key={item.customer.id}>
                {index > 0 && <Divider />}
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getRiskColor(item.churn_risk_level) + '.main' }}>
                      <Warning />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight="bold">
                          {item.customer.first_name} {item.customer.last_name}
                        </Typography>
                        <SegmentBadge segment={item.rfm_segment} size="small" />
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {item.customer.email}
                        </Typography>
                        <Box display="flex" gap={1} mt={0.5} flexWrap="wrap" alignItems="center">
                          <Chip
                            label={`${item.churn_risk_score} Risk Score`}
                            size="small"
                            color={getRiskColor(item.churn_risk_level)}
                          />
                          <Chip
                            label={item.churn_risk_level.toUpperCase()}
                            size="small"
                            color={getRiskColor(item.churn_risk_level)}
                            variant="outlined"
                          />
                          {item.clv_predicted > 0 && (
                            <Chip
                              label={`At Risk: $${parseFloat(item.clv_predicted).toLocaleString()}`}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Box mt={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Email />}
                            onClick={() => handleSendEmail(item.customer)}
                          >
                            Send Retention Email
                          </Button>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default HighRiskCustomersList;