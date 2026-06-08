import { z } from "zod";

export const storySchema = z.object({
  title: z.string().min(5, "User Story title must be at least 5 characters"),
  description: z.string().optional(),
  plannedHours: z.coerce
    .number()
    .min(1, "Planned budget hours must be at least 1 hour")
    .max(80, "User Stories cannot exceed an 80-hour scope budget"),
});