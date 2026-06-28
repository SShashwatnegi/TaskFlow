const { ChatGroq } = require("@langchain/groq");
const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { HumanMessage, AIMessage, SystemMessage } = require("@langchain/core/messages");

const SYSTEM_PROMPT = require("./systemPrompt");
const listTasksTool = require("./tools/listTasks");
const createTaskTool = require("./tools/createTask");
const updateTaskTool = require("./tools/updateTask");
const deleteTasksTool = require("./tools/deleteTasks");
const cloneMonthTool = require("./tools/cloneMonth");
const rescheduleTool = require("./tools/reschedule");
const changePriorityTool = require("./tools/changePriority");

// In-memory conversation history per user (resets on server restart)
const conversationHistory = new Map();
const MAX_HISTORY = 20; // Keep last 20 messages per user

const tools = [
  listTasksTool,
  createTaskTool,
  updateTaskTool,
  deleteTasksTool,
  cloneMonthTool,
  rescheduleTool,
  changePriorityTool,
];

/**
 * Create and run the TaskFlow AI agent
 * 
 */

console.log("ENV CHECK:", process.env.GROQ_API_KEY);
console.log("ENV FILE PATH:", require("path").resolve(".env"));
async function runAgent(userId, userMessage) {
  console.log("GROQ KEY BEING USED:", process.env.GROQ_API_KEY);
  // Initialize the LLM — Groq (free tier)
  const llm = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    apiKey: process.env.GROQ_API_KEY,
  });

  // Create the agent using LangGraph's prebuilt createReactAgent
  const agent = createReactAgent({
    llm,
    tools,
    messageModifier: SYSTEM_PROMPT,
  });

  // Get or create conversation history for this user
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, []);
  }
  const history = conversationHistory.get(userId);

  // Add current date/time context to the user message
  const now = new Date();
  const contextMessage = `[Current date/time: ${now.toISOString()} | ${now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })} ${now.toLocaleTimeString("en-US")}]\n\n${userMessage}`;

  // Build the messages array for the agent
  const messages = [
    ...history,
    new HumanMessage(contextMessage),
  ];

  // Run the agent
  const result = await agent.invoke(
    { messages },
    { configurable: { userId } }
  );

  // Extract the final AI response
  const responseMessages = result.messages;
  const lastAiMessage = responseMessages
    .filter((m) => m._getType() === "ai" && m.content && typeof m.content === "string" && m.content.trim())
    .pop();

  const reply = lastAiMessage?.content || "I completed the operation but have nothing to add.";

  // Update conversation history
  history.push(new HumanMessage(userMessage));
  history.push(new AIMessage(reply));

  // Trim history if too long
  while (history.length > MAX_HISTORY * 2) {
    history.shift();
  }

  // Determine which tools were called by inspecting intermediate messages
  const actions = [];
  for (const msg of responseMessages) {
    if (msg._getType() === "ai" && msg.tool_calls && msg.tool_calls.length > 0) {
      for (const tc of msg.tool_calls) {
        actions.push({
          tool: tc.name,
          input: tc.args,
        });
      }
    }
  }

  // Determine if calendar should be refreshed
  const mutatingTools = ["create_tasks", "update_tasks", "delete_tasks", "clone_month", "bulk_reschedule", "change_priority"];
  const shouldRefresh = actions.some((a) => mutatingTools.includes(a.tool));

  return {
    message: reply,
    actions,
    shouldRefresh,
  };
}

/**
 * Clear conversation history for a user
 */
function clearHistory(userId) {
  conversationHistory.delete(userId);
}

module.exports = { runAgent, clearHistory };