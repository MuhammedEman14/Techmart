/**
 * Churn Risk Widget
 * Display churn risk score with prevention strategies
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Warning,
  CheckCircle,
  ErrorOutline,
  Lightbulb,
} from '@mui/icons-material';

const ChurnRiskWidget = ({ churnData }) => {
  if (!churnData) {
    return null;
  }

  const {
    churn_risk_score,
    churn_risk_level,
    churn_indicators,
    prevention_strategies,
    days_since_last_purchase,
  } = churnData;

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <ErrorOutline />;
      case 'medium':
        return <Warning />;
      case 'low':
        return <CheckCircle />;
      default:
        return <CheckCircle />;
    }
  };

  const formatIndicator = (indicator) => {
    return indicator.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatStrategy = (strategy) => {
    return strategy.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Churn Risk Analysis
        </Typography>

        <Box display="flex" alignItems="center" justifyContent="center" mb={3}>
          <Box position="relative" display="inline-flex">
            <CircularProgress
              variant="determinate"
              value={churn_risk_score}
              size={120}
              thickness={6}
              color={getRiskColor(churn_risk_level)}
            />
            <Box
              position="absolute"
              top={0}
              left={0}
              bottom={0}
              right={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexDirection="column"
            >
              <Typography variant="h4" component="div" fontWeight="bold">
                {churn_risk_score}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Risk Score
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box display="flex" justifyContent="center" mb={3}>
          <Chip
            icon={getRiskIcon(churn_risk_level)}
            label={`${churn_risk_level.toUpperCase()} RISK`}
            color={getRiskColor(churn_risk_level)}
            size="medium"
          />
        </Box>

        <Alert 
          severity={getRiskColor(churn_risk_level)} 
          icon={getRiskIcon(churn_risk_level)}
          sx={{ mb: 2 }}
        >
          Last purchase: {days_since_last_purchase} days ago
        </Alert>

        {churn_indicators && churn_indicators.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Risk Factors:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {churn_indicators.map((indicator, index) => (
                <Chip
                  key={index}
                  label={formatIndicator(indicator)}
                  size="small"
                  variant="outlined"
                  color={getRiskColor(churn_risk_level)}
                />
              ))}
            </Box>
          </Box>
        )}

        {prevention_strategies && prevention_strategies.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold" display="flex" alignItems="center" gap={1}>
              <Lightbulb fontSize="small" color="warning" />
              Prevention Strategies:
            </Typography>
            <List dense>
              {prevention_strategies.slice(0, 3).map((strategy, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CheckCircle fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={formatStrategy(strategy)}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ChurnRiskWidget;