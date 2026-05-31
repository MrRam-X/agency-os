import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
  orgShortName: z
    .string()
    .min(2, "Short name must be at least 2 characters")
    .regex(/^[a-z]+$/, "Short name can only contain letters")
    .transform((val) => val.toLowerCase().trim()),
});