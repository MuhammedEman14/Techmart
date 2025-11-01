/**
 * FilterBar Component
 * Provides date range, category, and customer segment filters for the dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import api from '../services/api';

const FilterBar = ({ onFilterChange, initialFilters = {} }) => {
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || '',
    category: initialFilters.category || '',
    segment: initialFilters.segment || '',
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.inventory.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    onFilterChange(filters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      startDate: '',
      endDate: '',
      category: '',
      segment: '',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value !== '');
  };

  return (
    <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'white',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <FilterList />
          <span>Filters</span>
          {hasActiveFilters() && (
            <Chip
              label={Object.values(filters).filter(v => v).length}
              size="small"
              color="secondary"
            />
          )}
        </Box>
        <IconButton size="small" sx={{ color: 'white' }}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Date Range */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Product Category */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                fullWidth
                size="small"
                options={categories}
                value={filters.category}
                onChange={(event, newValue) => handleFilterChange('category', newValue || '')}
                renderInput={(params) => (
                  <TextField {...params} label="Product Category" />
                )}
                freeSolo
              />
            </Grid>

            {/* Customer Segment */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Customer Segment</InputLabel>
                <Select
                  value={filters.segment}
                  label="Customer Segment"
                  onChange={(e) => handleFilterChange('segment', e.target.value)}
                >
                  <MenuItem value="">All Customers</MenuItem>
                  <MenuItem value="frequent_buyers">Frequent Buyers</MenuItem>
                  <MenuItem value="highest_spenders">Highest Spenders</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearFilters}
                  disabled={!hasActiveFilters()}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  startIcon={<FilterList />}
                  onClick={applyFilters}
                >
                  Apply Filters
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <Box mt={2} display="flex" gap={1} flexWrap="wrap">
              {filters.startDate && (
                <Chip
                  label={`From: ${new Date(filters.startDate).toLocaleDateString()}`}
                  size="small"
                  onDelete={() => handleFilterChange('startDate', '')}
                />
              )}
              {filters.endDate && (
                <Chip
                  label={`To: ${new Date(filters.endDate).toLocaleDateString()}`}
                  size="small"
                  onDelete={() => handleFilterChange('endDate', '')}
                />
              )}
              {filters.category && (
                <Chip
                  label={`Category: ${filters.category}`}
                  size="small"
                  onDelete={() => handleFilterChange('category', '')}
                />
              )}
              {filters.segment && (
                <Chip
                  label={`Segment: ${filters.segment.replace('_', ' ')}`}
                  size="small"
                  onDelete={() => handleFilterChange('segment', '')}
                />
              )}
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

export default FilterBar;