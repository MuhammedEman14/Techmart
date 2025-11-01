/**
 * API Service
 * Centralized HTTP client for backend API communication
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

const api = {
  /**
   * Dashboard API
   */
  dashboard: {
    // Get dashboard overview
    getOverview: (hours = null, startDate = null, endDate = null, category = null) => {
      const params = {};
      if (hours) params.hours = hours;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (category) params.category = category;
      return apiClient.get('/dashboard/overview', { params });
    },
  },

  /**
   * Transactions API
   */
  transactions: {
    // Get all transactions with filters
    getAll: (params = {}) => {
      return apiClient.get('/transactions', { params });
    },

    // Get transaction by ID
    getById: (id) => {
      return apiClient.get(`/transactions/${id}`);
    },

    // Create new transaction
    create: (transactionData) => {
      return apiClient.post('/transactions', transactionData);
    },

    // Get suspicious transactions
    getSuspicious: (params = {}) => {
      return apiClient.get('/transactions/suspicious', { params });
    },
  },

  /**
   * Inventory API
   */
  inventory: {
    // Get low stock products
    getLowStock: (threshold = 100, category = null) => {
      const params = { threshold };
      if (category) params.category = category;
      return apiClient.get('/inventory/low-stock', { params });
    },

    // Get inventory value
    getValue: () => {
      return apiClient.get('/inventory/value');
    },

    // Update stock quantity
    updateStock: (productId, quantity, operation) => {
      return apiClient.put(`/inventory/stock/${productId}`, { quantity, operation });
    },

    // Get product categories
    getCategories: () => {
      return apiClient.get('/inventory/categories');
    },

    // Get products by category
    getProductsByCategory: (categoryName) => {
      return apiClient.get(`/inventory/category/${categoryName}`);
    },
  },

  /**
   * Analytics API
   */
  analytics: {
    // Existing analytics endpoints
    // Get hourly sales data
    getHourlySales: (startDate, endDate, interval = 'hour', category = null) => {
      const params = { interval };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (category) params.category = category;
      return apiClient.get('/analytics/hourly-sales', { params });
    },

    // Get category sales
    getCategorySales: (startDate, endDate, limit = 100) => {
      const params = { limit };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      return apiClient.get('/analytics/category-sales', { params });
    },

    // NEW: dashboard endpoint (higher-level)
    getDashboard: () => apiClient.get('/analytics/dashboard'),

    // Customer Analytics
    getCustomerComplete: (customerId) => 
      apiClient.get(`/analytics/customer/${customerId}/complete`),
    getCustomerRFM: (customerId) => 
      apiClient.get(`/analytics/customer/${customerId}/rfm`),
    getCustomerCLV: (customerId) => 
      apiClient.get(`/analytics/customer/${customerId}/clv`),
    getCustomerChurn: (customerId) => 
      apiClient.get(`/analytics/customer/${customerId}/churn`),

    // Segments
    getSegmentsOverview: () => apiClient.get('/analytics/segments/overview'),

    // Customer Lists
    getTopCLVCustomers: (limit = 10) => 
      apiClient.get(`/analytics/customers/top-clv?limit=${limit}`),
    getHighRiskCustomers: (limit = 20) => 
      apiClient.get(`/analytics/customers/high-risk?limit=${limit}`),

    // Recommendations
    getRecommendations: (customerId, limit = 5) => 
      apiClient.get(`/analytics/recommendations/${customerId}?limit=${limit}`),
    getProductCrossSell: (productId, limit = 5) => 
      apiClient.get(`/analytics/recommendations/product/${productId}/cross-sell?limit=${limit}`),

    // Admin - trigger all analytics
    calculateAll: () => apiClient.post('/analytics/calculate-all'),
  },

  /**
   * Alerts API
   */
  alerts: {
    // Get all alerts
    getAll: (params = {}) => {
      return apiClient.get('/alerts', { params });
    },

    // Get alert by ID
    getById: (id) => {
      return apiClient.get(`/alerts/${id}`);
    },

    // Create new alert
    create: (alertData) => {
      return apiClient.post('/alerts', alertData);
    },

    // Acknowledge alert
    acknowledge: (id) => {
      return apiClient.patch(`/alerts/${id}/acknowledge`);
    },

    // Delete alert
    delete: (id) => {
      return apiClient.delete(`/alerts/${id}`);
    },
  },

  /**
   * A/B Testing API
   */
  abTests: {
    getAll: () => apiClient.get('/ab-tests'),
    getById: (testId) => apiClient.get(`/ab-tests/${testId}`),
    getResults: (testId) => apiClient.get(`/ab-tests/${testId}/results`),
    create: (testData) => apiClient.post('/ab-tests', testData),
    assignCustomer: (testId, customerId) => 
      apiClient.post(`/ab-tests/${testId}/assign/${customerId}`),
    trackConversion: (testId, data) => 
      apiClient.post(`/ab-tests/${testId}/conversion`, data),
    trackEngagement: (testId, data) => 
      apiClient.post(`/ab-tests/${testId}/engagement`, data),
    complete: (testId) => apiClient.post(`/ab-tests/${testId}/complete`),
    pause: (testId) => apiClient.post(`/ab-tests/${testId}/pause`),
    resume: (testId) => apiClient.post(`/ab-tests/${testId}/resume`),
  },

  /**
   * Cache API
   */
  cache: {
    getStats: () => apiClient.get('/cache/stats'),
    clear: (type = null) => 
      apiClient.delete(`/cache/clear${type ? `?type=${type}` : ''}`),
    clearCustomer: (customerId) => 
      apiClient.delete(`/cache/customer/${customerId}`),
    clean: () => apiClient.post('/cache/clean'),
  },
  /**
 * Customer Endpoints
 */
  customers: {
  // Get all customers with filters
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    const queryString = queryParams.toString();
    return apiClient.get(`/customers${queryString ? `?${queryString}` : ''}`);
  },
  
  // Get customer by ID
  getById: (id) => apiClient.get(`/customers/${id}`),
  
  // Search customers
  search: (query, limit = 20) => 
    apiClient.get(`/customers/search/${encodeURIComponent(query)}`, { params: { limit } }),
  
  // Autocomplete search (optimized)
  autocomplete: (query, limit = 10) => 
    apiClient.get(`/customers/autocomplete/${encodeURIComponent(query)}`, { params: { limit } }),
  
  // Get by loyalty tier
  getByLoyaltyTier: (tier, limit = 50) => 
    apiClient.get(`/customers/loyalty/${tier}`, { params: { limit } }),
},
  
};
 
export default api;
