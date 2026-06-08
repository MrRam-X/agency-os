import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  orgId: mongoose.Types.ObjectId;
  sprintId: mongoose.Types.ObjectId; // Denormalized for zero-join Kanban queries
  storyId: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: "TO_DO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  estimatedHours: number;
  createdBy: mongoose.Types.ObjectId;
  completionDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema<ITask>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Task must belong to an organization"],
      index: true,
    },
    sprintId: {
      type: Schema.Types.ObjectId,
      ref: "Sprint",
      required: [true, "Task must map to a sprint"],
      index: true, // Crucial index for parallel Kanban Board loads
    },
    storyId: {
      type: Schema.Types.ObjectId,
      ref: "UserStory",
      required: [true, "Task must belong to a parent User Story"],
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must be assigned to a team member"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["TO_DO", "IN_PROGRESS", "REVIEW", "DONE"],
      default: "TO_DO",
    },
    estimatedHours: {
      type: Number,
      required: [true, "Estimated hours are required"],
      min: [1, "Estimated hours must be at least 1 hour"],
      max: [16, "Tasks cannot exceed a 16-hour single scope allocation limit"], // Zod safety constraint matching
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

export const Task =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);