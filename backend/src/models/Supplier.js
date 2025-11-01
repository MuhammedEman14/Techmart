/**
 * Supplier Model
 * Represents suppliers who provide products
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  reliability_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 50.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  average_delivery_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7
  },
  payment_terms: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  established_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  certification: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'suppliers',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['country']
    }
  ]
});

module.exports = Supplier;