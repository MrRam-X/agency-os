"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { taskSchema } from "@/lib/validations/task";
import { Task } from "@/models/Task";
import { Ledger } from "@/models/Ledger";
export interface TaskStatusChange {
  taskId: string;
  status: "TO_DO" | "IN_PROGRESS" | "REVIEW" | "DONE";
}

export async function createTask(
  storyId: string,
  sprintId: string,
  rawData: unknown,
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { error: "Authentication required." };
    }

    const { orgId, id: userId } = session.user;

    await connectDB();

    // 1. Validate inputs using our task creation Zod schema
    const validated = taskSchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { title, description, assignedTo, estimatedHours } = validated.data;

    // 2. Create the Task initially in the TO_DO column
    const newTask = await Task.create({
      orgId,
      sprintId,
      storyId,
      assignedTo,
      title,
      description,
      status: "TO_DO",
      estimatedHours,
      createdBy: userId,
      completionDate: null,
    });

    // 3. Return serialized object for secure client-side Redux hydration [12]
    return {
      success: true,
      task: JSON.parse(JSON.stringify(newTask)),
    };
  } catch (error) {
    console.error("Create task server action error:", error);
    return {
      error: "An unexpected server error occurred during task creation.",
    };
  }
}

export async function deleteTask(sprintId: string, taskId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    await connectDB();

    // 🛡️ Cascade Deletion: Remove the task and any corresponding daily ledger entries
    await Task.deleteOne({ _id: taskId });
    await Ledger.deleteMany({ taskId });

    revalidatePath(`/dashboard/board/${sprintId}`);
    return { success: true };
  } catch (error) {
    console.error("Delete task error:", error);
    return { error: "An unexpected server error occurred during task deletion." };
  }
}

export async function updateTask(sprintId: string, taskId: string, rawData: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    await connectDB();

    const validated = taskSchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues.map((err) => err.message).join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { title, description, assignedTo, estimatedHours, type } = validated.data;

    await Task.updateOne(
      { _id: taskId },
      {
        $set: {
          title,
          description,
          assignedTo,
          estimatedHours,
          type,
        },
      }
    );

    revalidatePath(`/dashboard/board/${sprintId}`);
    return { success: true };
  } catch (error) {
    console.error("Update task error:", error);
    return { error: "An unexpected server error occurred during task update." };
  }
}

export async function commitBoardChanges(sprintId: string, changes: TaskStatusChange[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { orgId, id: userId } = session.user;

    await connectDB();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Process each changed task status and update its corresponding ledger entries
    for (const change of changes) {
      const { taskId, status } = change;

      // 1. Fetch current task from database to check old status
      const task = await Task.findOne({ _id: taskId, orgId });
      if (!task) continue;

      const oldStatus = task.status;
      let completionDate = task.completionDate;

      // 🛡️ Auto-Ledger Transition Gate 
      if (status === "DONE" && oldStatus !== "DONE") {
        // A. Transition TO DONE: Automatically generate a Ledger entry
        await Ledger.create({
          orgId,
          userId: task.assignedTo,
          taskId: task._id,
          storyId: task.storyId,
          hoursLogged: task.estimatedHours,
          billingStatus: "UNBILLED",
          date: new Date(),
        });
        completionDate = new Date();
      } else if (status !== "DONE" && oldStatus === "DONE") {
        // B. Reversal OUT OF DONE: Find and delete today's ledger entry to prevent billing leaks
        await Ledger.deleteMany({
          taskId: task._id,
          orgId,
          date: { $gte: startOfToday, $lte: endOfToday },
        });
        completionDate = null;
      }

      // 2. Commit status changes directly to MongoDB
      await Task.updateOne(
        { _id: taskId, orgId },
        { $set: { status, completionDate } }
      );
    }

    // 3. Purge Next.js page cache so the Board and Daily Logs are re-rendered instantly [1]
    revalidatePath(`/dashboard/board/${sprintId}`);
    revalidatePath("/dashboard/daily-logs");

    return { success: true };
  } catch (error) {
    console.error("Commit board changes error:", error);
    return { error: "An unexpected server error occurred during batch save." };
  }
}
