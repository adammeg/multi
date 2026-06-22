import { Subscription, ISubscription } from "@/lib/db/models";
import type { SubscriptionPlan } from "@/types";

const PLAN_LIMITS: Record<
  SubscriptionPlan,
  { postsLimit: number; connectedAccountsLimit: number }
> = {
  FREE: { postsLimit: 10, connectedAccountsLimit: 1 },
  PRO: { postsLimit: -1, connectedAccountsLimit: 10 },
  AGENCY: { postsLimit: -1, connectedAccountsLimit: 50 },
};

export class SubscriptionRepository {
  async createForUser(userId: string): Promise<ISubscription> {
    const limits = PLAN_LIMITS.FREE;
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    return Subscription.create({
      userId,
      plan: "FREE",
      postsLimit: limits.postsLimit,
      connectedAccountsLimit: limits.connectedAccountsLimit,
      currentPeriodEnd: periodEnd,
    });
  }

  async findByUserId(userId: string): Promise<ISubscription | null> {
    return Subscription.findOne({ userId });
  }

  async incrementPostsUsed(userId: string): Promise<ISubscription | null> {
    return Subscription.findOneAndUpdate(
      { userId },
      { $inc: { postsUsedThisMonth: 1 } },
      { new: true }
    );
  }

  async updatePlan(userId: string, plan: SubscriptionPlan): Promise<ISubscription | null> {
    const limits = PLAN_LIMITS[plan];
    return Subscription.findOneAndUpdate(
      { userId },
      {
        plan,
        postsLimit: limits.postsLimit,
        connectedAccountsLimit: limits.connectedAccountsLimit,
        postsUsedThisMonth: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { new: true }
    );
  }

  async resetMonthlyUsage(): Promise<void> {
    await Subscription.updateMany({}, { postsUsedThisMonth: 0 });
  }
}

export const subscriptionRepository = new SubscriptionRepository();
