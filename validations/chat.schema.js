const { z } = require("zod");

/**
 * Schema for sending a chat message
 */
const sendMessageSchema = z.object({
    message: z.string().min(1, "Message is required").max(2000),
    connectionId: z.string().uuid("Invalid connectionId"),
    sessionId: z.string().min(1, "sessionId is required"),
    url: z.string().url("Invalid current page URL").optional(),
});

/**
 * Schema for submitting feedback
 */
const submitFeedbackSchema = z.object({
    sessionId: z.string().min(1, "sessionId is required"),
    messageIndex: z.number().int().min(0, "Invalid message index"),
    rating: z.enum(["CORRECT", "INCORRECT"]),
    notes: z.string().max(500).optional(),
});

module.exports = {
    sendMessageSchema,
    submitFeedbackSchema,
};
