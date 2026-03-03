const ChatSession = require("../models/ChatSession");
const Connection = require("../models/Connection");
const ConnectionKnowledge = require("../models/ConnectionKnowledge");
const aiService = require("../services/aiservice");
const actionService = require("../services/actionService");
const promptService = require("../services/promptService");

// Helper to send standardized response
const sendReply = (res, message, suggestions = [], aiMetadata = null, messageIndex = -1) => {
  return res.status(200).json({
    messages: [{ role: "assistant", text: message }],
    suggestions,
    ai_metadata: aiMetadata,
    messageIndex
  });
};

exports.sendMessage = async (req, res) => {
  try {
    const { message, connectionId, sessionId, url } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: "Missing message or sessionId" });
    }

    // 1. Load or Create Session
    let session = await ChatSession.findOne({ where: { sessionId } });

    if (!session) {
      session = await ChatSession.create({
        sessionId,
        connectionId,
        messages: [],
        currentStep: 'NONE',
        tempData: {},
        mode: 'FREE_CHAT'
      });
    }

    // Ensure session.tempData is an object
    let tempData = session.tempData || {};
    if (typeof tempData === 'string') {
      try { tempData = JSON.parse(tempData); } catch (e) { tempData = {}; }
    }

    // Ensure session.mode is valid
    if (!session.mode) session.mode = 'FREE_CHAT';

    let response = { text: "", suggestions: [], ai_metadata: null };
    let nextStep = session.currentStep;

    console.log(`[${session.mode}] Step: ${session.currentStep} | Input: "${message}"`);

    // --- EXECUTE FREE CHAT LOGIC DIRECTLY ---
    let history = session.messages || [];
    if (typeof history === 'string') try { history = JSON.parse(history); } catch (e) { history = []; }

    // --- PERMISSION CHECK: AI ENABLED ---
    const connectionObj = await Connection.findOne({ where: { connectionId } });
    const perms = connectionObj ? connectionObj.permissions : null;

    let permsObj = perms;
    if (typeof perms === 'string') {
      try { permsObj = JSON.parse(perms); } catch (e) { permsObj = {}; }
    }

    let aiEnabled = true; // Default
    if (permsObj && typeof permsObj.aiEnabled !== 'undefined') {
      aiEnabled = permsObj.aiEnabled;
    }

    console.log(`[DEBUG] Connection: ${connectionId} | AI Enabled: ${aiEnabled}`);

    let aiReply = "I'm listening.";
    if (aiEnabled === true || aiEnabled === "true") {

      // --- STEP 1: PROMPT ASSEMBLY ---
      const assembledPrompt = await promptService.assemblePrompt(connectionId, url, "");

      const aiOutput = await aiService.freeChat({
        message,
        history,
        connectionId,
        systemPrompt: assembledPrompt
      });

      // Handle Object return
      if (typeof aiOutput === 'object' && aiOutput.reply) {
        aiReply = aiOutput.reply;
        response.ai_metadata = { sources: aiOutput.sources };
      } else {
        aiReply = aiOutput;
      }
    } else {
      console.log("⛔ AI Chat Blocked.");
      aiReply = "AI Chat is disabled.";
    }

    response.text = aiReply;

    // Enrich ai_metadata for behavior metrics
    const salesPatterns = ['buy now', 'sign up', 'get started', 'free trial', 'book a demo', 'schedule a call', 'contact sales', 'pricing', 'upgrade', 'subscribe'];
    const replyLower = (response.text || '').toLowerCase();
    const wordCount = (response.text || '').split(/\s+/).filter(w => w).length;
    const salesTriggerDetected = salesPatterns.some(p => replyLower.includes(p));

    // Compute aggregate confidence from sources
    let aggConfidence = null;
    if (response.ai_metadata && response.ai_metadata.sources) {
      const scores = response.ai_metadata.sources
        .filter(s => s.confidenceScore !== undefined)
        .map(s => s.confidenceScore);
      if (scores.length > 0) {
        aggConfidence = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }

    response.ai_metadata = {
      ...(response.ai_metadata || {}),
      responseLength: wordCount,
      salesTriggerDetected,
      confidenceScore: aggConfidence
    };

    // ─── CONFIDENCE GATING ─────────────────────────────────
    const ConfidencePolicy = require('../models/ConfidencePolicy');
    let gated = false;
    let gateReason = null;
    try {
      const policy = await ConfidencePolicy.findOne({ where: { connectionId } });
      if (policy) {
        const sourceCount = (response.ai_metadata && response.ai_metadata.sources)
          ? response.ai_metadata.sources.length : 0;
        const conf = aggConfidence !== null ? aggConfidence : 1;

        const belowConfidence = conf < policy.minAnswerConfidence;
        const belowSources = sourceCount < policy.minSourceCount;

        if (belowConfidence || belowSources) {
          gated = true;
          gateReason = belowConfidence
            ? `Confidence ${(conf * 100).toFixed(0)}% below ${(policy.minAnswerConfidence * 100).toFixed(0)}% threshold`
            : `Only ${sourceCount} source(s), need ${policy.minSourceCount}`;

          const originalAnswer = response.text;
          response.ai_metadata.gated = true;
          response.ai_metadata.gateReason = gateReason;
          response.ai_metadata.originalAnswer = originalAnswer;

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
              response.text = "⚠️ This may not be fully accurate, but based on available information: " + originalAnswer;
              break;
          }
          console.log(`[GATE] Response gated for ${connectionId}: ${gateReason} → ${policy.lowConfidenceAction}`);
        }
      }
    } catch (gateErr) {
      console.error('[GATE] Policy check error:', gateErr.message);
    }
    // ─── END CONFIDENCE GATING ─────────────────────────────

    // Save history
    history.push({ role: "user", text: message });
    history.push({
      role: "assistant",
      text: response.text,
      ai_metadata: response.ai_metadata || null
    });
    session.messages = history;
    session.changed('messages', true);
    await session.save();

    return sendReply(res, response.text);

    // --- STATE MACHINE REMOVED (Idea Feature Deleted) ---

    // 4. Send Reply
    return sendReply(res, response.text, response.suggestions || [], response.ai_metadata);

  } catch (error) {
    console.error("❌ Chat Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { sessionId, messageIndex, rating, notes } = req.body; // rating: "CORRECT" | "INCORRECT"

    if (!sessionId || messageIndex === undefined) {
      return res.status(400).json({ error: "Missing sessionId or messageIndex" });
    }

    const session = await ChatSession.findOne({ where: { sessionId } });
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Validate Messages
    let messages = session.messages || [];
    if (typeof messages === 'string') try { messages = JSON.parse(messages); } catch (e) { messages = []; }

    const idx = parseInt(messageIndex);
    if (isNaN(idx) || idx < 0 || idx >= messages.length) {
      return res.status(400).json({ error: "Invalid message index" });
    }

    const targetMsg = messages[idx];
    if (targetMsg.role !== 'assistant') {
      return res.status(400).json({ error: "Can only rate assistant messages" });
    }

    // 1. Update Message with Feedback
    targetMsg.feedback = {
      rating,
      notes,
      createdAt: new Date()
    };

    messages[idx] = targetMsg;
    session.messages = messages;
    session.changed('messages', true);
    await session.save();

    // 2. Adjust Intelligence (Confidence Score)
    // Only if rating provided
    if (rating && targetMsg.ai_metadata && targetMsg.ai_metadata.sources) {
      for (const source of targetMsg.ai_metadata.sources) {
        if (source.sourceId) {
          const knowledge = await ConnectionKnowledge.findByPk(source.sourceId);
          if (knowledge) {
            let score = knowledge.confidenceScore || 0.5;

            if (rating === 'CORRECT') {
              score = Math.min(score + 0.1, 1.0); // Boost
            } else if (rating === 'INCORRECT') {
              score = Math.max(score - 0.2, 0.0); // Penalize harder
            }

            knowledge.confidenceScore = score;
            await knowledge.save();
          }
        }
      }
    }

    res.json({ success: true, message: "Feedback received" });

  } catch (error) {
    console.error("Feedback Error:", error);
    res.status(500).json({ error: error.message });
  }
};
