"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { employeeSchema } from "@/lib/validations/employee";

export async function addEmployee(rawData: unknown) {
  try {
    // 1. Authenticate session server-side
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { error: "Authentication required." };
    }

    // 🛡️ Security Gate: Only the Organization OWNER can provision new users
    if (session.user.role !== "OWNER") {
      return {
        error: "Unauthorized: Only Organization Owners can manage employees.",
      };
    }

    // 2. Validate input data using Zod
    const validated = employeeSchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((err) => err.message)
        .join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { name, email, password, role, billableRate, skills } =
      validated.data;
    const lowerEmail = email.toLowerCase().trim();

    await connectDB();

    // 3. Uniqueness Check: Ensure employee email is unique globally
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return { error: "An employee with this email is already registered." };
    }

    // 4. Hash the temporary password
    const hashedPassword = await hash(password, 12);

    // 5. Insert new Employee bound securely to the Owner's orgId
    await User.create({
      orgId: session.user.orgId,
      name,
      email: lowerEmail,
      password: hashedPassword,
      role,
      requirePasswordChange: true, // Forces employee to reset password on first login
      billableRate,
      skills,
    });

    // 6. Purge Next.js page cache so the staff directory refreshes instantly
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Add employee server action error:", error);
    return {
      error: "An unexpected server error occurred during employee creation.",
    };
  }
}
