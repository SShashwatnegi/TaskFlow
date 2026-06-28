const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { runAgent, clearHistory } = require("../agent/agent");

const router = express.Router();

// POST /api/agent/chat — Send a message to the AI agent
router.post("/chat", authMiddleware, async (req, res) => {
  console.log("🔥 /api/agent/chat route HIT");
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const userId = req.user.id;
    const result = await runAgent(userId, message.trim());

    res.status(200).json({
      reply: result.message,
      actions: result.actions,
      shouldRefresh: result.shouldRefresh,
    });
  } catch (error) {
    console.error("Agent error:", error);

    // Handle specific OpenAI errors
    if (error.message?.includes("API key")) {
      return res.status(500).json({ error: "Groq API key is not configured. Please set GROQ_API_KEY in .env" });
    }
    if (error.message?.includes("429") || error.message?.includes("rate limit")) {
      return res.status(429).json({ error: "Rate limit reached. Please wait a moment and try again." });
    }

    res.status(500).json({ error: "Something went wrong with the AI agent. Please try again." });
  }
});

// POST /api/agent/clear — Clear conversation history
router.post("/clear", authMiddleware, (req, res) => {
  clearHistory(req.user.id);
  res.status(200).json({ message: "Conversation history cleared" });
});

module.exports = router;
