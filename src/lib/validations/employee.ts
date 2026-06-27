import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["MANAGER", "HR", "TEAM_LEAD", "DEVELOPER", "TESTER"]),
  billableRate: z.coerce.number().min(0, "Billable rate must be 0 or greater"),
  // Takes comma-separated values (e.g. "React, Next, TS") and maps them to a clean array
  skills: z.string().transform((val) =>
    val
      ? val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  ),
});

// 🟢 Schema for editing: Password is optional, allowing they only modify other fields [13]
export const editEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.enum(["MANAGER", "HR", "TEAM_LEAD", "DEVELOPER", "TESTER"]),
  billableRate: z.coerce.number().min(0, "Billable rate must be 0 or greater"),
  skills: z.string().transform((val) => 
    val ? val.split(",").map((s) => s.trim()).filter(Boolean) : []
  ),
});