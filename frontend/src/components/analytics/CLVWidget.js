/**
 * Customer Lifetime Value Widget
 * Display predicted CLV with confidence meter
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  CheckCircle,
  Info,
} from '@mui/icons-material';

const CLVWidget = ({ clvData }) => {
  if (!clvData) {
    return null;
  }

  const {
    clv_predicted,
    clv_confidence,
    metrics,
  } = clvData;

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'info';
    if (confidence >= 40) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Medium Confidence';
    if (confidence >= 40) return 'Low Confidence';
    return 'Very Low Confidence';
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Predicted Lifetime Value
          </Typography>
          <TrendingUp color="primary" />
        </Box>

        <Box mb={3}>
          <Typography variant="h3" color="primary" fontWeight="bold">
            ${parseFloat(clv_predicted || 0).toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Expected revenue over lifetime
          </Typography>
        </Box>

        <Box mb={3}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body2" fontWeight="medium">
              Prediction Confidence
            </Typography>
            <Chip
              label={getConfidenceLabel(clv_confidence)}
              color={getConfidenceColor(clv_confidence)}
              size="small"
              icon={<CheckCircle />}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={clv_confidence}
            color={getConfidenceColor(clv_confidence)}
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {clv_confidence}% confidence
          </Typography>
        </Box>

        {metrics && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Avg Order Value
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  ${parseFloat(metrics.average_order_value || 0).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Purchase Frequency
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {parseFloat(metrics.purchase_frequency || 0).toFixed(2)}/month
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Spent
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  ${parseFloat(metrics.total_spent || 0).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Orders
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {metrics.total_orders || 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default CLVWidget;