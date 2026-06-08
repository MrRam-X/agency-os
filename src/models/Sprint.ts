import mongoose, { Schema, Document } from "mongoose";

export interface ISprint extends Document {
  orgId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema: Schema = new Schema<ISprint>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Sprint must belong to an organization"],
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Sprint must belong to a project"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Sprint name is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    status: {
      type: String,
      enum: ["PLANNING", "ACTIVE", "COMPLETED"],
      default: "PLANNING",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
  },
  {
    timestamps: true,
  }
);

export const Sprint =
  mongoose.models.Sprint || mongoose.model<ISprint>("Sprint", SprintSchema);