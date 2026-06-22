import mongoose, { Schema, Document, Model } from "mongoose";
import type { Platform } from "@/types";

export interface IOAuthToken extends Document {
  connectedAccountId: mongoose.Types.ObjectId;
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  tokenType: string;
  expiresAt: Date;
  scope?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OAuthTokenSchema = new Schema<IOAuthToken>(
  {
    connectedAccountId: {
      type: Schema.Types.ObjectId,
      ref: "ConnectedAccount",
      required: true,
      unique: true,
    },
    accessTokenEncrypted: { type: String, required: true },
    refreshTokenEncrypted: { type: String },
    tokenType: { type: String, default: "Bearer" },
    expiresAt: { type: Date, required: true },
    scope: { type: String },
  },
  { timestamps: true }
);

OAuthTokenSchema.index({ connectedAccountId: 1 });
OAuthTokenSchema.index({ expiresAt: 1 });

export const OAuthToken: Model<IOAuthToken> =
  mongoose.models.OAuthToken ??
  mongoose.model<IOAuthToken>("OAuthToken", OAuthTokenSchema);

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  revoked: boolean;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken: Model<IRefreshToken> =
  mongoose.models.RefreshToken ??
  mongoose.model<IRefreshToken>("RefreshToken", RefreshTokenSchema);

export interface IConnectedAccount extends Document {
  userId: mongoose.Types.ObjectId;
  platform: Platform;
  platformUserId: string;
  platformUsername: string;
  accountType?: string;
  profilePicture?: string;
  isActive: boolean;
  lastSyncedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ConnectedAccountSchema = new Schema<IConnectedAccount>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    platform: {
      type: String,
      enum: ["tiktok", "instagram", "facebook", "youtube"],
      required: true,
    },
    platformUserId: { type: String, required: true },
    platformUsername: { type: String, required: true },
    accountType: { type: String },
    profilePicture: { type: String },
    isActive: { type: Boolean, default: true },
    lastSyncedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ConnectedAccountSchema.index({ userId: 1, platform: 1 });
ConnectedAccountSchema.index({ userId: 1, isActive: 1 });
ConnectedAccountSchema.index({ platform: 1, platformUserId: 1 }, { unique: true });

export const ConnectedAccount: Model<IConnectedAccount> =
  mongoose.models.ConnectedAccount ??
  mongoose.model<IConnectedAccount>("ConnectedAccount", ConnectedAccountSchema);
