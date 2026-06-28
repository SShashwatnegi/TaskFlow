const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Task = require("../../models/Task");

const updateTaskTool = tool(
  async ({ updates }, config) => {
    try {
      const userId = config.configurable?.userId;
      if (!userId) return JSON.stringify({ error: "No user context" });

      const results = [];

      for (const u of updates) {
        if (!u.taskId) {
          return JSON.stringify({ error: "taskId is required. You MUST call list_tasks first to get task IDs before updating." });
        }
        const updateFields = {};
        if (u.title !== undefined) updateFields.title = u.title;
        if (u.date !== undefined) updateFields.date = new Date(u.date);
        if (u.endDate !== undefined) updateFields.endDate = new Date(u.endDate);
        if (u.priority !== undefined) updateFields.priority = u.priority;
        if (u.category !== undefined) updateFields.category = u.category;
        if (u.notes !== undefined) updateFields.notes = u.notes;
        if (u.done !== undefined) updateFields.done = u.done;

        const task = await Task.findOneAndUpdate(
          { _id: u.taskId, user: userId },
          { $set: updateFields },
          { new: true }
        );

        if (task) {
          results.push({
            id: task._id.toString(),
            title: task.title,
            date: task.date?.toISOString(),
            endDate: task.endDate?.toISOString(),
            category: task.category,
            priority: task.priority,
            done: task.done,
            status: "updated",
          });
        } else {
          results.push({ id: u.taskId, status: "not_found" });
        }
      }

      const updated = results.filter((r) => r.status === "updated");
      const notFound = results.filter((r) => r.status === "not_found");

      return JSON.stringify({
        results,
        updatedCount: updated.length,
        notFoundCount: notFound.length,
        message: `Updated ${updated.length} task(s).${notFound.length > 0 ? ` ${notFound.length} task(s) not found.` : ""}`,
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "update_tasks",
    description:
      "Update one or more existing tasks. Use this to reschedule, change priority, mark done/undone, edit title/notes, or change category. You MUST first use list_tasks to get the task IDs.",
    schema: z.object({
      updates: z
        .array(
          z.object({
            taskId: z.string().describe("The MongoDB _id of the task to update"),
            title: z.string().optional().describe("New title"),
            date: z.string().optional().describe("New start date (ISO string)"),
            endDate: z.string().optional().describe("New end date (ISO string)"),
            priority: z.enum(["high", "medium", "low"]).optional().describe("New priority"),
            category: z
              .enum(["meeting", "academic", "health", "personal", "social", "task"])
              .optional()
              .describe("New category"),
            notes: z.string().optional().describe("New notes"),
            done: z.boolean().optional().describe("Mark as done or undone"),
          })
        )
        .describe("Array of task updates to apply"),
    }),
  }
);

module.exports = updateTaskTool;
