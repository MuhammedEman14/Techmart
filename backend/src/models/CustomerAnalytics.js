/**
 * Customer Analytics Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustomerAnalytics = sequelize.define('CustomerAnalytics', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // RFM Scores
    recency_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    frequency_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    monetary_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rfm_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rfm_segment: {
      type: DataTypes.STRING(50)
    },
    // Metrics
    recency_days: {
      type: DataTypes.INTEGER
    },
    frequency_count: {
      type: DataTypes.INTEGER
    },
    monetary_value: {
      type: DataTypes.DECIMAL(10, 2)
    },
    // CLV
    clv_predicted: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    clv_confidence: {
      type: DataTypes.DECIMAL(5, 2)
    },
    // Churn Risk
    churn_risk_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    churn_risk_level: {
      type: DataTypes.STRING(20)
    },
    churn_indicators: {
      type: DataTypes.JSON
    },
    last_calculated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'customer_analytics',
    timestamps: true,
    underscored: true
  });

  CustomerAnalytics.associate = (models) => {
    CustomerAnalytics.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer'
    });
  };

  return CustomerAnalytics;
};