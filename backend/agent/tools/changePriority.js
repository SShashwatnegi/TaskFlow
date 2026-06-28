const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Task = require("../../models/Task");

const changePriorityTool = tool(
  async ({ searchQuery, category, startDate, endDate, newPriority, taskIds }, config) => {
    try {
      const userId = config.configurable?.userId;
      if (!userId) return JSON.stringify({ error: "No user context" });

      let tasksToUpdate = [];

      // If specific task IDs are provided, use them directly
      if (taskIds && taskIds.length > 0) {
        tasksToUpdate = await Task.find({ _id: { $in: taskIds }, user: userId });
      } else {
        // Otherwise, find tasks by filters
        const query = { user: userId };

        if (startDate || endDate) {
          query.date = {};
          if (startDate) query.date.$gte = new Date(startDate);
          if (endDate) query.date.$lte = new Date(endDate);
        }
        if (category) query.category = category;
        if (searchQuery) {
          query.$or = [
            { title: { $regex: searchQuery, $options: "i" } },
            { notes: { $regex: searchQuery, $options: "i" } },
          ];
        }

        tasksToUpdate = await Task.find(query);
      }

      if (tasksToUpdate.length === 0) {
        return JSON.stringify({
          results: [],
          count: 0,
          message: "No tasks found matching your criteria.",
        });
      }

      const results = [];

      for (const task of tasksToUpdate) {
        const oldPriority = task.priority;
        task.priority = newPriority;
        await task.save();

        results.push({
          id: task._id.toString(),
          title: task.title,
          date: task.date?.toISOString(),
          oldPriority,
          newPriority,
          category: task.category,
        });
      }

      return JSON.stringify({
        results,
        count: results.length,
        message: `Successfully changed priority to "${newPriority}" for ${results.length} task(s).`,
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "change_priority",
    description:
      "Change the priority of one or more tasks/meetings. You can target tasks by their IDs, or by filtering with search text, category, and date range. Use this when the user wants to set priority to high, medium, or low for specific tasks or a group of tasks.",
    schema: z.object({
      taskIds: z
        .array(z.string())
        .optional()
        .describe("Specific task IDs to change priority for. Use list_tasks first to get IDs."),
      searchQuery: z
        .string()
        .optional()
        .describe("Search text to match against title or notes to find tasks"),
      category: z
        .enum(["meeting", "academic", "health", "personal", "social", "task"])
        .optional()
        .describe("Only change priority for tasks in this category"),
      startDate: z
        .string()
        .optional()
        .describe("ISO date string — only affect tasks on or after this date"),
      endDate: z
        .string()
        .optional()
        .describe("ISO date string — only affect tasks on or before this date"),
      newPriority: z
        .enum(["high", "medium", "low"])
        .describe("The new priority level to set"),
    }),
  }
);

module.exports = changePriorityTool;
