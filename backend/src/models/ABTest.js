/**
 * A/B Test Model
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ABTest = sequelize.define('ABTest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    test_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    test_type: {
      type: DataTypes.STRING(50)
    },
    variant_a: {
      type: DataTypes.JSON
    },
    variant_b: {
      type: DataTypes.JSON
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active'
    },
    customer_assignments: {
      type: DataTypes.JSON
    },
    metrics: {
      type: DataTypes.JSON
    },
    start_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    end_date: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'ab_tests',
    timestamps: true,
    underscored: true
  });

  return ABTest;
};