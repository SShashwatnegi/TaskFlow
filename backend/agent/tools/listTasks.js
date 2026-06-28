const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Task = require("../../models/Task");

const listTasksTool = tool(
  async ({ startDate, endDate, category, priority, done, searchQuery }, config) => {
    try {
      const userId = config.configurable?.userId;
      if (!userId) return JSON.stringify({ error: "No user context" });

      const query = { user: userId };

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) {
          const endD = new Date(endDate);
          if (endDate.length <= 10) {
            endD.setUTCHours(23, 59, 59, 999);
          }
          query.date.$lte = endD;
        }
      }
      if (category) query.category = category;
      if (priority) query.priority = priority;
      if (done !== undefined && done !== null) query.done = done;
      if (searchQuery) {
        query.$or = [
          { title: { $regex: searchQuery, $options: "i" } },
          { notes: { $regex: searchQuery, $options: "i" } },
        ];
      }

      const tasks = await Task.find(query).sort({ date: 1 }).limit(100);

      if (tasks.length === 0) {
        return JSON.stringify({ tasks: [], message: "No tasks found matching your criteria." });
      }

      const formatted = tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        date: t.date?.toISOString(),
        endDate: t.endDate?.toISOString(),
        category: t.category,
        priority: t.priority,
        done: t.done,
        notes: t.notes || "",
      }));

      return JSON.stringify({ tasks: formatted, count: formatted.length });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "list_tasks",
    description:
      "List and search tasks/events in the user's calendar. Use this to find tasks by date range, category, priority, completion status, or search text. Always use this before updating or deleting tasks to get their IDs.",
    schema: z.object({
      startDate: z
        .string()
        .optional()
        .describe("ISO date string for the start of the range (inclusive)"),
      endDate: z
        .string()
        .optional()
        .describe("ISO date string for the end of the range (inclusive)"),
      category: z
        .enum(["meeting", "academic", "health", "personal", "social", "task"])
        .optional()
        .describe("Filter by category"),
      priority: z
        .enum(["high", "medium", "low"])
        .optional()
        .describe("Filter by priority"),
      done: z.boolean().optional().describe("Filter by completion status"),
      searchQuery: z
        .string()
        .optional()
        .describe("Search text to match against title or notes"),
    }),
  }
);

module.exports = listTasksTool;
