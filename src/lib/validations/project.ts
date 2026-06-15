import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().optional(),
  billingType: z.enum(["FIXED_PRICE", "TIME_AND_MATERIALS"]),
  blendedRate: z.coerce.number().min(0, "Blended rate must be 0 or greater"),
  members: z.array(z.string()).min(1, "Assign at least one team member to this project"),
});