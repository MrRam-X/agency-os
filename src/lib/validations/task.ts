import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(5, "Task title must be at least 5 characters"),
  description: z.string().optional(),
  assignedTo: z.string().min(1, "Task must be assigned to an employee"),
  estimatedHours: z.coerce
    .number()
    .min(1, "Task estimate must be at least 1 hour")
    .max(16, "Individual developer tasks are capped at a 16-hour single estimation limit"),
  type: z.enum(["BUG", "TASK", "CHANGE_REQUEST"]).default("TASK"), // 🟢 Added Zod enum validation
});

export const adminTaskSchema = z.object({
  title: z.string().min(5, "Task title must be at least 5 characters"),
  description: z.string().optional(),
  assignedTo: z.string().min(1, "Task must be assigned to an employee"),
  estimatedHours: z.coerce
    .number()
    .min(1, "Task estimate must be at least 1 hour")
    .max(16, "Individual developer tasks are capped at a 16-hour single estimation limit"),
  type: z.enum(["BUG", "TASK", "CHANGE_REQUEST"]),
  status: z.enum(["TO_DO", "IN_PROGRESS", "REVIEW", "DONE"]),
  completionDate: z.string().optional().nullable(), // Optional: only populated if status is DONE
});