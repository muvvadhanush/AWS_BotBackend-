const aiAdapter = require("./ai/aiAdapter");
const { client, model } = require("../config/aiClient");
const tokenLogger = require("../utils/tokenLogger");

/**
 * AI Service Facade
 * Provides high-level methods for controllers while delegating to adapters.
 */

// 1. Free Chat (Non-streaming)
exports.freeChat = async ({
    message,
    history = [],
    systemPrompt = "",
    temperature = 0.7
}) => {
    const messages = [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.text || m.content
        })),
        { role: "user", content: message }
    ];

    const response = await aiAdapter.generate({
        messages,
        temperature
    });

    return {
        reply: response.content,
        sources: response.sources || []
    };
};

// 2. Stream Chat (SSE Streaming)
exports.streamChat = async ({
    message,
    history = [],
    systemPrompt = "",
    temperature = 0.7,
    connectionId
}) => {
    const provider = process.env.AI_PROVIDER || 'openai';

    const messages = [
        { role: "system", content: systemPrompt },
        ...history.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.text || m.content
        })),
        { role: "user", content: message }
    ];

    // For now, streaming is primarily supported for OpenAI in this implementation
    // Anthropic/Ollama can be added if they support async iterables in their node SDKs
    if (provider === 'openai') {
        const stream = await client.chat.completions.create({
            model: model,
            messages: messages,
            temperature: temperature,
            stream: true,
        });

        return {
            stream,
            sources: [], // Sources logic can be integrated here if RAG is used
            model: model,
            provider: 'openai'
        };
    }

    // Fallback to non-streaming for other providers (mocking a stream)
    const response = await aiAdapter.generate({ messages, temperature });

    // Mock async generator
    async function* mockStream() {
        yield { choices: [{ delta: { content: response.content } }] };
    }

    return {
        stream: mockStream(),
        sources: response.sources || [],
        model: 'default',
        provider: provider
    };
};
