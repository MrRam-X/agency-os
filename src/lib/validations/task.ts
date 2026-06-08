import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(5, "Task title must be at least 5 characters"),
  description: z.string().optional(),
  assignedTo: z.string().min(1, "Task must be assigned to an employee"),
  estimatedHours: z.coerce
    .number()
    .min(1, "Task estimate must be at least 1 hour")
    .max(16, "Individual developer tasks are capped at a 16-hour single estimation limit"),
});