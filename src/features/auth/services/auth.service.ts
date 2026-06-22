import { userRepository } from "@/features/auth/repositories/user.repository";
import { subscriptionRepository } from "@/features/subscription/repositories/subscription.repository";
import { activityLogRepository } from "@/features/analytics/repositories/analytics.repository";
import { hashPassword, comparePassword } from "@/lib/auth/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/auth/jwt";
import { RefreshToken } from "@/lib/db/models";
import { AppError } from "@/lib/utils/api-response";
import type { RegisterDto, LoginDto } from "@/features/auth/dto/auth.dto";
import { getEnv } from "@/lib/config/env";

export class AuthService {
  async register(dto: RegisterDto) {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) throw new AppError("Email already registered", 409);

    const hashed = await hashPassword(dto.password);
    const verificationToken = generateEmailVerificationToken();

    const user = await userRepository.create({
      email: dto.email,
      password: hashed,
      name: dto.name,
      emailVerificationToken: verificationToken,
      role: dto.email === getEnv().ADMIN_EMAIL ? "admin" : "user",
    });

    await subscriptionRepository.createForUser(user._id.toString());

    await activityLogRepository.create({
      userId: user._id,
      action: "USER_REGISTER",
      resource: "user",
      resourceId: user._id.toString(),
    });

    const tokens = await this.generateTokens(user._id.toString(), user.email, user.role);

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      ...tokens,
      verificationToken,
    };
  }

  async login(dto: LoginDto, meta?: { userAgent?: string; ip?: string }) {
    const user = await userRepository.findByEmail(dto.email, true);
    if (!user) throw new AppError("Invalid credentials", 401);

    const valid = await comparePassword(dto.password, user.password);
    if (!valid) throw new AppError("Invalid credentials", 401);

    await userRepository.update(user._id.toString(), { lastLoginAt: new Date() });

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role,
      meta
    );

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const stored = await RefreshToken.findOne({ token: refreshToken, revoked: false });
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError("Invalid refresh token", 401);
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) throw new AppError("User not found", 404);

    stored.revoked = true;
    await stored.save();

    return this.generateTokens(user._id.toString(), user.email, user.role);
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return { message: "If the email exists, a reset link was sent" };

    const token = generatePasswordResetToken(user._id.toString());
    await userRepository.update(user._id.toString(), {
      passwordResetToken: token,
      passwordResetExpires: new Date(Date.now() + 3600000),
    });

    return { message: "If the email exists, a reset link was sent", resetToken: token };
  }

  async resetPassword(token: string, password: string) {
    const { userId } = verifyPasswordResetToken(token);
    const hashed = await hashPassword(password);
    await userRepository.update(userId, {
      password: hashed,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });
    return { message: "Password reset successful" };
  }

  async verifyEmail(userId: string) {
    await userRepository.update(userId, {
      emailVerified: true,
      emailVerificationToken: undefined,
    });
    return { message: "Email verified" };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: "user" | "admin",
    meta?: { userAgent?: string; ip?: string }
  ) {
    const accessToken = signAccessToken({ userId, email, role });
    const refreshToken = signRefreshToken({ userId });

    await RefreshToken.create({
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: meta?.userAgent,
      ipAddress: meta?.ip,
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
