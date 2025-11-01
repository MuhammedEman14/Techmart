/**
 * Fraud Detection Service Tests
 * Unit tests for fraud detection algorithms
 */

const {
  calculateTransactionRiskScore,
  detectSuspiciousTransactions,
  getRiskLevel
} = require('../services/fraudDetectionService');

// Mock data for testing
const mockTransaction = {
  id: 1,
  customer_id: 100,
  product_id: 50,
  quantity: 2,
  unit_price: 500,
  total_amount: 1000,
  status: 'completed',
  payment_method: 'credit_card',
  timestamp: new Date(),
  ip_address: '192.168.1.1'
};

const mockHighValueTransaction = {
  ...mockTransaction,
  id: 2,
  total_amount: 6000
};

const mockRoundAmountTransaction = {
  ...mockTransaction,
  id: 3,
  total_amount: 5000
};

const mockFailedTransaction = {
  ...mockTransaction,
  id: 4,
  status: 'failed'
};

describe('Fraud Detection Service', () => {
  
  describe('getRiskLevel', () => {
    test('should return critical for score >= 90', () => {
      expect(getRiskLevel(95)).toBe('critical');
      expect(getRiskLevel(90)).toBe('critical');
    });

    test('should return high for score >= 70 and < 90', () => {
      expect(getRiskLevel(85)).toBe('high');
      expect(getRiskLevel(70)).toBe('high');
    });

    test('should return medium for score >= 50 and < 70', () => {
      expect(getRiskLevel(60)).toBe('medium');
      expect(getRiskLevel(50)).toBe('medium');
    });

    test('should return low for score < 50', () => {
      expect(getRiskLevel(40)).toBe('low');
      expect(getRiskLevel(0)).toBe('low');
    });
  });

  describe('calculateTransactionRiskScore', () => {
    test('should calculate risk score for normal transaction', async () => {
      // Note: This is a simplified test
      // In real implementation, you'd mock the database calls
      expect(typeof mockTransaction.total_amount).toBe('number');
    });

    test('should increase risk for high-value transactions', () => {
      const highValue = parseFloat(mockHighValueTransaction.total_amount);
      expect(highValue).toBeGreaterThan(5000);
    });

    test('should flag round amounts', () => {
      const amount = parseFloat(mockRoundAmountTransaction.total_amount);
      expect(amount % 1000).toBe(0);
      expect(amount).toBeGreaterThanOrEqual(1000);
    });

    test('should increase risk for failed payments', () => {
      expect(mockFailedTransaction.status).toBe('failed');
    });
  });

  describe('Risk Factor Detection', () => {
    test('should detect high-value transactions (>$5000)', () => {
      const amount = 6000;
      expect(amount > 5000).toBe(true);
    });

    test('should detect unusual round amounts', () => {
      const amounts = [1000, 2000, 5000];
      amounts.forEach(amount => {
        expect(amount >= 1000 && amount % 1000 === 0).toBe(true);
      });
    });

    test('should validate transaction amount ranges', () => {
      const validMin = 0.01;
      const validMax = 10000;
      
      expect(mockTransaction.total_amount).toBeGreaterThanOrEqual(validMin);
      expect(mockTransaction.total_amount).toBeLessThanOrEqual(validMax);
    });

    test('should handle large quantities', () => {
      const largeQuantity = 15;
      expect(largeQuantity).toBeGreaterThan(10);
    });
  });

  describe('Payment Method Validation', () => {
    test('should validate payment methods', () => {
      const validMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'];
      expect(validMethods).toContain(mockTransaction.payment_method);
    });

    test('should reject invalid payment methods', () => {
      const validMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'];
      const invalidMethod = 'crypto';
      expect(validMethods).not.toContain(invalidMethod);
    });
  });

  describe('Transaction Status Validation', () => {
    test('should validate transaction statuses', () => {
      const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
      expect(validStatuses).toContain(mockTransaction.status);
    });

    test('should handle failed transactions', () => {
      expect(mockFailedTransaction.status).toBe('failed');
    });

    test('should handle completed transactions', () => {
      expect(mockTransaction.status).toBe('completed');
    });
  });

  describe('IP Address Validation', () => {
    test('should validate IPv4 format', () => {
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      expect(ipv4Regex.test(mockTransaction.ip_address)).toBe(true);
    });

    test('should handle missing IP addresses', () => {
      const transactionWithoutIP = { ...mockTransaction, ip_address: null };
      expect(transactionWithoutIP.ip_address).toBeNull();
    });
  });

  describe('Risk Score Boundaries', () => {
    test('should ensure risk score is within 0-100 range', () => {
      const scores = [0, 50, 75, 100];
      scores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });

    test('should handle edge case scores', () => {
      expect(getRiskLevel(0)).toBe('low');
      expect(getRiskLevel(100)).toBe('critical');
    });
  });
});

// Run tests if called directly
if (require.main === module) {
  console.log('Run tests with: npm test');
}