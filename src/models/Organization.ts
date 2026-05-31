import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
  orgName: string;
  shortName: string; // URL slug, e.g., "acme"
  ownerId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema = new Schema<IOrganization>(
  {
    orgName: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    shortName: {
      type: String,
      required: [true, "Organization short name is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Organization =
  mongoose.models.Organization ||
  mongoose.model<IOrganization>("Organization", OrganizationSchema);