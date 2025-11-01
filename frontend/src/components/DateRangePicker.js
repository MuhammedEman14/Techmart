/**
 * DateRangePicker Component
 * Custom date range selector with presets
 */

import React from 'react';
import {
  Box,
  TextField,
  Button,
  ButtonGroup,
  Paper,
  Typography,
} from '@mui/material';
import { DateRange } from '@mui/icons-material';

const DateRangePicker = ({ startDate, endDate, onDateChange, onPresetSelect }) => {
  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'This Month', value: 'month' },
    { label: 'All Time', value: 'all' },
  ];

  const handlePresetClick = (preset) => {
    const end = new Date();
    let start = new Date();

    switch (preset) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'all':
        onPresetSelect(null, null);
        return;
      default:
        break;
    }

    onPresetSelect(start.toISOString(), end.toISOString());
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <DateRange color="primary" />
          <Typography variant="subtitle2" fontWeight="bold">
            Filter by Date:
          </Typography>
        </Box>

        <ButtonGroup size="small" variant="outlined" sx={{ flexWrap: 'wrap' }}>
          {presets.map((preset) => (
            <Button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              sx={{ textTransform: 'none' }}
            >
              {preset.label}
            </Button>
          ))}
        </ButtonGroup>

        <Box display="flex" gap={2} flexGrow={1} flexDirection={{ xs: 'column', sm: 'row' }}>
          <TextField
            type="datetime-local"
            label="Start Date"
            size="small"
            value={startDate ? new Date(startDate).toISOString().slice(0, 16) : ''}
            onChange={(e) => onDateChange(e.target.value ? new Date(e.target.value).toISOString() : null, endDate)}
            InputLabelProps={{ shrink: true }}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            type="datetime-local"
            label="End Date"
            size="small"
            value={endDate ? new Date(endDate).toISOString().slice(0, 16) : ''}
            onChange={(e) => onDateChange(startDate, e.target.value ? new Date(e.target.value).toISOString() : null)}
            InputLabelProps={{ shrink: true }}
            sx={{ flexGrow: 1 }}
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default DateRangePicker;