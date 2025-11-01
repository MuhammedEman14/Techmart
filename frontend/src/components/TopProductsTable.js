/**
 * TopProductsTable Component
 * Displays top-selling products with stock status indicators
 */

import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';

const TopProductsTable = ({ data, loading, error }) => {
  // Get stock status color and icon
  const getStockStatus = (stockQuantity) => {
    if (stockQuantity === 0) {
      return { color: 'error', icon: <ErrorIcon fontSize="small" />, label: 'Out of Stock' };
    } else if (stockQuantity <= 10) {
      return { color: 'warning', icon: <Warning fontSize="small" />, label: 'Low Stock' };
    } else {
      return { color: 'success', icon: <CheckCircle fontSize="small" />, label: 'In Stock' };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Top Products" />
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
      <Card>
        <CardHeader title="Top Products" />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader title="Top Products" />
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center" py={4}>
            No product data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Top Products"
        subheader="Best selling products in the selected period"
      />
      <CardContent sx={{ p: 0 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell align="right"><strong>Quantity Sold</strong></TableCell>
                <TableCell align="right"><strong>Revenue</strong></TableCell>
                <TableCell align="center"><strong>Stock Status</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item, index) => {
                const product = item.product || {};
                const stockStatus = getStockStatus(product.stock_quantity || 0);
                
                return (
                  <TableRow
                    key={product.id || index}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {product.name || 'Unknown Product'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ${parseFloat(product.price || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.category || 'N/A'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {item.quantity_sold || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="primary">
                        ${parseFloat(item.revenue || 0).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={stockStatus.icon}
                        label={`${product.stock_quantity || 0} ${stockStatus.label}`}
                        color={stockStatus.color}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TopProductsTable;