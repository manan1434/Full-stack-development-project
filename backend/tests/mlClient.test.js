jest.mock('axios');
const axios = require('axios');

const { classifyExpense } = require('../src/services/mlClient');

describe('mlClient.classifyExpense', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...OLD_ENV, ML_SERVICE_URL: 'http://ml.test' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('returns category and confidence from the ML service', async () => {
    axios.post.mockResolvedValueOnce({
      data: { category: 'Food', confidence: 0.91 },
    });

    const result = await classifyExpense({ description: 'Zomato dinner', amount: 450 });

    expect(result).toEqual({ category: 'Food', confidence: 0.91 });
    expect(axios.post).toHaveBeenCalledWith(
      'http://ml.test/predict',
      { description: 'Zomato dinner', amount: 450 },
      expect.objectContaining({ timeout: expect.any(Number) })
    );
  });

  test('falls back to Other when the ML service errors', async () => {
    axios.post.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await classifyExpense({ description: 'anything', amount: 1 });

    expect(result).toEqual({ category: 'Other', confidence: 0 });
    warn.mockRestore();
  });

  test('falls back to Other when ML_SERVICE_URL is not set', async () => {
    delete process.env.ML_SERVICE_URL;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await classifyExpense({ description: 'something' });

    expect(result).toEqual({ category: 'Other', confidence: 0 });
    expect(axios.post).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
