"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { taskSchema } from "@/lib/validations/task";
import { Task } from "@/models/Task";
import { Ledger } from "@/models/Ledger";

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
