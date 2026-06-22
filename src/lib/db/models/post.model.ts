import mongoose, { Schema, Document, Model } from "mongoose";
import type { Platform, PostStatus, PlatformPublishResult } from "@/types";

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  caption: string;
  hashtags: string[];
  platforms: Platform[];
  videoPath: string;
  thumbnailPath?: string;
  videoMetadata?: {
    duration: number;
    width: number;
    height: number;
    aspectRatio: string;
    fileSize: number;
    format: string;
  };
  status: PostStatus;
  platformResults: PlatformPublishResult[];
  scheduledFor?: Date;
  publishedAt?: Date;
  isScheduled: boolean;
  viralScore?: number;
  aiCaptions?: Record<string, string[]>;
  errorLog?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    caption: { type: String, default: "" },
    hashtags: [{ type: String }],
    platforms: [{
      type: String,
      enum: ["tiktok", "instagram", "facebook", "youtube"],
    }],
    videoPath: { type: String, required: true },
    thumbnailPath: { type: String },
    videoMetadata: {
      duration: Number,
      width: Number,
      height: Number,
      aspectRatio: String,
      fileSize: Number,
      format: String,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SUCCESS", "FAILED", "PARTIAL_SUCCESS"],
      default: "PENDING",
    },
    platformResults: [{
      platform: { type: String },
      status: { type: String, enum: ["SUCCESS", "FAILED"] },
      externalId: String,
      url: String,
      error: String,
    }],
    scheduledFor: { type: Date },
    publishedAt: { type: Date },
    isScheduled: { type: Boolean, default: false },
    viralScore: { type: Number },
    aiCaptions: { type: Schema.Types.Mixed },
    errorLog: [{ type: String }],
  },
  { timestamps: true }
);

PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ userId: 1, status: 1 });
PostSchema.index({ status: 1 });
PostSchema.index({ scheduledFor: 1 });
PostSchema.index({ publishedAt: -1 });

export const Post: Model<IPost> =
  mongoose.models.Post ?? mongoose.model<IPost>("Post", PostSchema);

export interface IScheduledPost extends Document {
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  scheduledFor: Date;
  jobId?: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  attempts: number;
  lastAttemptAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledPostSchema = new Schema<IScheduledPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    scheduledFor: { type: Date, required: true },
    jobId: { type: String },
    status: {
      type: String,
      enum: ["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "QUEUED",
    },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    error: { type: String },
  },
  { timestamps: true }
);

ScheduledPostSchema.index({ userId: 1, scheduledFor: -1 });
ScheduledPostSchema.index({ status: 1, scheduledFor: 1 });
ScheduledPostSchema.index({ jobId: 1 });

export const ScheduledPost: Model<IScheduledPost> =
  mongoose.models.ScheduledPost ??
  mongoose.model<IScheduledPost>("ScheduledPost", ScheduledPostSchema);
