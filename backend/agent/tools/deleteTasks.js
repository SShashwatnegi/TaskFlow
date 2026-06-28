const { tool } = require("@langchain/core/tools");
const { z } = require("zod");
const Task = require("../../models/Task");

const deleteTasksTool = tool(
  async ({ taskIds }, config) => {
    try {
      const userId = config.configurable?.userId;
      if (!userId) return JSON.stringify({ error: "No user context" });

      const results = [];

      for (const id of taskIds) {
        const task = await Task.findOneAndDelete({ _id: id, user: userId });
        if (task) {
          results.push({ id: task._id.toString(), title: task.title, status: "deleted" });
        } else {
          results.push({ id, status: "not_found" });
        }
      }

      const deleted = results.filter((r) => r.status === "deleted");
      const notFound = results.filter((r) => r.status === "not_found");

      return JSON.stringify({
        results,
        deletedCount: deleted.length,
        notFoundCount: notFound.length,
        message: `Deleted ${deleted.length} task(s).${notFound.length > 0 ? ` ${notFound.length} task(s) not found.` : ""}`,
      });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  },
  {
    name: "delete_tasks",
    description:
      "Delete one or more tasks by their IDs. You MUST first use list_tasks to get the task IDs and confirm with the user before deleting.",
    schema: z.object({
      taskIds: z.array(z.string()).describe("Array of task MongoDB _id values to delete"),
    }),
  }
);

module.exports = deleteTasksTool;
