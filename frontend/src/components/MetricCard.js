/**
 * MetricCard Component
 * Displays individual metric cards with icon, value, and change indicator
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';

const MetricCard = ({ title, value, change, icon: Icon, color = 'primary' }) => {
  // Determine trend icon and color
  const getTrendIcon = () => {
    if (!change) return <TrendingFlat fontSize="small" />;
    if (change > 0) return <TrendingUp fontSize="small" />;
    return <TrendingDown fontSize="small" />;
  };

  const getTrendColor = () => {
    if (!change) return 'default';
    if (change > 0) return 'success';
    return 'error';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          {Icon && (
            <Icon
              sx={{
                color: `${color}.main`,
                fontSize: 32,
                opacity: 0.8,
              }}
            />
          )}
        </Box>

        <Typography variant="h4" component="div" fontWeight="bold" gutterBottom>
          {value}
        </Typography>

        {change !== undefined && change !== null && (
          <Chip
            icon={getTrendIcon()}
            label={`${change > 0 ? '+' : ''}${change}%`}
            color={getTrendColor()}
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;