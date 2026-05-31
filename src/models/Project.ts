import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  orgId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: "ACTIVE" | "COMPLETED";
  members: mongoose.Types.ObjectId[]; // 🟢 Widescreen member isolation array
  createdBy: mongoose.Types.ObjectId; // 🟢 Creator tracking link
  billingType: "FIXED_PRICE" | "TIME_AND_MATERIALS"; // 🟢 SaaS Billing types
  blendedRate: number; // 🟢 Fixed price estimation baseline
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema<IProject>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Project must belong to an organization"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED"],
      default: "ACTIVE",
    },
    members: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project creator is required"],
    },
    billingType: {
      type: String,
      enum: ["FIXED_PRICE", "TIME_AND_MATERIALS"],
      default: "TIME_AND_MATERIALS",
    },
    blendedRate: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  },
);

export const Project =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
