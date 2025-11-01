/**
 * LowStockAlerts Component
 * Displays low stock inventory alerts with urgency indicators
 */

import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Typography,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Inventory,
  Error as ErrorIcon,
  Warning,
  Info,
} from '@mui/icons-material';

const LowStockAlerts = ({ data, loading, error }) => {
  // Get urgency configuration
  const getUrgencyConfig = (urgencyLevel) => {
    switch (urgencyLevel) {
      case 'critical':
        return {
          icon: <ErrorIcon />,
          color: 'error',
          label: 'Critical',
          bgcolor: 'error.light',
        };
      case 'high':
        return {
          icon: <Warning />,
          color: 'warning',
          label: 'High',
          bgcolor: 'warning.light',
        };
      case 'medium':
        return {
          icon: <Info />,
          color: 'info',
          label: 'Medium',
          bgcolor: 'info.light',
        };
      default:
        return {
          icon: <Inventory />,
          color: 'default',
          label: 'Low',
          bgcolor: 'grey.300',
        };
    }
  };

  // Calculate stock percentage for progress bar
  const getStockPercentage = (current, threshold = 100) => {
    return Math.min((current / threshold) * 100, 100);
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Low Stock Alerts" />
        <CardContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Low Stock Alerts" />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const products = data?.low_stock_products || [];

  if (products.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Low Stock Alerts" />
        <CardContent>
          <Alert severity="success">All products are adequately stocked!</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Low Stock Alerts"
        subheader={`${products.length} products need attention`}
      />
      <CardContent sx={{ p: 0, maxHeight: 500, overflow: 'auto' }}>
        <List>
          {products.slice(0, 100).map((product, index) => {
            const urgencyConfig = getUrgencyConfig(product.metrics?.urgency_level);
            const stockPercentage = getStockPercentage(product.stock_quantity, 50);
            const daysUntilStockout = product.metrics?.days_until_stockout;

            return (
              <React.Fragment key={product.id || index}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: urgencyConfig.bgcolor }}>
                      {urgencyConfig.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight="medium">
                          {product.name}
                        </Typography>
                        <Chip
                          label={urgencyConfig.label}
                          color={urgencyConfig.color}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Category: {product.category} • SKU: {product.sku}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <Typography variant="caption" color="text.secondary" minWidth={120}>
                            Stock: {product.stock_quantity} units
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={stockPercentage}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 1,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor:
                                  stockPercentage > 50
                                    ? 'success.main'
                                    : stockPercentage > 20
                                    ? 'warning.main'
                                    : 'error.main',
                              },
                            }}
                          />
                        </Box>
                        {daysUntilStockout !== undefined && (
                          <Typography variant="caption" display="block" color="warning.main" mt={0.5}>
                            {daysUntilStockout === 0
                              ? 'Out of stock'
                              : daysUntilStockout < 7
                              ? `${daysUntilStockout} days until stockout`
                              : `${daysUntilStockout} days remaining`}
                          </Typography>
                        )}
                        {product.metrics?.daily_average_sales > 0 && (
                          <Typography variant="caption" display="block" color="text.secondary" mt={0.5}>
                            Avg. daily sales: {product.metrics.daily_average_sales.toFixed(1)} units
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < products.slice(0, 10).length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            );
          })}
        </List>
        {products.length > 10 && (
          <Box p={2} textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Showing 10 of {products.length} low stock items
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LowStockAlerts;