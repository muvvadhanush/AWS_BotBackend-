const { OpenAI } = require('openai');
const logger = require('../utils/logger');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate 1536-dimensional embedding using OpenAI text-embedding-3-small
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
const generateEmbedding = async (text) => {
    if (!text) return null;

    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text.replace(/\n/g, " "),
            dimensions: 1536
        });

        return response.data[0].embedding;
    } catch (error) {
        logger.error("Embedding Generation Failed:", error.message);
        throw error;
    }
};

module.exports = {
    generateEmbedding
};
