const logger = require("../utils/logger");
const ConnectionKnowledge = require("../models/ConnectionKnowledge");
const ConfidencePolicy = require("../models/ConfidencePolicy");

/**
 * Detects if the response contains sales-related triggers/keywords
 * @param {string} text 
 * @returns {boolean}
 */
const detectSalesTriggers = (text) => {
    const salesPatterns = [
        'buy now', 'sign up', 'get started', 'free trial',
        'book a demo', 'schedule a call', 'contact sales',
        'pricing', 'upgrade', 'subscribe'
    ];
    const lowerText = (text || '').toLowerCase();
    return salesPatterns.some(p => lowerText.includes(p));
};

/**
 * Calculates aggregate confidence score from sources
 * @param {Array} sources 
 * @returns {number|null}
 */
const calculateAggregateConfidence = (sources) => {
    if (!sources || sources.length === 0) return null;
    const scores = sources
        .filter(s => s.confidenceScore !== undefined)
        .map(s => s.confidenceScore);

    if (scores.length === 0) return 1.0; // Default if no scores found but sources exist
    return scores.reduce((a, b) => a + b, 0) / scores.length;
};

const KnowledgeGap = require("../models/KnowledgeGap");

/**
 * Applies confidence policy gating to an AI response
 * @param {string} connectionId 
 * @param {string} originalText 
 * @param {object} aiMetadata 
 * @returns {Promise<{text: string, metadata: object}>}
 */
const applyConfidenceGating = async (connectionId, originalText, aiMetadata, query = null) => {
    const response = {
        text: originalText,
        metadata: { ...aiMetadata, gated: false }
    };

    try {
        const policy = await ConfidencePolicy.findOne({ where: { connectionId } });
        if (!policy) return response;

        const sourceCount = aiMetadata.sources ? aiMetadata.sources.length : 0;
        const conf = aiMetadata.confidenceScore !== null ? aiMetadata.confidenceScore : 1;

        const belowConfidence = conf < policy.minAnswerConfidence;
        const belowSources = sourceCount < policy.minSourceCount;

        if (belowConfidence || belowSources) {
            const gateReason = belowConfidence
                ? `Confidence ${(conf * 100).toFixed(0)}% below ${(policy.minAnswerConfidence * 100).toFixed(0)}% threshold`
                : `Only ${sourceCount} source(s), need ${policy.minSourceCount}`;

            response.metadata.gated = true;
            response.metadata.gateReason = gateReason;
            response.metadata.originalAnswer = originalText;

            // --- KNOWLEDGE GAP DETECTION ---
            if (query) {
                try {
                    await KnowledgeGap.create({
                        connectionId,
                        query,
                        confidenceScore: conf,
                        context: { gateReason, sourceCount, originalAnswerSnippet: originalText.substring(0, 100) }
                    });
                    logger.info(`[GAP_DETECTION] Logged knowledge gap for ${connectionId}`);
                } catch (gapErr) {
                    logger.error(`[GAP_DETECTION] Failed to log gap: ${gapErr.message}`);
                }
            }

            switch (policy.lowConfidenceAction) {
                case 'REFUSE':
                    response.text = "I'm not fully confident in that answer yet. Let me double-check or connect you with support.";
                    break;
                case 'CLARIFY':
                    response.text = "I need a bit more detail to answer accurately. Could you rephrase or provide more context?";
                    break;
                case 'ESCALATE':
                    response.text = "I'm not confident enough to answer that reliably. Would you like me to connect you to a human agent?";
                    break;
                case 'SOFT_ANSWER':
                default:
                    response.text = "⚠️ This may not be fully accurate, but based on available information: " + originalText;
                    break;
            }

            logger.info(`[GATE] Response gated for ${connectionId}: ${gateReason} -> ${policy.lowConfidenceAction}`);
        }
    } catch (err) {
        logger.error(`[GATE] Policy check error for ${connectionId}:`, err.message);
    }

    return response;
};

/**
 * Updates knowledge base confidence based on user feedback
 * @param {Array} sources 
 * @param {string} rating CORRECT | INCORRECT
 */
const updateKnowledgeConfidence = async (sources, rating) => {
    if (!sources || !rating) return;

    for (const source of sources) {
        if (source.sourceId) {
            try {
                const knowledge = await ConnectionKnowledge.findByPk(source.sourceId);
                if (knowledge) {
                    let score = knowledge.confidenceScore || 0.5;

                    if (rating === 'CORRECT') {
                        score = Math.min(score + 0.1, 1.0);
                    } else if (rating === 'INCORRECT') {
                        score = Math.max(score - 0.2, 0.0);
                    }

                    knowledge.confidenceScore = score;
                    await knowledge.save();
                }
            } catch (err) {
                logger.error(`Error updating knowledge feedback for ${source.sourceId}:`, err.message);
            }
        }
    }
};

module.exports = {
    detectSalesTriggers,
    calculateAggregateConfidence,
    applyConfidenceGating,
    updateKnowledgeConfidence
};
