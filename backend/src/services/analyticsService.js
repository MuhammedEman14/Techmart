/**
 * Analytics Service
 * Provides business intelligence and reporting functionality
 */

const { Transaction, Product, Customer } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

/**
 * Get hourly sales data for a date range
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Hourly sales data
 */
async function getHourlySales(options = {}) {
  try {
    const {
      start_date,
      end_date = new Date(),
      interval = 'hour'
    } = options;

    // Default to last 24 hours if no start date
    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = new Date(end_date);

    // Get transactions within date range
    const transactions = await Transaction.findAll({
      where: {
        timestamp: {
          [Op.between]: [startDate, endDate]
        },
        status: 'completed'
      },
      attributes: [
        [fn('DATE_FORMAT', col('timestamp'), getDateFormat(interval)), 'time_period'],
        [fn('COUNT', col('id')), 'transaction_count'],
        [fn('SUM', col('total_amount')), 'total_sales'],
        [fn('AVG', col('total_amount')), 'average_sale'],
        [fn('SUM', col('quantity')), 'total_items_sold']
      ],
      group: ['time_period'],
      order: [[literal('time_period'), 'ASC']],
      raw: true
    });

    // Format and fill gaps in time series
    const filledData = fillTimeGaps(transactions, startDate, endDate, interval);

    return {
      data: filledData,
      summary: {
        total_sales: filledData.reduce((sum, item) => sum + parseFloat(item.total_sales || 0), 0),
        total_transactions: filledData.reduce((sum, item) => sum + parseInt(item.transaction_count || 0), 0),
        average_per_period: filledData.length > 0 
          ? filledData.reduce((sum, item) => sum + parseFloat(item.total_sales || 0), 0) / filledData.length 
          : 0,
        peak_hour: filledData.reduce((max, item) => 
          parseFloat(item.total_sales || 0) > parseFloat(max.total_sales || 0) ? item : max, 
          filledData[0] || {}
        )
      }
    };

  } catch (error) {
    console.error('Error getting hourly sales:', error);
    throw error;
  }
}

/**
 * Get dashboard overview statistics
 * @param {number} hours - Time window in hours (default: 24)
 * @returns {Promise<Object>} Dashboard statistics
 */
async function getDashboardOverview(hours = 24, start_date = null, end_date = null) {
  try {
    // If start_date and end_date are provided, use them
    // Otherwise, fall back to the timeWindow logic (last X hours)
    let timeFilter = {};
    if (start_date && end_date) {
      const startDateObj = new Date(start_date);
      const endDateObj = new Date(end_date);
      timeFilter = {
        [Op.between]: [startDateObj, endDateObj]
      };
    } else {
      const timeWindow = new Date(Date.now() - hours * 60 * 60 * 1000);
      timeFilter = {
        [Op.gte]: timeWindow
      };
    }

    // Get total sales
    const salesData = await Transaction.findOne({
      where: {
        timestamp: timeFilter,
        status: 'completed'
      },
      attributes: [
        [fn('COUNT', col('id')), 'total_transactions'],
        [fn('SUM', col('total_amount')), 'total_sales'],
        [fn('AVG', col('total_amount')), 'average_order_value']
      ],
      raw: true
    });

    // Get active customers (customers who made purchases)
    const activeCustomers = await Transaction.count({
      where: {
        timestamp: timeFilter
      },
      distinct: true,
      col: 'customer_id'
    });

    // Get top selling products
    const topProducts = await Transaction.findAll({
      where: {
        timestamp: timeFilter,
        status: 'completed'
      },
      attributes: [
        'product_id',
        [fn('SUM', col('quantity')), 'total_quantity'],
        [fn('SUM', col('total_amount')), 'total_revenue']
      ],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'category', 'price', 'stock_quantity']
      }],
      group: ['product_id'],
      order: [[literal('total_revenue'), 'DESC']],
      limit: 5
    });

    // Get recent transactions
    const recentTransactions = await Transaction.findAll({
      where: {
        timestamp: timeFilter
      },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'email', 'first_name', 'last_name']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: 10
    });

    // Calculate growth compared to previous period
    let previousPeriodSales = 0;
    if (!start_date || !end_date) {
      const timeWindow = new Date(Date.now() - hours * 60 * 60 * 1000);
      const previousPeriodStart = new Date(timeWindow.getTime() - hours * 60 * 60 * 1000);
      previousPeriodSales = await Transaction.sum('total_amount', {
        where: {
          timestamp: {
            [Op.between]: [previousPeriodStart, timeWindow]
          },
          status: 'completed'
        }
      });
    }

    const currentSales = parseFloat(salesData.total_sales || 0);
    const growth = previousPeriodSales > 0 
      ? ((currentSales - previousPeriodSales) / previousPeriodSales * 100).toFixed(2)
      : 0;

    return {
      time_window: start_date && end_date
        ? `${new Date(start_date).toLocaleString()} - ${new Date(end_date).toLocaleString()}`
        : `Last ${hours} hours`,
      total_sales: parseFloat(salesData.total_sales || 0).toFixed(2),
      total_transactions: parseInt(salesData.total_transactions || 0),
      active_customers: activeCustomers,
      average_order_value: parseFloat(salesData.average_order_value || 0).toFixed(2),
      growth_percentage: parseFloat(growth),
      top_products: topProducts.map(tp => ({
        product: tp.product,
        quantity_sold: parseInt(tp.dataValues.total_quantity),
        revenue: parseFloat(tp.dataValues.total_revenue).toFixed(2)
      })),
      recent_transactions: recentTransactions.map(t => ({
        id: t.id,
        customer: `${t.customer.first_name} ${t.customer.last_name}`,
        product: t.product.name,
        amount: parseFloat(t.total_amount).toFixed(2),
        status: t.status,
        timestamp: t.timestamp
      }))
    };

  } catch (error) {
    console.error('Error getting dashboard overview:', error);
    throw error;
  }
}

/**
 * Get sales by category
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Sales by category
 */
async function getSalesByCategory(options = {}) {
  try {
    const {
      start_date,
      end_date = new Date(),
      limit = 10
    } = options;

    const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const categorySales = await Transaction.findAll({
      where: {
        timestamp: {
          [Op.between]: [startDate, end_date]
        },
        status: 'completed'
      },
      include: [{
        model: Product,
        as: 'product',
        attributes: ['category']
      }],
      attributes: [
        [fn('COUNT', col('Transaction.id')), 'transaction_count'],
        [fn('SUM', col('total_amount')), 'total_revenue'],
        [fn('SUM', col('quantity')), 'total_items']
      ],
      group: ['product.category'],
      order: [[literal('total_revenue'), 'DESC']],
      limit,
      raw: true
    });

    return categorySales.map(cat => ({
      category: cat['product.category'],
      transaction_count: parseInt(cat.transaction_count),
      total_revenue: parseFloat(cat.total_revenue).toFixed(2),
      total_items: parseInt(cat.total_items)
    }));

  } catch (error) {
    console.error('Error getting sales by category:', error);
    throw error;
  }
}

/**
 * Helper: Get date format for SQL based on interval
 */
function getDateFormat(interval) {
  switch (interval) {
    case 'hour':
      return '%Y-%m-%d %H:00:00';
    case 'day':
      return '%Y-%m-%d';
    case 'week':
      return '%Y-%U';
    case 'month':
      return '%Y-%m';
    default:
      return '%Y-%m-%d %H:00:00';
  }
}

/**
 * Helper: Fill gaps in time series data
 */
function fillTimeGaps(data, startDate, endDate, interval) {
  // This is a simplified version - in production, you'd want more sophisticated gap filling
  return data;
}

module.exports = {
  getHourlySales,
  getDashboardOverview,
  getSalesByCategory
};