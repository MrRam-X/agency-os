"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { Sprint } from "@/models/Sprint";
import { projectSchema } from "@/lib/validations/project";
import { sprintSchema } from "@/lib/validations/sprint";
import { UserStory } from "@/models/UserStory";
import { Ledger } from "@/models/Ledger";
import { Task } from "@/models/Task";

export async function createProject(rawData: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    // 🛡️ Security Gate: Only Managers or Owners can build projects
    const { role, orgId, id: userId } = session.user;
    if (role !== "OWNER" && role !== "MANAGER") {
      return {
        error: "Unauthorized: Only Managers and Owners can create projects.",
      };
    }

    await connectDB();

    // Validate inputs
    const validated = projectSchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { name, description, billingType, blendedRate, members } =
      validated.data;

    // Create Project
    await Project.create({
      orgId,
      name,
      description,
      status: "ACTIVE",
      members,
      createdBy: userId,
      billingType,
      blendedRate,
    });

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    console.error("Create project error:", error);
    return {
      error: "An unexpected server error occurred during project creation.",
    };
  }
}

export async function createSprint(rawData: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    // 🛡️ Security Gate: Only Managers or Owners can launch sprints
    const { role, orgId, id: userId } = session.user;
    if (role !== "OWNER" && role !== "MANAGER") {
      return {
        error: "Unauthorized: Only Managers and Owners can create sprints.",
      };
    }

    await connectDB();

    // Validate inputs (including date chronological logic)
    const validated = sprintSchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { projectId, name, startDate, endDate } = validated.data;

    // Create Sprint (Initially defaults to PLANNING state)
    await Sprint.create({
      orgId,
      projectId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "PLANNING",
      createdBy: userId,
    });

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    console.error("Create sprint error:", error);
    return {
      error: "An unexpected server error occurred during sprint creation.",
    };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role } = session.user;
    if (role !== "OWNER" && role !== "MANAGER") {
      return {
        error: "Unauthorized: Only Managers and Owners can delete projects.",
      };
    }

    await connectDB();

    // 🛡️ Cascading Deletion Logic: Query child documents first to perform complete cleanup [21]
    const sprintIds = await Sprint.find({ projectId }).distinct("_id");
    const storyIds = await UserStory.find({
      sprintId: { $in: sprintIds },
    }).distinct("_id");
    const taskIds = await Task.find({ storyId: { $in: storyIds } }).distinct(
      "_id",
    );

    // Execute deletions sequentially inside the try block
    await Project.deleteOne({ _id: projectId });
    await Sprint.deleteMany({ projectId });
    await UserStory.deleteMany({ sprintId: { $in: sprintIds } });
    await Task.deleteMany({ storyId: { $in: storyIds } });
    await Ledger.deleteMany({ taskId: { $in: taskIds } });

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    console.error("Cascading project deletion error:", error);
    return {
      error: "An unexpected server error occurred during project deletion.",
    };
  }
}

export async function deleteSprint(sprintId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role } = session.user;
    if (role !== "OWNER" && role !== "MANAGER") {
      return {
        error: "Unauthorized: Only Managers and Owners can delete sprints.",
      };
    }

    await connectDB();

    // 🛡️ Cascading Deletion Logic: Query child documents to clean up the ledger [21]
    const storyIds = await UserStory.find({ sprintId }).distinct("_id");
    const taskIds = await Task.find({ storyId: { $in: storyIds } }).distinct(
      "_id",
    );

    await Sprint.deleteOne({ _id: sprintId });
    await UserStory.deleteMany({ sprintId });
    await Task.deleteMany({ storyId: { $in: storyIds } });
    await Ledger.deleteMany({ taskId: { $in: taskIds } });

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    console.error("Cascading sprint deletion error:", error);
    return {
      error: "An unexpected server error occurred during sprint deletion.",
    };
  }
}

export async function updateProject(projectId: string, rawData: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role } = session.user;
    if (role !== "OWNER" && role !== "MANAGER") {
      return {
        error: "Unauthorized: Only Managers and Owners can update projects.",
      };
    }

    await connectDB();

    const validated = projectSchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { name, description, billingType, blendedRate, members } =
      validated.data;

    await Project.updateOne(
      { _id: projectId },
      {
        $set: {
          name,
          description,
          billingType,
          blendedRate,
          members,
        },
      },
    );

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    console.error("Update project error:", error);
    return {
      error: "An unexpected server error occurred during project update.",
    };
  }
}

export async function updateSprint(sprintId: string, rawData: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role } = session.user;
    if (role !== "OWNER" && role !== "MANAGER") {
      return {
        error: "Unauthorized: Only Managers and Owners can update sprints.",
      };
    }

    await connectDB();

    const validated = sprintSchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { name, startDate, endDate } = validated.data;

    await Sprint.updateOne(
      { _id: sprintId },
      {
        $set: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
      },
    );

    revalidatePath("/dashboard/projects");
    return { success: true };
  } catch (error) {
    console.error("Update sprint error:", error);
    return {
      error: "An unexpected server error occurred during sprint update.",
    };
  }
}
