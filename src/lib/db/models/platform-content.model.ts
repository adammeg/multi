import mongoose, { Schema, Document, Model } from "mongoose";
import type { Platform } from "@/types";

export interface IPlatformContent extends Document {
  userId: mongoose.Types.ObjectId;
  connectedAccountId: mongoose.Types.ObjectId;
  platform: Platform;
  externalId: string;
  title: string;
  caption?: string;
  thumbnailUrl?: string;
  permalink?: string;
  duration?: number;
  publishedAt: Date;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  viralScore?: number;
  analysis?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  hashtags: string[];
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformContentSchema = new Schema<IPlatformContent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    connectedAccountId: {
      type: Schema.Types.ObjectId,
      ref: "ConnectedAccount",
      required: true,
    },
    platform: {
      type: String,
      enum: ["tiktok", "instagram", "facebook", "youtube"],
      required: true,
    },
    externalId: { type: String, required: true },
    title: { type: String, default: "" },
    caption: { type: String },
    thumbnailUrl: { type: String },
    permalink: { type: String },
    duration: { type: Number },
    publishedAt: { type: Date, required: true },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    viralScore: { type: Number },
    analysis: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
    },
    hashtags: [{ type: String }],
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PlatformContentSchema.index({ userId: 1, platform: 1, publishedAt: -1 });
PlatformContentSchema.index(
  { connectedAccountId: 1, externalId: 1 },
  { unique: true }
);
PlatformContentSchema.index({ userId: 1, viralScore: -1 });

export const PlatformContent: Model<IPlatformContent> =
  mongoose.models.PlatformContent ??
  mongoose.model<IPlatformContent>("PlatformContent", PlatformContentSchema);
