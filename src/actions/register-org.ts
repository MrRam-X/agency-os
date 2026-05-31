"use server";

import { hash } from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Organization } from "@/models/Organization";
import { User } from "@/models/User";
import { registerSchema } from "@/lib/validations/register";

export async function registerOrg(rawData: unknown) {
  let createdOrgId: string | null = null;
  try {
    // 1. Establish Database Connection
    await connectDB();

    // 2. Validate input using our strict Zod schema (with lowercase-only alphabetic regex)
    const validated = registerSchema.safeParse(rawData);
    if (!validated.success) {
      const errorMsg = validated.error.issues.map((err) => err.message).join(", ");
      return { error: `Validation failed: ${errorMsg}` };
    }

    const { name, email, password, orgName, orgShortName } = validated.data;

    // 3. Uniqueness Check: Organization Slug (Short Name)
    const existingOrg = await Organization.findOne({ shortName: orgShortName });
    if (existingOrg) {
      return { error: "This organization short name is already taken." };
    }

    // 4. Uniqueness Check: Owner Email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { error: "This email address is already registered." };
    }

    // 5. Create Organization document (Owner ID set to null temporarily)
    const newOrg = await Organization.create({
      orgName,
      shortName: orgShortName,
      ownerId: null,
    });
    createdOrgId = newOrg._id.toString();

    // 6. Hash Owner Password and Create User document
    const hashedPassword = await hash(password, 12);
    const newOwner = await User.create({
      orgId: newOrg._id,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "OWNER",
      requirePasswordChange: false, // Owners manage their own account credentials
      billableRate: 0,
      skills: [],
    });

    // 7. Complete the bidirectional link by assigning Owner ID to the Organization
    await Organization.updateOne(
      { _id: newOrg._id },
      { $set: { ownerId: newOwner._id } }
    );

    return { success: true };
  } catch (error) {
    console.error("Registration transaction error:", error);

    // 🛡️ Rollback cleanup: Delete the orphaned Organization if the Owner user creation failed
    if (createdOrgId) {
      try {
        await Organization.deleteOne({ _id: createdOrgId });
        console.log(`Rollback success: Orphaned organization ${createdOrgId} deleted.`);
      } catch (cleanupError) {
        console.error("Critical: Failed to perform rollback cleanup:", cleanupError);
      }
    }

    return { error: "An unexpected server error occurred during registration. Please try again." };
  }
}