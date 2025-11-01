/**
 * Cache Service
 * In-memory caching for expensive analytics calculations
 */

const NodeCache = require('node-cache');
const { AnalyticsCache } = require('../models');

// Create cache instance (TTL in seconds)
const memoryCache = new NodeCache({
  stdTTL: 21600, // 6 hours default
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Better performance
});

/**
 * Get value from cache
 * @param {string} key 
 * @returns {Promise<any>}
 */
async function get(key) {
  try {
    // Try memory cache first
    const memValue = memoryCache.get(key);
    if (memValue !== undefined) {
      console.log(`✅ Cache HIT (memory): ${key}`);
      return memValue;
    }

    // Try database cache
    const dbCache = await AnalyticsCache.findOne({
      where: {
        cache_key: key,
        expires_at: { [require('sequelize').Op.gte]: new Date() }
      }
    });

    if (dbCache) {
      console.log(`✅ Cache HIT (database): ${key}`);
      
      // Populate memory cache
      const ttl = Math.floor((new Date(dbCache.expires_at) - new Date()) / 1000);
      memoryCache.set(key, dbCache.cache_value, ttl);
      
      return dbCache.cache_value;
    }

    console.log(`❌ Cache MISS: ${key}`);
    return null;

  } catch (error) {
    console.error('Error getting from cache:', error);
    return null;
  }
}

/**
 * Set value in cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlHours 
 * @param {string} cacheType 
 * @returns {Promise<boolean>}
 */
async function set(key, value, ttlHours = 6, cacheType = 'general') {
  try {
    const ttlSeconds = ttlHours * 3600;
    const expiresAt = new Date(Date.now() + (ttlHours * 3600 * 1000));

    // Set in memory cache
    memoryCache.set(key, value, ttlSeconds);

    // Set in database cache (for persistence)
    await AnalyticsCache.upsert({
      cache_key: key,
      cache_value: value,
      cache_type: cacheType,
      expires_at: expiresAt
    });

    console.log(`✅ Cache SET: ${key} (TTL: ${ttlHours}h)`);
    return true;

  } catch (error) {
    console.error('Error setting cache:', error);
    return false;
  }
}

/**
 * Delete value from cache
 * @param {string} key 
 * @returns {Promise<boolean>}
 */
async function del(key) {
  try {
    // Delete from memory
    memoryCache.del(key);

    // Delete from database
    await AnalyticsCache.destroy({
      where: { cache_key: key }
    });

    console.log(`✅ Cache DELETE: ${key}`);
    return true;

  } catch (error) {
    console.error('Error deleting from cache:', error);
    return false;
  }
}

/**
 * Clear all cache
 * @param {string} cacheType - Optional filter by type
 * @returns {Promise<boolean>}
 */
async function clear(cacheType = null) {
  try {
    // Clear memory cache
    memoryCache.flushAll();

    // Clear database cache
    const where = cacheType ? { cache_type: cacheType } : {};
    await AnalyticsCache.destroy({ where });

    console.log(`✅ Cache CLEARED${cacheType ? ` (type: ${cacheType})` : ''}`);
    return true;

  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}

/**
 * Get or set pattern - get from cache, or compute and cache
 * @param {string} key 
 * @param {Function} computeFn 
 * @param {number} ttlHours 
 * @param {string} cacheType 
 * @returns {Promise<any>}
 */
async function getOrSet(key, computeFn, ttlHours = 6, cacheType = 'general') {
  try {
    // Try to get from cache
    let value = await get(key);

    if (value !== null) {
      return value;
    }

    // Cache miss - compute value
    console.log(`🔄 Computing value for: ${key}`);
    value = await computeFn();

    // Cache the computed value
    await set(key, value, ttlHours, cacheType);

    return value;

  } catch (error) {
    console.error('Error in getOrSet:', error);
    throw error;
  }
}

/**
 * Clean expired cache entries
 * @returns {Promise<number>}
 */
async function cleanExpired() {
  try {
    const result = await AnalyticsCache.destroy({
      where: {
        expires_at: { [require('sequelize').Op.lt]: new Date() }
      }
    });

    console.log(`✅ Cleaned ${result} expired cache entries`);
    return result;

  } catch (error) {
    console.error('Error cleaning expired cache:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 * @returns {Object}
 */
function getStats() {
  const stats = memoryCache.getStats();
  return {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hit_rate: stats.hits > 0 ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) : 0,
    ksize: stats.ksize,
    vsize: stats.vsize
  };
}

/**
 * Generate cache key for customer analytics
 * @param {number} customerId 
 * @param {string} type 
 * @returns {string}
 */
function generateCustomerKey(customerId, type) {
  return `customer:${customerId}:${type}`;
}

/**
 * Generate cache key for segment data
 * @param {string} segment 
 * @param {string} type 
 * @returns {string}
 */
function generateSegmentKey(segment, type) {
  return `segment:${segment}:${type}`;
}

/**
 * Invalidate customer cache
 * @param {number} customerId 
 * @returns {Promise<boolean>}
 */
async function invalidateCustomerCache(customerId) {
  try {
    const keys = [
      generateCustomerKey(customerId, 'rfm'),
      generateCustomerKey(customerId, 'clv'),
      generateCustomerKey(customerId, 'churn'),
      generateCustomerKey(customerId, 'recommendations'),
      generateCustomerKey(customerId, 'complete')
    ];

    for (const key of keys) {
      await del(key);
    }

    console.log(`✅ Invalidated cache for customer ${customerId}`);
    return true;

  } catch (error) {
    console.error('Error invalidating customer cache:', error);
    return false;
  }
}

module.exports = {
  get,
  set,
  del,
  clear,
  getOrSet,
  cleanExpired,
  getStats,
  generateCustomerKey,
  generateSegmentKey,
  invalidateCustomerCache,
  
  // Export memory cache instance for direct access if needed
  memoryCache
};