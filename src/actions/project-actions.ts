"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { projectSchema } from "@/lib/validations/project";
import { sprintSchema } from "@/lib/validations/sprint";
import { storySchema } from "@/lib/validations/story";
import { Project } from "@/models/Project";
import { Sprint } from "@/models/Sprint";
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

export async function createUserStory(projectId: string, rawData: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role, orgId, id: userId } = session.user;
    if (role !== "OWNER" && role !== "MANAGER" && role !== "TEAM_LEAD") {
      return {
        error: "Unauthorized: Only Managers and Leads can create user stories.",
      };
    }

    await connectDB();

    const validated = storySchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { title, description, plannedHours } = validated.data;

    // Create User Story defaulting to unassigned BACKLOG state
    await UserStory.create({
      orgId,
      projectId,
      sprintId: null, // Null indicates backlog
      title,
      description,
      plannedHours,
      status: "BACKLOG",
      createdBy: userId,
      completionDate: null,
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Create user story error:", error);
    return {
      error: "An unexpected server error occurred during story creation.",
    };
  }
}

export async function deleteUserStory(projectId: string, storyId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role } = session.user;
    if (role !== "OWNER" && role !== "MANAGER" && role !== "TEAM_LEAD") {
      return {
        error: "Unauthorized: Only Managers and Leads can delete stories.",
      };
    }

    await connectDB();

    // 🛡️ Cascading Deletion: Query tasks associated with this story to purge timesheets [21]
    const taskIds = await Task.find({ storyId }).distinct("_id");

    await UserStory.deleteOne({ _id: storyId });
    await Task.deleteMany({ storyId });
    await Ledger.deleteMany({ taskId: { $in: taskIds } });

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Cascading story deletion error:", error);
    return {
      error: "An unexpected server error occurred during story deletion.",
    };
  }
}

export async function updateUserStory(
  projectId: string,
  storyId: string,
  rawData: unknown,
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role } = session.user;
    if (role !== "OWNER" && role !== "MANAGER" && role !== "TEAM_LEAD") {
      return {
        error: "Unauthorized: Only Managers and Leads can update stories.",
      };
    }

    await connectDB();

    const validated = storySchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { title, description, plannedHours } = validated.data;

    await UserStory.updateOne(
      { _id: storyId },
      { $set: { title, description, plannedHours } },
    );

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Update story error:", error);
    return {
      error: "An unexpected server error occurred during story update.",
    };
  }
}

export async function createSprintWithStories(
  projectId: string,
  sprintRawData: unknown,
  selectedStoryIds: string[],
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role, orgId, id: userId } = session.user;
    if (role !== "OWNER" && role !== "MANAGER") {
      return {
        error: "Unauthorized: Only Managers and Owners can launch sprints.",
      };
    }

    await connectDB();

    const validated = sprintSchema.safeParse(sprintRawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { name, startDate, endDate } = validated.data;

    // 1. Create the Sprint document
    const newSprint = await Sprint.create({
      orgId,
      projectId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "PLANNING",
      createdBy: userId,
    });

    // 2. If stories were selected, bulk assign them to this sprint and shift to CONFIRMED [21]
    if (selectedStoryIds.length > 0) {
      await UserStory.updateMany(
        { _id: { $in: selectedStoryIds }, orgId },
        {
          $set: {
            sprintId: newSprint._id,
            status: "CONFIRMED",
          },
        },
      );
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Sprint creation with stories error:", error);
    return {
      error: "An unexpected server error occurred during sprint launch.",
    };
  }
}

export async function deleteSprint(projectId: string, sprintId: string) {
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

    // 🛡️ Cascading Deletion Logic: Query child documents to clean up tasks and ledger [21]
    const storyIds = await UserStory.find({ sprintId }).distinct("_id");
    const taskIds = await Task.find({ storyId: { $in: storyIds } }).distinct(
      "_id",
    );

    await Sprint.deleteOne({ _id: sprintId });
    await UserStory.deleteMany({ sprintId });
    await Task.deleteMany({ storyId: { $in: storyIds } });
    await Ledger.deleteMany({ taskId: { $in: taskIds } });

    // 🟢 Revalidates the specific Project Workspace instead of the top-level list [1]
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Cascading sprint deletion error:", error);
    return {
      error: "An unexpected server error occurred during sprint deletion.",
    };
  }
}

export async function updateSprint(
  projectId: string,
  sprintId: string,
  rawData: unknown,
) {
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

    // 🟢 Revalidates the specific Project Workspace instead of the top-level list [1]
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Update sprint error:", error);
    return {
      error: "An unexpected server error occurred during sprint update.",
    };
  }
}

export async function startSprint(projectId: string, sprintId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role } = session.user;
    if (role !== "OWNER" && role !== "MANAGER") {
      return { error: "Unauthorized: Only Managers can start sprints." };
    }

    await connectDB();

    // 🛡️ Strict Agile Rule: Only ONE active sprint is allowed per project at a time
    const activeSprint = await Sprint.findOne({ projectId, status: "ACTIVE" });
    if (activeSprint) {
      return {
        error: `Cannot start sprint. "${activeSprint.name}" is currently ACTIVE. Complete or pause it first.`,
      };
    }

    await Sprint.updateOne({ _id: sprintId }, { $set: { status: "ACTIVE" } });

    revalidatePath(`/dashboard/board/${sprintId}`);
    return { success: true };
  } catch (error) {
    console.error("Start sprint error:", error);
    return { error: "An unexpected server error occurred." };
  }
}

export async function completeSprint(projectId: string, sprintId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role, orgId } = session.user;
    if (role !== "OWNER" && role !== "MANAGER") {
      return { error: "Unauthorized: Only Managers can complete sprints." };
    }

    await connectDB();

    // 1. Fetch all User Stories currently mapped to this sprint
    const stories = await UserStory.find({ sprintId, orgId });

    for (const story of stories) {
      // Fetch all sub-tasks belonging to this story
      const tasks = await Task.find({ storyId: story._id });

      const hasTasks = tasks.length > 0;
      const allTasksDone = hasTasks && tasks.every((t) => t.status === "DONE");

      if (allTasksDone) {
        // Story is completed: Mark status as COMPLETED and stamp the completionDate
        await UserStory.updateOne(
          { _id: story._id },
          { $set: { status: "COMPLETED", completionDate: new Date() } },
        );
      } else {
        // 🛡️ Spill-over Handling: Move incomplete story and its tasks back to the Product Backlog [21]
        await UserStory.updateOne(
          { _id: story._id },
          { $set: { sprintId: null, status: "BACKLOG" } },
        );
        // Reset the denormalized sprintId on all its child tasks
        await Task.updateMany(
          { storyId: story._id },
          { $set: { sprintId: null } },
        );
      }
    }

    // 2. Close the Sprint
    await Sprint.updateOne(
      { _id: sprintId },
      { $set: { status: "COMPLETED" } },
    );

    revalidatePath(`/dashboard/board/${sprintId}`);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Complete sprint error:", error);
    return {
      error: "An unexpected server error occurred during sprint closure.",
    };
  }
}

export async function pullStoryIntoSprint(projectId: string, storyId: string, sprintId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role } = session.user;
    if (role !== "OWNER" && role !== "MANAGER" && role !== "TEAM_LEAD") {
      return { error: "Unauthorized: Only Managers and Leads can manage sprint backlogs." };
    }

    await connectDB();

    // Update story to link to this sprint and shift its status to CONFIRMED
    await UserStory.updateOne(
      { _id: storyId },
      { $set: { sprintId, status: "CONFIRMED" } }
    );

    revalidatePath(`/dashboard/board/${sprintId}`);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("Pull story into sprint error:", error);
    return { error: "An unexpected server error occurred." };
  }
}
