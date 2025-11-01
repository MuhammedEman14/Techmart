/**
 * TransactionsTable Component
 * Comprehensive transactions table with customer segment filtering, fraud detection, pagination, sorting, search, and export
 */

import React, { useState, useEffect } from 'react';
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
  TablePagination,
  TableSortLabel,
  TextField,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  FileDownload,
  Visibility,
  Search as SearchIcon,
  People,
  TrendingUp,
  Close,
  Refresh,
  Security,
  Warning,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import api from '../services/api';

const TransactionsTable = ({ categoryFilter = null }) => {
  // State management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all'); // 'all', 'frequent_buyers', 'highest_spenders'
  const [fraudFilter, setFraudFilter] = useState('all'); // 'all', 'unusual_amounts', 'rapid_purchases', 'all_suspicious'
  
  // Sorting state
  const [orderBy, setOrderBy] = useState('timestamp');
  const [order, setOrder] = useState('desc');
  
  // UI state
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  /**
   * Fetch transactions from API
   */
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;

      // Handle fraud detection filtering
      if (fraudFilter !== 'all') {
        const fraudParams = {
          limit: rowsPerPage,
          days: 365, // Look at last 30 days for suspicious activity
          minRiskScore: 60, // Default minimum risk score
        };

        // Set fraud_type based on filter selection
        if (fraudFilter === 'unusual_amounts') {
          fraudParams.fraud_type = 'unusual_amount';
        } else if (fraudFilter === 'rapid_purchases') {
          fraudParams.fraud_type = 'rapid_purchase';
        } else if (fraudFilter === 'all_suspicious') {
          fraudParams.minRiskScore = 70; // Higher threshold for all suspicious
          // Don't set fraud_type to get all types
        }

        response = await api.transactions.getSuspicious(fraudParams);

        if (response.success && response.data) {
          // Extract suspicious transactions array
          const suspiciousArray = response.data.suspicious_transactions || [];
          
          // Transform suspicious transactions data
          const suspiciousData = suspiciousArray.map((transaction) => {
            // Handle customer object
            let customerName = 'N/A';
            if (transaction.customer) {
              if (typeof transaction.customer === 'string') {
                customerName = transaction.customer;
              } else {
                customerName = `${transaction.customer.first_name || ''} ${transaction.customer.last_name || ''}`.trim() || 'N/A';
              }
            }

            // Handle product object
            let productName = 'N/A';
            if (transaction.product) {
              if (typeof transaction.product === 'string') {
                productName = transaction.product;
              } else {
                productName = transaction.product.name || 'N/A';
              }
            }

            return {
              id: transaction.id,
              customer: customerName,
              customer_email: transaction.customer?.email || 'N/A',
              product: productName,
              amount: transaction.total_amount || 0,
              status: transaction.status || 'unknown',
              payment_method: transaction.payment_method || 'N/A',
              timestamp: transaction.timestamp,
              risk_score: transaction.risk_score || 0,
              fraud_indicators: transaction.fraud_indicators || [],
              risk_level: transaction.risk_level || 'low',
              is_suspicious: true,
            };
          });

          setTransactions(suspiciousData);
          setTotalCount(suspiciousData.length);
        } else {
          setTransactions([]);
          setTotalCount(0);
        }
        return;
      }

      // Handle customer segment filtering
      if (segmentFilter !== 'all') {
        response = await api.transactions.getAll({ 
          segment: segmentFilter, 
          limit: rowsPerPage, 
          page: page + 1 
        });

        if (response.success && Array.isArray(response.data)) {
          const segmentData = response.data.map((item, index) => ({
            id: `segment-${index}`,
            customer: item.customer 
              ? `${item.customer.first_name || ''} ${item.customer.last_name || ''}`.trim() || 'N/A'
              : 'N/A',
            customer_email: item.customer?.email || 'N/A',
            loyalty_tier: item.customer?.loyalty_tier || 'N/A',
            total_spent: parseFloat(item.total_spent || 0),
            total_transactions: parseInt(item.total_transactions || item.transaction_count || 0),
            segment_type: segmentFilter,
          }));

          setTransactions(segmentData);
          setTotalCount(segmentData.length);
        } else {
          setTransactions([]);
          setTotalCount(0);
        }
        return;
      }

      // Normal transactions (no segment or fraud filter)
      const params = {
        limit: rowsPerPage,
        page: page + 1,
      };

      if (statusFilter !== 'all') params.status = statusFilter;
      if (paymentFilter !== 'all') params.payment_method = paymentFilter;

      response = await api.transactions.getAll(params);

      if (response.success) {
        const transformedData = (response.data || []).map((transaction) => {
          // Handle customer object
          let customerName = 'N/A';
          if (transaction.customer) {
            if (typeof transaction.customer === 'string') {
              customerName = transaction.customer;
            } else {
              customerName = `${transaction.customer.first_name || ''} ${transaction.customer.last_name || ''}`.trim() || 'N/A';
            }
          }

          // Handle product object
          let productName = 'N/A';
          if (transaction.product) {
            if (typeof transaction.product === 'string') {
              productName = transaction.product;
            } else {
              productName = transaction.product.name || 'N/A';
            }
          }

          return {
            id: transaction.id,
            customer: customerName,
            customer_email: transaction.customer?.email || 'N/A',
            product: productName,
            amount: transaction.total_amount || transaction.amount || 0,
            status: transaction.status || 'unknown',
            payment_method: transaction.payment_method || 'N/A',
            timestamp: transaction.timestamp,
          };
        });

        setTransactions(transformedData);
        setTotalCount(response.pagination?.total ?? transformedData.length);
      } else {
        setTransactions([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions. Please try again.');
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch data on mount and when filters change
   */
  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, statusFilter, paymentFilter, segmentFilter, fraudFilter]);

  /**
   * Reset to first page when filters change
   */
  useEffect(() => {
    setPage(0);
  }, [statusFilter, paymentFilter, segmentFilter, fraudFilter]);

  /**
   * Handle page change
   */
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  /**
   * Handle rows per page change
   */
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  /**
   * Handle sorting
   */
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  /**
   * Filter and sort data (client-side)
   */
  const getFilteredAndSortedData = () => {
    if (!transactions || !Array.isArray(transactions)) return [];

    let filtered = [...transactions];

    // Apply search filter
    if (searchTerm && segmentFilter === 'all' && fraudFilter === 'all') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((row) => {
        return (
          row.id?.toString().toLowerCase().includes(searchLower) ||
          (row.customer || '').toString().toLowerCase().includes(searchLower) ||
          (row.product || '').toString().toLowerCase().includes(searchLower) ||
          (row.customer_email || '').toString().toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (['amount', 'id', 'total_spent', 'total_transactions', 'risk_score'].includes(orderBy)) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }

      if (orderBy === 'timestamp') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredData = getFilteredAndSortedData();

  /**
   * Export to CSV
   */
  const exportToCSV = () => {
    let headers, csvData;

    if (fraudFilter !== 'all') {
      headers = ['ID', 'Customer', 'Product', 'Amount', 'Risk Score', 'Status', 'Fraud Indicators', 'Date'];
      csvData = filteredData.map((row) => [
        row.id,
        row.customer,
        row.product,
        row.amount,
        row.risk_score,
        row.status,
        (row.fraud_indicators || []).join('; '),
        row.timestamp,
      ]);
    } else if (segmentFilter !== 'all') {
      headers = ['Customer', 'Email', 'Loyalty Tier', 'Total Spent', 'Total Transactions'];
      csvData = filteredData.map((row) => [
        row.customer,
        row.customer_email,
        row.loyalty_tier,
        row.total_spent,
        row.total_transactions,
      ]);
    } else {
      headers = ['ID', 'Customer', 'Product', 'Amount', 'Status', 'Payment Method', 'Timestamp'];
      csvData = filteredData.map((row) => [
        row.id,
        row.customer,
        row.product,
        row.amount,
        row.status,
        row.payment_method,
        row.timestamp,
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${fraudFilter !== 'all' ? fraudFilter : segmentFilter}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setExportMenuAnchor(null);
  };

  /**
   * Export to PDF
   */
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Transactions Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 30);
    
    if (fraudFilter !== 'all') {
      doc.text(`Fraud Filter: ${fraudFilter.replace('_', ' ')}`, 14, 36);
    } else if (segmentFilter !== 'all') {
      doc.text(`Segment: ${segmentFilter.replace('_', ' ')}`, 14, 36);
    }

    let tableData, headers;

    if (fraudFilter !== 'all') {
      headers = [['ID', 'Customer', 'Product', 'Amount', 'Risk', 'Status', 'Date']];
      tableData = filteredData.map((row) => [
        row.id,
        row.customer,
        row.product,
        `$${parseFloat(row.amount || 0).toFixed(2)}`,
        row.risk_score || 'N/A',
        row.status,
        row.timestamp ? format(new Date(row.timestamp), 'PP') : 'N/A',
      ]);
    } else if (segmentFilter !== 'all') {
      headers = [['Customer', 'Email', 'Tier', 'Total Spent', 'Transactions']];
      tableData = filteredData.map((row) => [
        row.customer,
        row.customer_email,
        row.loyalty_tier,
        `$${parseFloat(row.total_spent || 0).toFixed(2)}`,
        row.total_transactions,
      ]);
    } else {
      headers = [['ID', 'Customer', 'Product', 'Amount', 'Status', 'Payment', 'Date']];
      tableData = filteredData.map((row) => [
        row.id,
        row.customer,
        row.product,
        `$${parseFloat(row.amount || 0).toFixed(2)}`,
        row.status,
        row.payment_method,
        row.timestamp ? format(new Date(row.timestamp), 'PP') : 'N/A',
      ]);
    }

    doc.autoTable({
      startY: fraudFilter !== 'all' || segmentFilter !== 'all' ? 42 : 36,
      head: headers,
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`transactions_${fraudFilter !== 'all' ? fraudFilter : segmentFilter}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    setExportMenuAnchor(null);
  };

  /**
   * Get status chip color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  /**
   * Get risk score color
   */
  const getRiskScoreColor = (score) => {
    if (score >= 80) return 'error';
    if (score >= 60) return 'warning';
    return 'success';
  };

  /**
   * Get loyalty tier color
   */
  const getLoyaltyTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return 'primary';
      case 'gold':
        return 'warning';
      case 'silver':
        return 'default';
      case 'bronze':
        return 'error';
      default:
        return 'default';
    }
  };

  /**
   * Open transaction details
   */
  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setDetailsDialogOpen(true);
  };

  /**
   * Clear segment filter
   */
  const handleClearSegmentFilter = () => {
    setSegmentFilter('all');
  };

  /**
   * Clear fraud filter
   */
  const handleClearFraudFilter = () => {
    setFraudFilter('all');
  };

  /**
   * Render segment view (customer data)
   */
  const renderSegmentView = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'customer'}
                direction={orderBy === 'customer' ? order : 'asc'}
                onClick={() => handleSort('customer')}
              >
                Customer
              </TableSortLabel>
            </TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Loyalty Tier</TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={orderBy === 'total_spent'}
                direction={orderBy === 'total_spent' ? order : 'asc'}
                onClick={() => handleSort('total_spent')}
              >
                Total Spent
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={orderBy === 'total_transactions'}
                direction={orderBy === 'total_transactions' ? order : 'asc'}
                onClick={() => handleSort('total_transactions')}
              >
                Transactions
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map((row, index) => (
            <TableRow key={`${row.id}-${index}`} hover>
              <TableCell>
                <Typography variant="body2" fontWeight="medium">
                  {row.customer}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {row.customer_email}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={row.loyalty_tier || 'N/A'}
                  color={getLoyaltyTierColor(row.loyalty_tier)}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold" color="primary">
                  ${parseFloat(row.total_spent || 0).toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight="medium">
                  {row.total_transactions}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  /**
   * Render fraud detection view
   */
  const renderFraudView = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'id'}
                direction={orderBy === 'id' ? order : 'asc'}
                onClick={() => handleSort('id')}
              >
                ID
              </TableSortLabel>
            </TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Product</TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={orderBy === 'amount'}
                direction={orderBy === 'amount' ? order : 'asc'}
                onClick={() => handleSort('amount')}
              >
                Amount
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={orderBy === 'risk_score'}
                direction={orderBy === 'risk_score' ? order : 'asc'}
                onClick={() => handleSort('risk_score')}
              >
                Risk Score
              </TableSortLabel>
            </TableCell>
            <TableCell>Status</TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'timestamp'}
                direction={orderBy === 'timestamp' ? order : 'asc'}
                onClick={() => handleSort('timestamp')}
              >
                Date
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map((row) => (
            <TableRow 
              key={row.id} 
              hover 
              sx={{ 
                bgcolor: row.risk_score >= 80 ? 'rgba(211, 47, 47, 0.08)' : 'inherit'
              }}
            >
              <TableCell>#{row.id}</TableCell>
              <TableCell>{row.customer || 'N/A'}</TableCell>
              <TableCell>{row.product || 'N/A'}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                ${parseFloat(row.amount || 0).toFixed(2)}
              </TableCell>
              <TableCell align="right">
                <Chip
                  icon={<Security fontSize="small" />}
                  label={row.risk_score || 'N/A'}
                  color={getRiskScoreColor(row.risk_score)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={row.status}
                  color={getStatusColor(row.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {row.timestamp
                  ? format(new Date(row.timestamp), 'PP p')
                  : 'N/A'}
              </TableCell>
              <TableCell align="center">
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(row)}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  /**
   * Render transactions view (regular data)
   */
  const renderTransactionsView = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'id'}
                direction={orderBy === 'id' ? order : 'asc'}
                onClick={() => handleSort('id')}
              >
                ID
              </TableSortLabel>
            </TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Product</TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={orderBy === 'amount'}
                direction={orderBy === 'amount' ? order : 'asc'}
                onClick={() => handleSort('amount')}
              >
                Amount
              </TableSortLabel>
            </TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Payment</TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'timestamp'}
                direction={orderBy === 'timestamp' ? order : 'asc'}
                onClick={() => handleSort('timestamp')}
              >
                Date
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>#{row.id}</TableCell>
              <TableCell>{row.customer || 'N/A'}</TableCell>
              <TableCell>{row.product || 'N/A'}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                ${parseFloat(row.amount || 0).toFixed(2)}
              </TableCell>
              <TableCell>
                <Chip
                  label={row.status}
                  color={getStatusColor(row.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={row.payment_method?.replace('_', ' ')}
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {row.timestamp
                  ? format(new Date(row.timestamp), 'PP p')
                  : 'N/A'}
              </TableCell>
              <TableCell align="center">
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(row)}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (error) {
    return (
      <Card>
        <CardHeader title="All Transactions" />
        <CardContent>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={fetchTransactions}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getViewTitle = () => {
    if (fraudFilter !== 'all') return 'Suspicious Transactions';
    if (segmentFilter !== 'all') return 'Customer Segments';
    return 'All Transactions';
  };

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Typography variant="h6">{getViewTitle()}</Typography>
              {segmentFilter !== 'all' && (
                <Chip
                  icon={segmentFilter === 'frequent_buyers' ? <People /> : <TrendingUp />}
                  label={segmentFilter === 'frequent_buyers' ? 'Frequent Buyers' : 'Highest Spenders'}
                  color="primary"
                  size="small"
                  onDelete={handleClearSegmentFilter}
                />
              )}
              {fraudFilter !== 'all' && (
                <Chip
                  icon={<Warning />}
                  label={
                    fraudFilter === 'unusual_amounts' ? 'Unusual Amounts' : 
                    fraudFilter === 'rapid_purchases' ? 'Rapid Purchases' : 
                    'All Suspicious'
                  }
                  color="error"
                  size="small"
                  onDelete={handleClearFraudFilter}
                />
              )}
            </Box>
          }
          subheader={`${totalCount} ${fraudFilter !== 'all' ? 'suspicious transactions' : segmentFilter !== 'all' ? 'customers' : 'transactions'} found`}
          action={
            <Box display="flex" gap={1}>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={fetchTransactions} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Button
                startIcon={<FileDownload />}
                variant="outlined"
                size="small"
                onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                disabled={loading || filteredData.length === 0}
              >
                Export
              </Button>
            </Box>
          }
        />
        <CardContent>
          {/* Filters */}
          <Grid container spacing={2} mb={2}>
            {/* Customer Segment Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Customer Segment</InputLabel>
                <Select
                  value={segmentFilter}
                  label="Customer Segment"
                  onChange={(e) => {
                    setSegmentFilter(e.target.value);
                    if (e.target.value !== 'all') setFraudFilter('all');
                  }}
                  startAdornment={
                    segmentFilter !== 'all' && (
                      <Tooltip title="Clear filter">
                        <IconButton
                          size="small"
                          onClick={handleClearSegmentFilter}
                          sx={{ ml: -0.5, mr: 0.5 }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <MenuItem value="all">All Transactions</MenuItem>
                  <MenuItem value="frequent_buyers">
                    <Box display="flex" alignItems="center" gap={1}>
                      <People fontSize="small" />
                      Frequent Buyers
                    </Box>
                  </MenuItem>
                  <MenuItem value="highest_spenders">
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingUp fontSize="small" />
                      Highest Spenders
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Fraud Detection Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Fraud Detection</InputLabel>
                <Select
                  value={fraudFilter}
                  label="Fraud Detection"
                  onChange={(e) => {
                    setFraudFilter(e.target.value);
                    if (e.target.value !== 'all') setSegmentFilter('all');
                  }}
                  startAdornment={
                    fraudFilter !== 'all' && (
                      <Tooltip title="Clear filter">
                        <IconButton
                          size="small"
                          onClick={handleClearFraudFilter}
                          sx={{ ml: -0.5, mr: 0.5 }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  }
                >
                  <MenuItem value="all">No Fraud Filter</MenuItem>
                  <MenuItem value="unusual_amounts">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Warning fontSize="small" />
                      Unusual Amounts
                    </Box>
                  </MenuItem>
                  <MenuItem value="rapid_purchases">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Warning fontSize="small" />
                      Rapid Purchases
                    </Box>
                  </MenuItem>
                  <MenuItem value="all_suspicious">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Security fontSize="small" />
                      All Suspicious
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Show regular filters only when not in segment or fraud view */}
            {segmentFilter === 'all' && fraudFilter === 'all' && (
              <>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="failed">Failed</MenuItem>
                      <MenuItem value="refunded">Refunded</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Payment</InputLabel>
                    <Select
                      value={paymentFilter}
                      label="Payment"
                      onChange={(e) => setPaymentFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Methods</MenuItem>
                      <MenuItem value="credit_card">Credit Card</MenuItem>
                      <MenuItem value="debit_card">Debit Card</MenuItem>
                      <MenuItem value="paypal">PayPal</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>

          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : filteredData.length === 0 ? (
            <Box py={8}>
              <Alert severity="info">
                No {fraudFilter !== 'all' ? 'suspicious transactions' : segmentFilter !== 'all' ? 'customers' : 'transactions'} found with the current filters.
              </Alert>
            </Box>
          ) : (
            <>
              {/* Table */}
              {fraudFilter !== 'all' ? renderFraudView() : segmentFilter !== 'all' ? renderSegmentView() : renderTransactionsView()}

              {/* Pagination */}
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[25, 50, 100]}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
      >
        <MenuItem onClick={exportToCSV}>Export as CSV</MenuItem>
        <MenuItem onClick={exportToPDF}>Export as PDF</MenuItem>
      </Menu>

      {/* Transaction Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {fraudFilter !== 'all' ? 'Suspicious Transaction Details' : 'Transaction Details'}
        </DialogTitle>
        <DialogContent dividers>
          {selectedTransaction && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Transaction ID:</strong> #{selectedTransaction.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Customer:</strong> {selectedTransaction.customer || 'N/A'}
              </Typography>
              {selectedTransaction.customer_email && (
                <Typography variant="body2" gutterBottom>
                  <strong>Email:</strong> {selectedTransaction.customer_email}
                </Typography>
              )}
              {selectedTransaction.product && (
                <Typography variant="body2" gutterBottom>
                  <strong>Product:</strong> {selectedTransaction.product}
                </Typography>
              )}
              <Typography variant="body2" gutterBottom>
                <strong>Amount:</strong> ${parseFloat(selectedTransaction.amount || 0).toFixed(2)}
              </Typography>
              {selectedTransaction.risk_score !== undefined && (
                <Typography variant="body2" gutterBottom>
                  <strong>Risk Score:</strong>{' '}
                  <Chip
                    label={selectedTransaction.risk_score}
                    color={getRiskScoreColor(selectedTransaction.risk_score)}
                    size="small"
                  />
                </Typography>
              )}
              {selectedTransaction.fraud_indicators && selectedTransaction.fraud_indicators.length > 0 && (
                <Box mt={2}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Fraud Indicators:</strong>
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                    {selectedTransaction.fraud_indicators.map((indicator, idx) => (
                      <Chip
                        key={idx}
                        label={indicator.replace(/_/g, ' ')}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
              {selectedTransaction.status && (
                <Typography variant="body2" gutterBottom mt={2}>
                  <strong>Status:</strong>{' '}
                  <Chip
                    label={selectedTransaction.status}
                    color={getStatusColor(selectedTransaction.status)}
                    size="small"
                  />
                </Typography>
              )}
              {selectedTransaction.payment_method && (
                <Typography variant="body2" gutterBottom>
                  <strong>Payment Method:</strong> {selectedTransaction.payment_method?.replace('_', ' ')}
                </Typography>
              )}
              {selectedTransaction.timestamp && (
                <Typography variant="body2" gutterBottom>
                  <strong>Date:</strong> {format(new Date(selectedTransaction.timestamp), 'PPpp')}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TransactionsTable;