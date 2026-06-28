const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Task = require("../../models/Task");

const cloneMonthTool = tool(
  async ({ sourceYear, sourceMonth, targetYear, targetMonth }, config) => {
    try {
      const userId = config.configurable?.userId;
      if (!userId) return JSON.stringify({ error: "No user context" });

      // Get all tasks in the source month (month is 1-indexed from the agent)
      const startDate = new Date(sourceYear, sourceMonth - 1, 1);
      const endDate = new Date(sourceYear, sourceMonth, 0, 23, 59, 59, 999);

      const sourceTasks = await Task.find({
        user: userId,
        date: { $gte: startDate, $lte: endDate },
      });

      if (sourceTasks.length === 0) {
        return JSON.stringify({
          cloned: [],
          count: 0,
          message: `No tasks found in ${startDate.toLocaleString("en", { month: "long" })} ${sourceYear}.`,
        });
      }

      const created = [];
      const monthDiff = (targetYear - sourceYear) * 12 + (targetMonth - sourceMonth);

      for (const t of sourceTasks) {
        const newDate = new Date(t.date);
        newDate.setMonth(newDate.getMonth() + monthDiff);

        let newEndDate = null;
        if (t.endDate) {
          newEndDate = new Date(t.endDate);
          newEndDate.setMonth(newEndDate.getMonth() + monthDiff);
        }

        const newTask = new Task({
          user: userId,
          title: t.title,
          date: newDate,
          endDate: newEndDate || new Date(newDate.getTime() + 60 * 60000),
          priority: t.priority,
          category: t.category,
          notes: t.notes,
          done: false,
          remindersSent: 0,
        });

        await newTask.save();
        created.push({
          id: newTask._id.toString(),
          title: newTask.title,
          originalDate: t.date.toISOString(),
          newDate: newDate.toISOString(),
          category: newTask.category,
        });
      }

      const sourceMonthName = new Date(sourceYear, sourceMonth - 1).toLocaleString("en", { month: "long" });
      const targetMonthName = new Date(targetYear, targetMonth - 1).toLocaleString("en", { month: "long" });

      return JSON.stringify({
        cloned: created,
        count: created.length,
        message: `Successfully cloned ${created.length} task(s) from ${sourceMonthName} ${sourceYear} to ${targetMonthName} ${targetYear}.`,
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "clone_month",
    description:
      "Clone/copy all tasks from one month to another month. This is used for 'repeat this month to next month' type requests. All tasks keep their relative day-of-month and time but are shifted to the target month. Done status is reset to false.",
    schema: z.object({
      sourceYear: z.number().describe("Year of the source month (e.g. 2026)"),
      sourceMonth: z.number().min(1).max(12).describe("Source month number (1-12, where 1 = January)"),
      targetYear: z.number().describe("Year of the target month"),
      targetMonth: z.number().min(1).max(12).describe("Target month number (1-12)"),
    }),
  }
);

module.exports = cloneMonthTool;
