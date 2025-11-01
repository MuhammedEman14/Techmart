/**
 * Product Recommendation Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProductRecommendation = sequelize.define('ProductRecommendation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    recommendation_score: {
      type: DataTypes.DECIMAL(5, 2)
    },
    recommendation_type: {
      type: DataTypes.STRING(50)
    },
    reason: {
      type: DataTypes.TEXT
    },
    generated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'product_recommendations',
    timestamps: true,
    underscored: true
  });

  ProductRecommendation.associate = (models) => {
    ProductRecommendation.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer'
    });
    ProductRecommendation.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return ProductRecommendation;
};