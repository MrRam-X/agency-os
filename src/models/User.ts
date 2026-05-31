import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "OWNER" | "MANAGER" | "HR" | "TEAM_LEAD" | "DEVELOPER" | "TESTER";

export interface IUser extends Document {
  orgId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string; // Optional because we hash it and exclude it from standard reads
  role: UserRole;
  requirePasswordChange: boolean;
  billableRate: number;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "User must belong to an organization"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      enum: ["OWNER", "MANAGER", "HR", "TEAM_LEAD", "DEVELOPER", "TESTER"],
      default: "DEVELOPER",
    },
    requirePasswordChange: {
      type: Boolean,
      default: true,
    },
    billableRate: {
      type: Number,
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);