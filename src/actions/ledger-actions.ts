"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/Task";
import { Ledger } from "@/models/Ledger";
import { IDailyLogGroup, IAuditLedgerEntry } from "@/types/ledger";
import mongoose from "mongoose";

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
