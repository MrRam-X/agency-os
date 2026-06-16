import { z } from "zod";

export const sprintSchema = z.object({
  name: z.string().min(3, "Sprint name must be at least 3 characters"),
  startDate: z.string().min(1, "Select a start date"),
  endDate: z.string().min(1, "Select an end date"),
  projectId: z.string().optional(), // 🟢 Made optional as it is securely handled as a separate parameter
  selectedStories: z.array(z.string()).optional(), // 🟢 Added to match the client payload and avoid validation blocks
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be chronologically after the start date",
  path: ["endDate"],
});