/**
 * Inventory Service
 * Manages product stock levels and inventory operations
 */

const { Product, Supplier, Transaction } = require('../models');
const { Op, fn, col } = require('sequelize');

/**
 * Get products with low stock
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Low stock products
 */
async function getLowStockProducts(options = {}) {
  try {
    const {
      threshold = parseInt(process.env.REORDER_THRESHOLD) || 10,
      category = null
    } = options;

    const whereClause = {
      stock_quantity: {
        [Op.lte]: threshold
      }
    };

    // Add category filter if provided
    if (category) {
      whereClause.category = category;
    }

    const lowStockProducts = await Product.findAll({
      where: whereClause,
      include: [{
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'name', 'contact_email', 'average_delivery_days', 'reliability_score']
      }],
      order: [['stock_quantity', 'ASC']],
      raw: false
    });

    // Calculate additional metrics
    const productsWithMetrics = await Promise.all(
      lowStockProducts.map(async (product) => {
        // Get sales velocity (average daily sales)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const salesData = await Transaction.findOne({
          where: {
            product_id: product.id,
            timestamp: {
              [Op.gte]: thirtyDaysAgo
            },
            status: 'completed'
          },
          attributes: [
            [fn('SUM', col('quantity')), 'total_sold']
          ],
          raw: true
        });

        const totalSold = parseInt(salesData?.total_sold || 0);
        const dailyAverage = (totalSold / 30).toFixed(2);
        const daysUntilStockout = dailyAverage > 0 
          ? Math.floor(product.stock_quantity / dailyAverage)
          : 999;

        return {
          ...product.toJSON(),
          metrics: {
            sales_last_30_days: totalSold,
            daily_average_sales: parseFloat(dailyAverage),
            days_until_stockout: daysUntilStockout,
            reorder_recommended: daysUntilStockout <= 7,
            urgency_level: getUrgencyLevel(daysUntilStockout, product.stock_quantity)
          }
        };
      })
    );

    // Calculate summary statistics
    const criticalItems = productsWithMetrics.filter(p => p.stock_quantity === 0).length;
    const categories = [...new Set(productsWithMetrics.map(p => p.category))];
    const estimatedValue = productsWithMetrics.reduce((sum, p) => 
      sum + (parseFloat(p.price) * p.stock_quantity), 0
    );

    return {
      low_stock_products: productsWithMetrics,
      summary: {
        total_low_stock_items: productsWithMetrics.length,
        critical_items: criticalItems,
        affected_categories: categories.length,
        estimated_stock_value: estimatedValue.toFixed(2),
        threshold_used: threshold
      }
    };

  } catch (error) {
    console.error('Error getting low stock products:', error);
    throw error;
  }
}

/**
 * Update product stock quantity
 * @param {number} productId - Product ID
 * @param {number} quantity - Quantity to add/subtract
 * @param {string} operation - 'add' or 'subtract'
 * @returns {Promise<Object>} Updated product
 */
async function updateStockQuantity(productId, quantity, operation = 'subtract') {
  try {
    const product = await Product.findByPk(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    const currentStock = product.stock_quantity;
    let newStock;

    if (operation === 'add') {
      newStock = currentStock + quantity;
    } else if (operation === 'subtract') {
      newStock = currentStock - quantity;
      
      if (newStock < 0) {
        throw new Error('Insufficient stock available');
      }
    } else {
      throw new Error('Invalid operation. Use "add" or "subtract"');
    }

    product.stock_quantity = newStock;
    await product.save();

    return {
      product_id: productId,
      product_name: product.name,
      previous_stock: currentStock,
      new_stock: newStock,
      quantity_changed: quantity,
      operation
    };

  } catch (error) {
    console.error('Error updating stock quantity:', error);
    throw error;
  }
}

/**
 * Get inventory value by category
 * @returns {Promise<Array>} Inventory value breakdown
 */
async function getInventoryValue() {
  try {
    const inventoryByCategory = await Product.findAll({
      attributes: [
        'category',
        [fn('COUNT', col('id')), 'product_count'],
        [fn('SUM', col('stock_quantity')), 'total_units'],
        [fn('SUM', fn('*', col('price'), col('stock_quantity'))), 'total_value']
      ],
      group: ['category'],
      order: [[fn('SUM', fn('*', col('price'), col('stock_quantity'))), 'DESC']],
      raw: true
    });

    const totalValue = inventoryByCategory.reduce((sum, cat) => 
      sum + parseFloat(cat.total_value || 0), 0
    );

    return {
      by_category: inventoryByCategory.map(cat => ({
        category: cat.category,
        product_count: parseInt(cat.product_count),
        total_units: parseInt(cat.total_units),
        total_value: parseFloat(cat.total_value).toFixed(2),
        percentage_of_total: ((parseFloat(cat.total_value) / totalValue) * 100).toFixed(2)
      })),
      total_inventory_value: totalValue.toFixed(2),
      total_categories: inventoryByCategory.length
    };

  } catch (error) {
    console.error('Error getting inventory value:', error);
    throw error;
  }
}

/**
 * Check stock availability for a product
 * @param {number} productId - Product ID
 * @param {number} requestedQuantity - Quantity needed
 * @returns {Promise<Object>} Stock availability status
 */
async function checkStockAvailability(productId, requestedQuantity) {
  try {
    const product = await Product.findByPk(productId);

    if (!product) {
      throw new Error('Product not found');
    }

    const available = product.stock_quantity >= requestedQuantity;
    const shortage = available ? 0 : requestedQuantity - product.stock_quantity;

    return {
      product_id: productId,
      product_name: product.name,
      requested_quantity: requestedQuantity,
      available_quantity: product.stock_quantity,
      is_available: available,
      shortage,
      can_fulfill: available
    };

  } catch (error) {
    console.error('Error checking stock availability:', error);
    throw error;
  }
}

/**
 * Helper: Get urgency level based on days until stockout
 */
function getUrgencyLevel(daysUntilStockout, currentStock) {
  if (currentStock === 0) return 'critical';
  if (daysUntilStockout <= 3) return 'critical';
  if (daysUntilStockout <= 7) return 'high';
  if (daysUntilStockout <= 14) return 'medium';
  return 'low';
}

module.exports = {
  getLowStockProducts,
  updateStockQuantity,
  getInventoryValue,
  checkStockAvailability
};