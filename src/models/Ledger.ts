import mongoose, { Schema, Document } from "mongoose";

export interface ILedger extends Document {
  orgId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  storyId: mongoose.Types.ObjectId; // Denormalized for high-speed variance checks
  hoursLogged: number;
  billingStatus: "UNBILLED" | "BILLED";
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerSchema: Schema = new Schema<ILedger>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Ledger entry must belong to an organization"],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Ledger entry must connect to a user"],
      index: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Ledger entry must map to a task"],
      index: true,
    },
    storyId: {
      type: Schema.Types.ObjectId,
      ref: "UserStory",
      required: [true, "Ledger entry must point to the parent User Story"],
      index: true, // Speed index for unbilled variance aggregation
    },
    hoursLogged: {
      type: Number,
      required: [true, "Logged hours are required"],
      min: [0.5, "Minimum logging granularity is 0.5 hours"],
    },
    billingStatus: {
      type: String,
      enum: ["UNBILLED", "BILLED"],
      default: "UNBILLED",
    },
    date: {
      type: Date,
      required: [true, "Entry date is required"],
      index: true, // Timelines-index for yesterday's AI Standups
    },
  },
  {
    timestamps: true,
  }
);

export const Ledger =
  mongoose.models.Ledger || mongoose.model<ILedger>("Ledger", LedgerSchema);