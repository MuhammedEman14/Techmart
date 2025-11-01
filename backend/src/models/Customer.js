/**
 * Customer Model
 * Represents customers who make purchases
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  registration_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  total_spent: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  risk_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Risk score from 0-100, higher means riskier'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  preferred_payment: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'credit_card'
  },
  loyalty_tier: {
    type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
    allowNull: false,
    defaultValue: 'bronze'
  }
}, {
  tableName: 'customers',
  timestamps: true,
  indexes: [
    {
      fields: ['email'],
      unique: true
    },
    {
      fields: ['risk_score']
    },
    {
      fields: ['loyalty_tier']
    },
    {
      fields: ['registration_date']
    }
  ]
});

/**
 * Update customer loyalty tier based on total spent
 */
Customer.prototype.updateLoyaltyTier = function() {
  const spent = parseFloat(this.total_spent);
  
  if (spent >= 10000) {
    this.loyalty_tier = 'platinum';
  } else if (spent >= 5000) {
    this.loyalty_tier = 'gold';
  } else if (spent >= 1000) {
    this.loyalty_tier = 'silver';
  } else {
    this.loyalty_tier = 'bronze';
  }
  
  return this.save();
};

module.exports = Customer;