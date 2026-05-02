const request = require('supertest');
const app = require('../../app');
const Investment = require('../../models/Investment');
const { createTestUser } = require('../helpers');

require('../setup');

// Mock yahoo-finance2
const mockQuote = jest.fn();
jest.mock('yahoo-finance2', () => ({
  __esModule: true,
  default: class MockYahooFinance {
    constructor() {}
    quote(...args) { return mockQuote(...args); }
  },
}));
const yahooFinance = { quote: mockQuote };

describe('Investment Routes', () => {
  let user1, token1, user2, token2;

  beforeEach(async () => {
    ({ user: user1, token: token1 } = await createTestUser({ email: 'user1@example.com', name: 'User One' }));
    ({ user: user2, token: token2 } = await createTestUser({ email: 'user2@example.com', name: 'User Two' }));
  });

  describe('POST /api/investments', () => {
    it('should create an investment', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'AAPL Stock',
          type: 'stocks',
          purchasePrice: 150,
          currentValue: 175,
          quantity: 10,
          purchaseDate: '2025-01-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('AAPL Stock');
      expect(res.body.type).toBe('stocks');
    });

    it('should return 400 with invalid type', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Test',
          type: 'invalid',
          purchasePrice: 100,
          currentValue: 110,
          purchaseDate: '2025-01-01',
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/investments')
        .send({ name: 'Test', type: 'stocks', purchasePrice: 100, currentValue: 110, purchaseDate: '2025-01-01' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/investments', () => {
    beforeEach(async () => {
      await Investment.create({
        user: user1._id, name: 'AAPL', type: 'stocks', purchasePrice: 150, currentValue: 175, purchaseDate: new Date()
      });
      await Investment.create({
        user: user1._id, name: 'BTC', type: 'crypto', purchasePrice: 30000, currentValue: 45000, purchaseDate: new Date()
      });
      await Investment.create({
        user: user2._id, name: 'GOOG', type: 'stocks', purchasePrice: 2800, currentValue: 3000, purchaseDate: new Date()
      });
    });

    it('should return only user investments', async () => {
      const res = await request(app)
        .get('/api/investments')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/investments?type=stocks')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('AAPL');
    });
  });

  describe('GET /api/investments/summary', () => {
    beforeEach(async () => {
      await Investment.create({
        user: user1._id, name: 'AAPL', type: 'stocks', purchasePrice: 150, currentValue: 175, quantity: 10, purchaseDate: new Date()
      });
      await Investment.create({
        user: user1._id, name: 'BTC', type: 'crypto', purchasePrice: 30000, currentValue: 45000, quantity: 1, purchaseDate: new Date()
      });
    });

    it('should return portfolio summary', async () => {
      const res = await request(app)
        .get('/api/investments/summary')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.totalInvested).toBe(31500);
      expect(res.body.currentValue).toBe(46750);
      expect(res.body.count).toBe(2);
      expect(res.body.byType).toHaveLength(2);
    });
  });

  describe('PUT /api/investments/:id', () => {
    let investmentId;

    beforeEach(async () => {
      const inv = await Investment.create({
        user: user1._id, name: 'AAPL', type: 'stocks', purchasePrice: 150, currentValue: 175, purchaseDate: new Date()
      });
      investmentId = inv._id;
    });

    it('should update investment by owner', async () => {
      const res = await request(app)
        .put(`/api/investments/${investmentId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ currentValue: 200 });

      expect(res.status).toBe(200);
      expect(res.body.currentValue).toBe(200);
    });

    it('should return 403 for non-owner', async () => {
      const res = await request(app)
        .put(`/api/investments/${investmentId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ currentValue: 200 });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/investments/:id', () => {
    let investmentId;

    beforeEach(async () => {
      const inv = await Investment.create({
        user: user1._id, name: 'AAPL', type: 'stocks', purchasePrice: 150, currentValue: 175, purchaseDate: new Date()
      });
      investmentId = inv._id;
    });

    it('should delete by owner', async () => {
      const res = await request(app)
        .delete(`/api/investments/${investmentId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const deleted = await Investment.findById(investmentId);
      expect(deleted).toBeNull();
    });

    it('should return 403 for non-owner', async () => {
      const res = await request(app)
        .delete(`/api/investments/${investmentId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/investments/lookup/:symbol', () => {
    beforeEach(() => {
      yahooFinance.quote.mockReset();
    });

    it('should return stock info for valid ticker', async () => {
      yahooFinance.quote.mockResolvedValue({
        symbol: 'AAPL',
        shortName: 'Apple Inc.',
        regularMarketPrice: 185.50,
        fullExchangeName: 'NasdaqGS',
        currency: 'USD',
      });

      const res = await request(app)
        .get('/api/investments/lookup/AAPL')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.symbol).toBe('AAPL');
      expect(res.body.name).toBe('Apple Inc.');
      expect(res.body.price).toBe(185.50);
      expect(res.body.exchange).toBe('NasdaqGS');
    });

    it('should return 404 for invalid ticker', async () => {
      yahooFinance.quote.mockRejectedValue(new Error('Not found'));

      const res = await request(app)
        .get('/api/investments/lookup/XYZXYZ')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Ticker not found');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/investments/lookup/AAPL');
      expect(res.status).toBe(401);
    });

    it('should return 400 for invalid symbol format', async () => {
      const res = await request(app)
        .get('/api/investments/lookup/INVALID!!!')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/investments/refresh-prices', () => {
    beforeEach(async () => {
      yahooFinance.quote.mockReset();
      await Investment.create({
        user: user1._id, name: 'Apple', type: 'stocks', purchasePrice: 150, currentValue: 175,
        purchaseDate: new Date(), ticker: 'AAPL',
      });
      await Investment.create({
        user: user1._id, name: 'My 401k', type: 'other', purchasePrice: 10000, currentValue: 12000,
        purchaseDate: new Date(), ticker: null, account: '401k',
      });
    });

    it('should update ticker-based investments only', async () => {
      yahooFinance.quote.mockResolvedValue({
        symbol: 'AAPL',
        regularMarketPrice: 200,
      });

      const res = await request(app)
        .put('/api/investments/refresh-prices')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.data || res.body).toBeDefined();
      expect(res.body.updated).toBe(1);
      expect(res.body.failed).toBe(0);

      // Verify the ticker investment was updated
      const updated = await Investment.findOne({ user: user1._id, ticker: 'AAPL' });
      expect(updated.currentValue).toBe(200);
      expect(updated.lastPriceUpdate).toBeTruthy();

      // Verify the manual investment was NOT updated
      const manual = await Investment.findOne({ user: user1._id, ticker: null });
      expect(manual.currentValue).toBe(12000);
    });

    it('should handle partial failures', async () => {
      await Investment.create({
        user: user1._id, name: 'Google', type: 'stocks', purchasePrice: 100, currentValue: 150,
        purchaseDate: new Date(), ticker: 'GOOG',
      });

      yahooFinance.quote.mockImplementation((symbol) => {
        if (symbol === 'AAPL') return Promise.resolve({ symbol: 'AAPL', regularMarketPrice: 200 });
        return Promise.reject(new Error('API error'));
      });

      const res = await request(app)
        .put('/api/investments/refresh-prices')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(1);
      expect(res.body.failed).toBe(1);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).put('/api/investments/refresh-prices');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/investments with ticker', () => {
    it('should create investment with ticker field', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Apple Inc.',
          type: 'stocks',
          purchasePrice: 150,
          currentValue: 185,
          quantity: 10,
          purchaseDate: '2025-01-15',
          ticker: 'AAPL',
        });

      expect(res.status).toBe(201);
      expect(res.body.ticker).toBe('AAPL');
      expect(res.body.lastPriceUpdate).toBeTruthy();
    });

    it('should create investment without ticker (manual)', async () => {
      const res = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'My 401k',
          type: 'etf',
          purchasePrice: 10000,
          currentValue: 12000,
          purchaseDate: '2025-01-15',
          account: '401k',
        });

      expect(res.status).toBe(201);
      expect(res.body.ticker).toBeNull();
      expect(res.body.lastPriceUpdate).toBeNull();
      expect(res.body.account).toBe('401k');
    });
  });

  describe('PUT /api/investments/:id with ticker', () => {
    let investmentId;

    beforeEach(async () => {
      const inv = await Investment.create({
        user: user1._id, name: 'AAPL', type: 'stocks', purchasePrice: 150, currentValue: 175, purchaseDate: new Date()
      });
      investmentId = inv._id;
    });

    it('should add ticker to existing investment', async () => {
      const res = await request(app)
        .put(`/api/investments/${investmentId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ ticker: 'AAPL' });

      expect(res.status).toBe(200);
      expect(res.body.ticker).toBe('AAPL');
    });

    it('should remove ticker from investment', async () => {
      await Investment.findByIdAndUpdate(investmentId, { ticker: 'AAPL' });

      const res = await request(app)
        .put(`/api/investments/${investmentId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ ticker: null });

      expect(res.status).toBe(200);
      expect(res.body.ticker).toBeNull();
    });
  });
});
