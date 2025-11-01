/**
 * Segment Badge Component
 * Display customer segment with appropriate styling
 */

import React from 'react';
import { Chip } from '@mui/material';
import {
  EmojiEvents,
  Favorite,
  TrendingUp,
  Warning,
  RemoveCircle,
} from '@mui/icons-material';

const SegmentBadge = ({ segment, size = 'medium' }) => {
  const getSegmentConfig = (seg) => {
    switch (seg) {
      case 'Champions':
        return {
          color: 'success',
          icon: <EmojiEvents />,
          label: 'Champions'
        };
      case 'Loyal':
        return {
          color: 'primary',
          icon: <Favorite />,
          label: 'Loyal'
        };
      case 'Potential':
        return {
          color: 'info',
          icon: <TrendingUp />,
          label: 'Potential'
        };
      case 'At Risk':
        return {
          color: 'warning',
          icon: <Warning />,
          label: 'At Risk'
        };
      case 'Lost':
        return {
          color: 'error',
          icon: <RemoveCircle />,
          label: 'Lost'
        };
      default:
        return {
          color: 'default',
          icon: null,
          label: seg || 'Unknown'
        };
    }
  };

  const config = getSegmentConfig(segment);

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size={size}
      sx={{ fontWeight: 'bold' }}
    />
  );
};

export default SegmentBadge;