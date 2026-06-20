"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { Ledger } from "@/models/Ledger";
import { IDailyLogGroup, IAuditLedgerEntry } from "@/types/ledger";
import { UserStory } from "@/models/UserStory";

// Custom interface for the dynamic story-level budget variance checks
export interface ISprintVarianceItem {
  _id: string; // UserStory ID
  title: string;
  plannedHours: number;
  actualHours: number;
  variance: number;
}

/**
 * 🟢 PIPELINE 1: Developer Daily Completed Tasks Aggregation (With Lookups & Date Filters)
 */
export async function getDailyTaskLogs(
  targetUserId?: string,
  start?: string,
  end?: string,
): Promise<{ success?: boolean; logs?: IDailyLogGroup[]; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { error: "Authentication required." };
    }

    const userId = targetUserId || session.user.id;

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 🟢 Dynamic Date Filtering logic
    let matchStart: Date;
    let matchEnd: Date;

    if (start && end) {
      // Custom Date Range (Inclusive)
      matchStart = new Date(start + "T00:00:00");
      matchEnd = new Date(end + "T23:59:59.999");
    } else {
      // 🟢 Default: Restrict display to exactly the last 7 days of logs
      matchEnd = new Date();
      matchStart = new Date();
      matchStart.setDate(matchStart.getDate() - 7);
      matchStart.setHours(0, 0, 0, 0);
    }

    // Run the cascading aggregation pipeline [1]
    const rawLogs = await Task.aggregate([
      // 1. Match standard developer tasks completed within the date range [1]
      {
        $match: {
          assignedTo: userObjectId,
          status: "DONE",
          completionDate: { $gte: matchStart, $lte: matchEnd },
        },
      },
      // 2. Joins UserStory collection to extract the projectId [1]
      {
        $lookup: {
          from: "userstories",
          let: { storyIdObj: "$storyId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$storyIdObj" }] },
              },
            },
          ],
          as: "storyDoc",
        },
      },
      { $unwind: "$storyDoc" },
      // 3. Joins Projects collection using the populated projectId to get Project Name [1]
      {
        $lookup: {
          from: "projects",
          let: { projIdObj: "$storyDoc.projectId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$projIdObj" }] },
              },
            },
          ],
          as: "projectDoc",
        },
      },
      { $unwind: "$projectDoc" },
      // 4. Group by Day, pushing Task fields and Project Name [1]
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$completionDate" },
          },
          tasks: {
            $push: {
              id: { $toString: "$_id" },
              title: "$title",
              type: "$type",
              estimatedHours: "$estimatedHours",
              projectName: "$projectDoc.name", // 🟢 Saved from join!
            },
          },
          totalEstimatedHours: { $sum: "$estimatedHours" },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    return {
      success: true,
      logs: JSON.parse(JSON.stringify(rawLogs)) as IDailyLogGroup[],
    };
  } catch (error) {
    console.error("Fetch daily task logs pipeline error:", error);
    return { error: "An unexpected database aggregation error occurred." };
  }
}

/**
 * 🟢 PIPELINE 2: Manager Timesheet Audit Ledger
 */
export async function getManagerAuditLedger(): Promise<{
  success?: boolean;
  ledger?: IAuditLedgerEntry[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { error: "Authentication required." };
    }

    const { role, orgId } = session.user;
    if (role !== "OWNER" && role !== "MANAGER" && role !== "TEAM_LEAD") {
      return {
        error: "Unauthorized: Access restricted to administrative roles.",
      };
    }

    await connectDB();

    const rawLedger = await Ledger.aggregate([
      {
        $match: {
          orgId: new RegExp(`^${orgId}$`, "i"),
          billingStatus: "UNBILLED",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userIdObj: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$userIdObj" }] },
              },
            },
          ],
          as: "userDoc",
        },
      },
      { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "tasks",
          let: { taskIdObj: "$taskId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$taskIdObj" }] },
              },
            },
          ],
          as: "taskDoc",
        },
      },
      { $unwind: { path: "$taskDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: { $toString: "$_id" },
          orgId: { $toString: "$orgId" },
          userId: { $toString: "$userId" },
          taskId: { $toString: "$taskId" },
          storyId: { $toString: "$storyId" },
          hoursLogged: 1,
          billingStatus: 1,
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          devName: { $ifNull: ["$userDoc.name", "Unknown Developer"] },
          taskTitle: { $ifNull: ["$taskDoc.title", "Unknown Task"] },
          taskType: { $ifNull: ["$taskDoc.type", "TASK"] },
        },
      },
      {
        $sort: { date: -1 },
      },
    ]);

    return {
      success: true,
      ledger: JSON.parse(JSON.stringify(rawLedger)) as IAuditLedgerEntry[],
    };
  } catch (error) {
    console.error("Fetch manager audit ledger pipeline error:", error);
    return { error: "An unexpected database aggregation error occurred." };
  }
}

/**
 * 🟢 PIPELINE 3: Story-level Budget Variance Aggregator
 * Joins UserStories with their active timesheet Ledger logs to calculate planned vs. actual variance [1, 8].
 */
export async function getSprintVariance(
  sprintId: string,
): Promise<{
  success?: boolean;
  variance?: ISprintVarianceItem[];
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { orgId } = session.user;

    await connectDB();

    // Single-trip database aggregation joining Stories with Ledgers [1, 8]
    const rawVariance = await UserStory.aggregate([
      {
        $match: {
          sprintId: new mongoose.Types.ObjectId(sprintId),
          orgId: new mongoose.Types.ObjectId(orgId),
        },
      },
      // Join Ledgers to sum up actual hours spent on tasks under this story [1]
      {
        $lookup: {
          from: "ledgers",
          let: { storyIdObj: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$storyId", { $toObjectId: "$$storyIdObj" }] },
              },
            },
            { $group: { _id: null, totalActual: { $sum: "$hoursLogged" } } },
          ],
          as: "ledgerDocs",
        },
      },
      { $unwind: { path: "$ledgerDocs", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: { $toString: "$_id" },
          title: 1,
          plannedHours: 1,
          actualHours: { $ifNull: ["$ledgerDocs.totalActual", 0] },
          variance: {
            $subtract: [
              "$plannedHours",
              { $ifNull: ["$ledgerDocs.totalActual", 0] },
            ],
          },
        },
      },
    ]);

    return {
      success: true,
      variance: JSON.parse(
        JSON.stringify(rawVariance),
      ) as ISprintVarianceItem[],
    };
  } catch (error) {
    console.error("Fetch sprint variance aggregation error:", error);
    return { error: "An unexpected database aggregation error occurred." };
  }
}

/**
 * 🟢 MUTATION: Secure Timesheet Date Override
 * Allows only Managers and Owners to correct historical timesheet dates in MongoDB [4].
 */
export async function updateLedgerDate(logId: string, newDateStr: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role, orgId } = session.user;

    // 🛡️ Security Gate: Only Managers or Owners can override historical logs [5]
    if (role !== "OWNER" && role !== "MANAGER") {
      return {
        error:
          "Unauthorized: Only Managers and Owners can modify historical timesheets.",
      };
    }

    await connectDB();

    const newDate = new Date(newDateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Enforce business constraint: Future timesheet logs are strictly prohibited [13]
    if (newDate > today) {
      return {
        error:
          "Validation Error: Cannot log or edit timesheets to future dates.",
      };
    }

    await Ledger.updateOne({ _id: logId, orgId }, { $set: { date: newDate } });

    revalidatePath("/dashboard/ledger");
    return { success: true };
  } catch (error) {
    console.error("Update ledger date error:", error);
    return {
      error: "An unexpected server error occurred during timesheet override.",
    };
  }
}

/**
 * 🟢 MUTATION: Bulk Timesheet Invoice Reconciliation & State Lock
 * Bulk updates unbilled timesheet documents to "BILLED" state, locking them from modifications [21].
 */
export async function reconcileInvoice(logIds: string[]) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return { error: "Authentication required." };

    const { role, orgId } = session.user;
    
    // 🛡️ Security Gate: Only Managers or Owners can reconcile and lock billing logs [5]
    if (role !== "OWNER" && role !== "MANAGER") {
      return { error: "Unauthorized: Only Managers and Owners can execute invoice reconciliation." };
    }

    if (logIds.length === 0) {
      return { error: "No unbilled timesheet logs selected for reconciliation." };
    }

    await connectDB();

    // 🛡️ Transactional Update: Lock all selected ledger entries to BILLED state [21]
    await Ledger.updateMany(
      { _id: { $in: logIds }, orgId },
      { $set: { billingStatus: "BILLED" } }
    );

    // Purge caches to update timesheet lists and financial analytics instantly [1]
    revalidatePath("/dashboard/ledger");
    return { success: true };
  } catch (error) {
    console.error("Reconcile invoice server action error:", error);
    return { error: "An unexpected server error occurred during invoice reconciliation." };
  }
}