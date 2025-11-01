/**
 * A/B Test Manager Component
 * Create and manage A/B tests
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  Assessment,
  PlayArrow,
  Pause,
  CheckCircle,
  Visibility,
} from '@mui/icons-material';
import api from '../../services/api';

const ABTestManager = () => {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]); // Initialize as empty array
  const [selectedTest, setSelectedTest] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [openResults, setOpenResults] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    test_name: '',
    test_type: 'recommendation_algorithm',
    duration_days: 30,
    variant_a: { name: 'Control', description: '' },
    variant_b: { name: 'Experiment', description: '' },
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.abTests.getAll();
      console.log('A/B Tests Response:', response.data); // Debug
      
      // Safely handle response
      if (response.data && response.data) {
        setTests(Array.isArray(response.data) ? response.data : []);
      } else {
        setTests([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Failed to load A/B tests');
      setTests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };
  const handleCreateTest = async () => {
    try {
      await api.abTests.create(formData);
      setOpenCreate(false);
      fetchTests();
      // Reset form
      setFormData({
        test_name: '',
        test_type: 'recommendation_algorithm',
        duration_days: 30,
        variant_a: { name: 'Control', description: '' },
        variant_b: { name: 'Experiment', description: '' },
      });
    } catch (err) {
      console.error('Error creating test:', err);
      alert('Failed to create test');
    }
  };

  const handleViewResults = async (test) => {
    try {
      const response = await api.abTests.getResults(test.id);
      setTestResults(response.data);
      setSelectedTest(test);
      setOpenResults(true);
    } catch (err) {
      console.error('Error fetching test results:', err);
      alert('Failed to load test results');
    }
  };

  const handlePauseTest = async (testId) => {
    try {
      await api.abTests.pause(testId);
      fetchTests();
    } catch (err) {
      console.error('Error pausing test:', err);
    }
  };

  const handleResumeTest = async (testId) => {
    try {
      await api.abTests.resume(testId);
      fetchTests();
    } catch (err) {
      console.error('Error resuming test:', err);
    }
  };

  const handleCompleteTest = async (testId) => {
    try {
      await api.abTests.complete(testId);
      fetchTests();
    } catch (err) {
      console.error('Error completing test:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            A/B Testing
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage experiments to optimize customer experience
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenCreate(true)}
        >
          Create New Test
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tests Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Test Name</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Duration</strong></TableCell>
              <TableCell><strong>Customers</strong></TableCell>
              <TableCell><strong>Conversions</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box py={4}>
                    <Typography color="text.secondary">
                      No A/B tests yet. Create your first test to get started!
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>{test.test_name}</TableCell>
                  <TableCell>
                    <Chip label={test.test_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={test.status.toUpperCase()}
                      size="small"
                      color={getStatusColor(test.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(test.start_date).toLocaleDateString()} -{' '}
                    {new Date(test.end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {(test.metrics?.variant_a?.customers || 0) +
                      (test.metrics?.variant_b?.customers || 0)}
                  </TableCell>
                  <TableCell>
                    {(test.metrics?.variant_a?.conversions || 0) +
                      (test.metrics?.variant_b?.conversions || 0)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleViewResults(test)}
                      color="primary"
                    >
                      <Visibility />
                    </IconButton>
                    {test.status === 'active' && (
                      <IconButton
                        size="small"
                        onClick={() => handlePauseTest(test.id)}
                        color="warning"
                      >
                        <Pause />
                      </IconButton>
                    )}
                    {test.status === 'paused' && (
                      <IconButton
                        size="small"
                        onClick={() => handleResumeTest(test.id)}
                        color="success"
                      >
                        <PlayArrow />
                      </IconButton>
                    )}
                    {test.status === 'active' && (
                      <IconButton
                        size="small"
                        onClick={() => handleCompleteTest(test.id)}
                        color="default"
                      >
                        <CheckCircle />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Test Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New A/B Test</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Test Name"
                  value={formData.test_name}
                  onChange={(e) =>
                    setFormData({ ...formData, test_name: e.target.value })
                  }
                  placeholder="e.g., Recommendation Algorithm Test"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Test Type</InputLabel>
                  <Select
                    value={formData.test_type}
                    label="Test Type"
                    onChange={(e) =>
                      setFormData({ ...formData, test_type: e.target.value })
                    }
                  >
                    <MenuItem value="recommendation_algorithm">
                      Recommendation Algorithm
                    </MenuItem>
                    <MenuItem value="pricing_strategy">Pricing Strategy</MenuItem>
                    <MenuItem value="discount_percentage">Discount Percentage</MenuItem>
                    <MenuItem value="ui_variant">UI Variant</MenuItem>
                    <MenuItem value="email_campaign">Email Campaign</MenuItem>
                    <MenuItem value="loyalty_reward">Loyalty Reward</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Duration (days)"
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_days: parseInt(e.target.value) })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Variant A (Control)
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.variant_a.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      variant_a: { ...formData.variant_a, name: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.variant_a.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      variant_a: { ...formData.variant_a, description: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Variant B (Experiment)
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.variant_b.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      variant_b: { ...formData.variant_b, name: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.variant_b.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      variant_b: { ...formData.variant_b, description: e.target.value },
                    })
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateTest}
            disabled={!formData.test_name}
          >
            Create Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Results Dialog */}
      <Dialog
        open={openResults}
        onClose={() => setOpenResults(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Assessment color="primary" />
            Test Results: {selectedTest?.test_name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {testResults && (
            <Box sx={{ pt: 2 }}>
              {/* Winner Banner */}
              {testResults.analysis.winner !== 'inconclusive' && (
                <Alert
                  severity={
                    testResults.analysis.winner === 'variant_b' ? 'success' : 'info'
                  }
                  sx={{ mb: 3 }}
                  icon={<CheckCircle />}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {testResults.analysis.recommendation}
                  </Typography>
                  <Typography variant="body2">
                    Confidence: {testResults.analysis.confidence}%
                  </Typography>
                </Alert>
              )}

              {/* Metrics Comparison */}
              <Grid container spacing={3}>
                {/* Variant A */}
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        {testResults.variant_a.config.name}
                      </Typography>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Customers
                        </Typography>
                        <Typography variant="h4">
                          {testResults.variant_a.customers}
                        </Typography>
                      </Box>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Conversions
                        </Typography>
                        <Typography variant="h5">
                          {testResults.variant_a.conversions}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={testResults.variant_a.conversion_rate}
                          sx={{ mt: 1 }}
                        />
                        <Typography variant="caption">
                          {testResults.variant_a.conversion_rate}% conversion rate
                        </Typography>
                      </Box>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Revenue
                        </Typography>
                        <Typography variant="h6">
                          ${testResults.variant_a.revenue.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg: ${testResults.variant_a.avg_revenue.toFixed(2)}/customer
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Engagement Score
                        </Typography>
                        <Typography variant="body1">
                          {testResults.variant_a.engagement_score.toFixed(2)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Variant B */}
                <Grid item xs={12} sm={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="secondary">
                        {testResults.variant_b.config.name}
                      </Typography>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Customers
                        </Typography>
                        <Typography variant="h4">
                          {testResults.variant_b.customers}
                        </Typography>
                      </Box>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Conversions
                        </Typography>
                        <Typography variant="h5">
                          {testResults.variant_b.conversions}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={testResults.variant_b.conversion_rate}
                          color="secondary"
                          sx={{ mt: 1 }}
                        />
                        <Typography variant="caption">
                          {testResults.variant_b.conversion_rate}% conversion rate
                        </Typography>
                      </Box>
                      <Box mb={2}>
                        <Typography variant="body2" color="text.secondary">
                          Revenue
                        </Typography>
                        <Typography variant="h6">
                          ${testResults.variant_b.revenue.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg: ${testResults.variant_b.avg_revenue.toFixed(2)}/customer
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Engagement Score
                        </Typography>
                        <Typography variant="body1">
                          {testResults.variant_b.engagement_score.toFixed(2)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Lift Metrics */}
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Performance Lift
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Conversion Lift
                          </Typography>
                          <Typography
                            variant="h5"
                            color={
                              testResults.analysis.conversion_lift > 0
                                ? 'success.main'
                                : 'error.main'
                            }
                          >
                            {testResults.analysis.conversion_lift > 0 ? '+' : ''}
                            {testResults.analysis.conversion_lift}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Revenue Lift
                          </Typography>
                          <Typography
                            variant="h5"
                            color={
                              testResults.analysis.revenue_lift > 0
                                ? 'success.main'
                                : 'error.main'
                            }
                          >
                            {testResults.analysis.revenue_lift > 0 ? '+' : ''}
                            {testResults.analysis.revenue_lift}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResults(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ABTestManager;