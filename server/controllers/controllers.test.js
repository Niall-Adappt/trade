const request = require('supertest');
const app = require('../server')


describe('Stock Routes', () => {
  test('GET /stock/info/:symbol', async () => {
    const res = await request(app).get('/stock/info/AAPL');
    expect(res.statusCode).toEqual(200);
    // Add more assertions based on expected response structure
  });

  test('GET /stock/historical/:symbol', async () => {
    const res = await request(app).get('/stock/historical/AAPL?period=1d');
    expect(res.statusCode).toEqual(200);
    // Assertions
  });

  test('POST /stock/buy/:symbol', async () => {
    const res = await request(app)
      .post('/stock/buy/AAPL')
      .send({ userId: 'someUserId', quantity: 10 }); // Adjust according to your API
    expect(res.statusCode).toEqual(200);
    // Assertions
  });

  test('POST /stock/sell/:symbol', async () => {
    const res = await request(app)
      .post('/stock/sell/AAPL')
      .send({ userId: 'someUserId', quantity: 5 }); // Adjust according to your API
    expect(res.statusCode).toEqual(200);
    // Assertions
  });

  test('GET /search/:query', async () => {
    const res = await request(app).get('/search/AAPL');
    expect(res.statusCode).toEqual(200);
    // Assertions
  });
});

describe('User Routes', () => {
  test('GET /user/ledger', async () => {
    const res = await request(app).get('/user/ledger').send({ userId: 'someUserId' });
    expect(res.statusCode).toEqual(200);
    // Assertions
  });

  test('GET /user/holdings', async () => {
    const res = await request(app).get('/user/holdings').send({ userId: 'someUserId' });
    expect(res.statusCode).toEqual(200);
    // Assertions
  });

  test('GET /user/portfolio', async () => {
    const res = await request(app).get('/user/portfolio').send({ userId: 'someUserId' });
    expect(res.statusCode).toEqual(200);
    // Assertions
  });

  test('GET /user/watchlist', async () => {
    const res = await request(app).get('/user/watchlist').send({ userId: 'someUserId' });
    expect(res.statusCode).toEqual(200);
    // Assertions
  });

  test('POST /user/watchlist/add', async () => {
    const res = await request(app)
      .post('/user/watchlist/add')
      .send({ userId: 'someUserId', symbol: 'AAPL' });
    expect(res.statusCode).toEqual(200);
    // Assertions
  });

  test('POST /user/watchlist/remove', async () => {
    const res = await request(app)
      .post('/user/watchlist/remove')
      .send({ userId: 'someUserId', symbol: 'AAPL' });
    expect(res.statusCode).toEqual(200);
    // Assertions
  });
});
