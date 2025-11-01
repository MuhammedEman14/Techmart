/**
 * RFM Score Card Component
 * Visualize RFM scores with progress bars
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Divider,
} from '@mui/material';
import {
  Schedule,
  Repeat,
  AttachMoney,
} from '@mui/icons-material';

const RFMScoreCard = ({ rfmData }) => {
  if (!rfmData) {
    return null;
  }

  const {
    recency_score,
    frequency_score,
    monetary_score,
    rfm_score,
    recency_days,
    frequency_count,
    monetary_value,
  } = rfmData;

  const getScoreColor = (score) => {
    if (score >= 4) return 'success';
    if (score >= 3) return 'info';
    if (score >= 2) return 'warning';
    return 'error';
  };

  const ScoreBar = ({ label, score, value, icon, maxScore = 5 }) => (
    <Box mb={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
        <Box display="flex" alignItems="center" gap={1}>
          {icon}
          <Typography variant="body2" fontWeight="medium">
            {label}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {value}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={(score / maxScore) * 100}
        color={getScoreColor(score)}
        sx={{ height: 8, borderRadius: 1 }}
      />
      <Typography variant="caption" color="text.secondary">
        Score: {score}/{maxScore}
      </Typography>
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          RFM Analysis
        </Typography>

        <Box mb={3}>
          <Typography variant="h3" color="primary" fontWeight="bold">
            {rfm_score}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Combined RFM Score (out of 15)
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <ScoreBar
          label="Recency"
          score={recency_score}
          value={`${recency_days} days ago`}
          icon={<Schedule fontSize="small" color="primary" />}
        />

        <ScoreBar
          label="Frequency"
          score={frequency_score}
          value={`${frequency_count} purchases`}
          icon={<Repeat fontSize="small" color="primary" />}
        />

        <ScoreBar
          label="Monetary"
          score={monetary_score}
          value={`$${parseFloat(monetary_value || 0).toFixed(2)}`}
          icon={<AttachMoney fontSize="small" color="primary" />}
        />
      </CardContent>
    </Card>
  );
};

export default RFMScoreCard;