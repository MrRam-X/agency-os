import mongoose, { Schema, Document } from "mongoose";

export interface IUserStory extends Document {
  orgId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  sprintId?: mongoose.Types.ObjectId | null; // 🟢 Optional (nullable) to support Backlog stories
  title: string;
  description?: string;
  plannedHours: number;
  status: "BACKLOG" | "CONFIRMED" | "COMPLETED"; // 🟢 Updated Enum values
  createdBy: mongoose.Types.ObjectId;
  completionDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserStorySchema: Schema = new Schema<IUserStory>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "User Story must belong to an organization"],
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "User Story must belong to a project"],
      index: true,
    },
    sprintId: {
      type: Schema.Types.ObjectId,
      ref: "Sprint",
      default: null, // 🟢 Defaults to null (unassigned backlog story)
      index: true,
    },
    title: {
      type: String,
      required: [true, "User Story title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    plannedHours: {
      type: Number,
      required: [true, "Planned estimation hours are required"],
      min: [0, "Planned hours must be greater than or equal to 0"],
    },
    status: {
      type: String,
      enum: ["BACKLOG", "CONFIRMED", "COMPLETED"], // 🟢 Updated Enum options
      default: "BACKLOG",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
    completionDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const UserStory =
  mongoose.models.UserStory || mongoose.model<IUserStory>("UserStory", UserStorySchema);