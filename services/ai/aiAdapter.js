const openaiAdapter = require('./adapters/openaiAdapter');
const ollamaAdapter = require('./adapters/ollamaAdapter');
const mockAdapter = require('./adapters/mockAdapter');

const provider = process.env.AI_PROVIDER || 'openai';

exports.generate = async (payload) => {
    if (provider === 'ollama') {
        return ollamaAdapter.generate(payload);
    }
    if (provider === 'mock') {
        return mockAdapter.generate(payload);
    }
    return openaiAdapter.generate(payload);
};
