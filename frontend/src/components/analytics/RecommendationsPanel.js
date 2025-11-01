/**
 * Recommendations Panel Component
 * Display personalized product recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Button,
  CardMedia,
  CardActions,
} from '@mui/material';
import {
  Recommend,
  ShoppingCart,
  Star,
} from '@mui/icons-material';
import api from '../../services/api';

const RecommendationsPanel = ({ customerId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (customerId) {
      fetchRecommendations();
    }
  }, [customerId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      console.log(`🔄 Fetching recommendations for customer ${customerId}...`);
      
      const response = await api.analytics.getRecommendations(customerId, 5);
      console.log('🎯 Recommendations Response:', response);
      
      let recommendationData = response.data;
      
      // CRITICAL: Parse if stringified
      if (typeof recommendationData === 'string') {
        console.warn('⚠️ Recommendations data is stringified, parsing...');
        try {
          recommendationData = JSON.parse(recommendationData);
        } catch (e) {
          console.error('❌ Failed to parse recommendations');
          setError('Invalid data format');
          setRecommendations([]);
          setLoading(false);
          return;
        }
      }
      
      // Ensure it's an array
      if (Array.isArray(recommendationData)) {
        console.log(`✅ Loaded ${recommendationData.length} recommendations`);
        setRecommendations(recommendationData);
      } else {
        console.warn('⚠️ Recommendations is not an array:', recommendationData);
        setRecommendations([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching recommendations:', err);
      setError('Failed to load recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // Safety check before rendering
  if (!Array.isArray(recommendations)) {
    console.error('❌ Recommendations is not an array at render time:', recommendations);
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            Unable to display recommendations. Invalid data format.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Recommend color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Recommended For You
            </Typography>
          </Box>
          <Alert severity="info">
            No recommendations available yet. Purchase history is needed to generate recommendations.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getRecommendationTypeColor = (type) => {
    if (type.includes('affinity')) return 'primary';
    if (type.includes('collaborative')) return 'secondary';
    if (type.includes('segment')) return 'success';
    return 'default';
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Recommend color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Recommended For You
          </Typography>
        </Box>

        <Grid container spacing={2}>
          {recommendations.map((rec, index) => (
            <Grid item xs={12} sm={6} md={4} key={rec.product?.id || index}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="div"
                  sx={{
                    height: 140,
                    bgcolor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShoppingCart sx={{ fontSize: 60, color: 'grey.400' }} />
                </CardMedia>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom noWrap>
                    {rec.product?.name || 'Unknown Product'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {rec.product?.category || 'No category'}
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    ${parseFloat(rec.product?.price || 0).toFixed(2)}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <Star fontSize="small" color="warning" />
                    <Typography variant="body2" fontWeight="bold">
                      {(rec.recommendation_score || 0).toFixed(0)}% Match
                    </Typography>
                  </Box>

                  {rec.recommendation_types && Array.isArray(rec.recommendation_types) && (
                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
                      {rec.recommendation_types.map((type, idx) => (
                        <Chip
                          key={idx}
                          label={type}
                          size="small"
                          color={getRecommendationTypeColor(type)}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}

                  {rec.reasons && Array.isArray(rec.reasons) && rec.reasons[0] && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {rec.reasons[0]}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" variant="contained" fullWidth>
                    Add to Cart
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default RecommendationsPanel;