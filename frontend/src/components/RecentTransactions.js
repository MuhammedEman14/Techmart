/**
 * RecentTransactions Component
 * Displays recent transactions feed with risk indicators
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
} from '@mui/material';
import {
  ShoppingCart,
  CheckCircle,
  HourglassEmpty,
  Error as ErrorIcon,
  Replay,
  Security,
  WarningAmber,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const RecentTransactions = ({ data, loading, error }) => {
  // Get status icon and color
  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { icon: <CheckCircle />, color: 'success', label: 'Completed' };
      case 'pending':
        return { icon: <HourglassEmpty />, color: 'warning', label: 'Pending' };
      case 'failed':
        return { icon: <ErrorIcon />, color: 'error', label: 'Failed' };
      case 'refunded':
        return { icon: <Replay />, color: 'info', label: 'Refunded' };
      default:
        return { icon: <ShoppingCart />, color: 'default', label: status };
    }
  };

  // Get risk indicator
  const getRiskIndicator = (amount) => {
    // Simple risk heuristic based on amount
    const value = parseFloat(amount || 0);
    if (value > 5000) {
      return { icon: <Security fontSize="small" />, color: 'error', label: 'High Risk' };
    } else if (value > 2000) {
      return { icon: <WarningAmber fontSize="small" />, color: 'warning', label: 'Medium Risk' };
    }
    return null;
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Recent Transactions" />
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
        <CardHeader title="Recent Transactions" />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Recent Transactions" />
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center" py={4}>
            No recent transactions
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Recent Transactions"
        subheader="Latest customer transactions"
      />
      <CardContent sx={{ p: 0, maxHeight: 500, overflow: 'auto' }}>
        <List>
          {data.map((transaction, index) => {
            const statusConfig = getStatusConfig(transaction.status);
            const riskIndicator = getRiskIndicator(transaction.amount);
            const timeAgo = transaction.timestamp 
              ? formatDistanceToNow(new Date(transaction.timestamp), { addSuffix: true })
              : 'Unknown time';

            return (
              <React.Fragment key={transaction.id || index}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${statusConfig.color}.light` }}>
                      {statusConfig.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight="medium">
                          {transaction.customer || 'Unknown Customer'}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          ${parseFloat(transaction.amount || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box mt={0.5}>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {transaction.product || 'Unknown Product'} • {timeAgo}
                        </Typography>
                        <Box display="flex" gap={1} mt={1}>
                          <Chip
                            size="small"
                            label={statusConfig.label}
                            color={statusConfig.color}
                            variant="outlined"
                          />
                          {riskIndicator && (
                            <Chip
                              size="small"
                              icon={riskIndicator.icon}
                              label={riskIndicator.label}
                              color={riskIndicator.color}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < data.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            );
          })}
        </List>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;