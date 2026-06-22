import mongoose, { Schema, Document, Model } from "mongoose";
import type { Platform, TrendCategory } from "@/types";

export interface IAnalytics extends Document {
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  platform: Platform;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    platform: {
      type: String,
      enum: ["tiktok", "instagram", "facebook", "youtube"],
      required: true,
    },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AnalyticsSchema.index({ userId: 1, recordedAt: -1 });
AnalyticsSchema.index({ postId: 1, platform: 1 });
AnalyticsSchema.index({ userId: 1, platform: 1, recordedAt: -1 });

export const Analytics: Model<IAnalytics> =
  mongoose.models.Analytics ??
  mongoose.model<IAnalytics>("Analytics", AnalyticsSchema);

export interface ITrend extends Document {
  name: string;
  growthPercent: number;
  category: TrendCategory;
  platform: Platform | "google";
  country: string;
  language: string;
  metadata?: Record<string, unknown>;
  fetchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TrendSchema = new Schema<ITrend>(
  {
    name: { type: String, required: true },
    growthPercent: { type: Number, default: 0 },
    category: {
      type: String,
      enum: ["entertainment", "food", "fashion", "tech", "travel", "sports", "education", "other"],
      default: "other",
    },
    platform: {
      type: String,
      enum: ["tiktok", "instagram", "facebook", "youtube", "google"],
      required: true,
    },
    country: { type: String, default: "TN" },
    language: { type: String, default: "fr" },
    metadata: { type: Schema.Types.Mixed },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

TrendSchema.index({ country: 1, platform: 1, fetchedAt: -1 });
TrendSchema.index({ category: 1, growthPercent: -1 });
TrendSchema.index({ name: 1, platform: 1, fetchedAt: -1 });

export const Trend: Model<ITrend> =
  mongoose.models.Trend ?? mongoose.model<ITrend>("Trend", TrendSchema);

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema);

export interface IActivityLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ??
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
