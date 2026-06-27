"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User, UserRole } from "@/models/User";
import { employeeSchema, editEmployeeSchema } from "@/lib/validations/employee";

// 🟢 Add editEmployeeSchema and UserRole imports at the to
interface EmployeeUpdatePayload {
  name: string;
  email: string;
  role: UserRole;
  billableRate: number;
  skills: string[];
  password?: string;
  requirePasswordChange?: boolean;
}

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

/**
 * 🟢 MUTATION: Edit Employee Settings
 * Secures timesheets by restricting credentials management strictly to the OWNER [4].
 */
export async function updateEmployee(employeeId: string, rawData: unknown) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { error: "Authentication required." };
    }

    // 🛡️ Security Gate: Only the OWNER can modify employee credentials [5]
    if (session.user.role !== "OWNER") {
      return { error: "Unauthorized: Only Owners can modify employee profiles." };
    }

    await connectDB();

    // Validate edit inputs
    const validated = editEmployeeSchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues.map((err) => err.message).join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { name, email, password, role, billableRate, skills } = validated.data;
    const lowerEmail = email.toLowerCase().trim();

    // Ensure email is unique across other users in the system
    const emailInUse = await User.findOne({ email: lowerEmail, _id: { $ne: employeeId } });
    if (emailInUse) {
      return { error: "This email address is already in use by another account." };
    }

    const updatePayload: EmployeeUpdatePayload = {
      name,
      email: lowerEmail,
      role,
      billableRate,
      skills,
    };

    // If password was typed and meets criteria, hash and inject it
    if (password && password.trim().length >= 6) {
      const hashedPassword = await hash(password, 12);
      updatePayload.password = hashedPassword;
      updatePayload.requirePasswordChange = true; // Force change again since password reset occurred
    }

    await User.updateOne({ _id: employeeId }, { $set: updatePayload });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update employee server action error:", error);
    return { error: "An unexpected server error occurred during employee update." };
  }
}
