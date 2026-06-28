const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Task = require("../../models/Task");

const rescheduleTool = tool(
  async ({ startDate, endDate, category, priority, shiftDays, searchQuery }, config) => {
    try {
      const userId = config.configurable?.userId;
      if (!userId) return JSON.stringify({ error: "No user context" });

      // Build the filter query
      const query = { user: userId };
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }
      if (category) query.category = category;
      if (priority) query.priority = priority;
      if (searchQuery) {
        query.$or = [
          { title: { $regex: searchQuery, $options: "i" } },
          { notes: { $regex: searchQuery, $options: "i" } },
        ];
      }

      const tasks = await Task.find(query);

      if (tasks.length === 0) {
        return JSON.stringify({
          results: [],
          count: 0,
          message: "No tasks found matching the criteria to reschedule.",
        });
      }

      const results = [];
      const shiftMs = shiftDays * 24 * 60 * 60 * 1000;

      for (const t of tasks) {
        const oldDate = new Date(t.date);
        const newDate = new Date(oldDate.getTime() + shiftMs);
        let newEndDate = null;
        if (t.endDate) {
          newEndDate = new Date(t.endDate.getTime() + shiftMs);
        }

        t.date = newDate;
        if (newEndDate) t.endDate = newEndDate;
        t.remindersSent = 0; // Reset reminders for rescheduled tasks
        await t.save();

        results.push({
          id: t._id.toString(),
          title: t.title,
          oldDate: oldDate.toISOString(),
          newDate: newDate.toISOString(),
          newEndDate: newEndDate?.toISOString(),
          category: t.category,
        });
      }

      return JSON.stringify({
        results,
        count: results.length,
        message: `Successfully rescheduled ${results.length} task(s) by ${shiftDays} day(s).`,
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "bulk_reschedule",
    description:
      "Shift/postpone multiple tasks by a number of days. Finds tasks matching the filter criteria and shifts all their dates by the specified number of days. Use positive values to postpone (move forward) and negative values to prepone (move backward). Good for 'push all my tasks by 2 days' or 'postpone all meetings this week by 1 day'.",
    schema: z.object({
      startDate: z
        .string()
        .optional()
        .describe("ISO date string — only reschedule tasks on or after this date"),
      endDate: z
        .string()
        .optional()
        .describe("ISO date string — only reschedule tasks on or before this date"),
      category: z
        .enum(["meeting", "academic", "health", "personal", "social", "task"])
        .optional()
        .describe("Only reschedule tasks in this category"),
      priority: z
        .enum(["high", "medium", "low"])
        .optional()
        .describe("Only reschedule tasks with this priority"),
      searchQuery: z
        .string()
        .optional()
        .describe("Only reschedule tasks matching this text in title/notes"),
      shiftDays: z
        .number()
        .describe("Number of days to shift. Positive = forward/postpone, Negative = backward/prepone"),
    }),
  }
);

module.exports = rescheduleTool;
