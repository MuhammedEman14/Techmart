/**
 * Analytics Cache Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnalyticsCache = sequelize.define('AnalyticsCache', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cache_key: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false
    },
    cache_value: {
      type: DataTypes.JSON,
      allowNull: false
    },
    cache_type: {
      type: DataTypes.STRING(50)
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'analytics_cache',
    timestamps: true,
    underscored: true
  });

  return AnalyticsCache;
};