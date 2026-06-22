import { NextRequest } from "next/server";
import { subscriptionRepository } from "@/features/subscription/repositories/subscription.repository";
import { AppError } from "@/lib/utils/api-response";
import type { SubscriptionPlan } from "@/types";

export async function checkPostLimit(userId: string): Promise<void> {
  const sub = await subscriptionRepository.findByUserId(userId);
  if (!sub) throw new AppError("Subscription not found", 404);

  if (sub.postsLimit !== -1 && sub.postsUsedThisMonth >= sub.postsLimit) {
    throw new AppError(
      "Monthly post limit reached. Upgrade to PRO for unlimited posts.",
      403,
      "POST_LIMIT_REACHED"
    );
  }
}

export async function checkConnectedAccountLimit(userId: string): Promise<void> {
  const sub = await subscriptionRepository.findByUserId(userId);
  if (!sub) throw new AppError("Subscription not found", 404);

  const { connectedAccountRepository } = await import(
    "@/features/platforms/repositories/connected-account.repository"
  );
  const count = await connectedAccountRepository.countByUserId(userId);

  if (count >= sub.connectedAccountsLimit) {
    throw new AppError(
      "Connected account limit reached. Upgrade your plan.",
      403,
      "ACCOUNT_LIMIT_REACHED"
    );
  }
}

export function requirePlan(...plans: SubscriptionPlan[]) {
  return async (userId: string): Promise<void> => {
    const sub = await subscriptionRepository.findByUserId(userId);
    if (!sub || !plans.includes(sub.plan)) {
      throw new AppError(
        `This feature requires ${plans.join(" or ")} plan`,
        403,
        "PLAN_REQUIRED"
      );
    }
  };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: NextRequest): void {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const max = parseInt(process.env.RATE_LIMIT_MAX ?? "100", 10);
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "900000", 10);
  const now = Date.now();

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return;
  }

  entry.count++;
  if (entry.count > max) {
    throw new AppError("Too many requests", 429, "RATE_LIMIT");
  }
}
