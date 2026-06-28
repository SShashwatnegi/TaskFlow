const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Task = require("../../models/Task");

const createTaskTool = tool(
  async ({ tasks }, config) => {
    try {
      const userId = config.configurable?.userId;
      if (!userId) return JSON.stringify({ error: "No user context" });

      const created = [];

      for (const t of tasks) {
        const taskData = {
          user: userId,
          title: t.title,
          date: new Date(t.date),
          endDate: t.endDate ? new Date(t.endDate) : new Date(new Date(t.date).getTime() + 60 * 60000),
          priority: t.priority || "medium",
          category: t.category || "task",
          notes: t.notes || "",
          done: false,
        };

        const newTask = new Task(taskData);
        await newTask.save();
        created.push({
          id: newTask._id.toString(),
          title: newTask.title,
          date: newTask.date.toISOString(),
          endDate: newTask.endDate.toISOString(),
          category: newTask.category,
          priority: newTask.priority,
        });
      }

      return JSON.stringify({
        created,
        count: created.length,
        message: `Successfully created ${created.length} task(s).`,
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "create_tasks",
    description:
      "Create one or more new tasks/events in the user's calendar. Supports bulk creation for recurring events. Each task needs at minimum a title and date.",
    schema: z.object({
      tasks: z
        .array(
          z.object({
            title: z.string().describe("Task title"),
            date: z.string().describe("ISO date string for the task start time"),
            endDate: z.string().optional().describe("ISO date string for end time. Defaults to 1 hour after start."),
            priority: z.enum(["high", "medium", "low"]).optional().describe("Priority level"),
            category: z
              .enum(["meeting", "academic", "health", "personal", "social", "task"])
              .optional()
              .describe("Category"),
            notes: z.string().optional().describe("Additional notes"),
          })
        )
        .describe("Array of tasks to create"),
    }),
  }
);

module.exports = createTaskTool;
