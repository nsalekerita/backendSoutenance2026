process.env.NODE_ENV = 'test';

jest.mock('../config/env', () => ({
  env: {
    geminiApiKey: 'test-key',
    geminiModel: 'test-model',
    nodeEnv: 'production',
  },
}));

const { callGemini } = require('../ia/gemini.client');
const { errorMiddleware } = require('../middleware/error.middleware');

describe('callGemini', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('maps an upstream 503 to a safe message for the user', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'provider internal error details',
    });

    let caughtError;
    try {
      await callGemini([{ role: 'user', content: 'Bonjour' }], 'System prompt');
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toMatchObject({
      status: 503,
      publicMessage: "L'assistant IA est temporairement indisponible. Veuillez réessayer dans quelques instants.",
    });
    expect(caughtError.message).toContain('provider internal error details');

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    errorMiddleware(caughtError, {}, response, jest.fn());

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: "L'assistant IA est temporairement indisponible. Veuillez réessayer dans quelques instants.",
      details: undefined,
    });
  });
});