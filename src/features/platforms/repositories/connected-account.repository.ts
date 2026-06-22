import { ConnectedAccount, IConnectedAccount, OAuthToken, IOAuthToken } from "@/lib/db/models";
import type { Platform } from "@/types";

export class ConnectedAccountRepository {
  async create(data: Partial<IConnectedAccount>): Promise<IConnectedAccount> {
    return ConnectedAccount.create(data);
  }

  async findByUserId(userId: string): Promise<IConnectedAccount[]> {
    return ConnectedAccount.find({ userId, isActive: true });
  }

  async findById(id: string): Promise<IConnectedAccount | null> {
    return ConnectedAccount.findById(id);
  }

  async findByPlatformUserId(
    platform: Platform,
    platformUserId: string
  ): Promise<IConnectedAccount | null> {
    return ConnectedAccount.findOne({ platform, platformUserId });
  }

  async countByUserId(userId: string): Promise<number> {
    return ConnectedAccount.countDocuments({ userId, isActive: true });
  }

  async deactivate(id: string): Promise<IConnectedAccount | null> {
    return ConnectedAccount.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }
}

export class OAuthTokenRepository {
  async upsert(
    connectedAccountId: string,
    data: Partial<IOAuthToken>
  ): Promise<IOAuthToken> {
    return OAuthToken.findOneAndUpdate(
      { connectedAccountId },
      { ...data, connectedAccountId },
      { upsert: true, new: true }
    );
  }

  async findByAccountId(connectedAccountId: string): Promise<IOAuthToken | null> {
    return OAuthToken.findOne({ connectedAccountId });
  }

  async findExpiringSoon(withinMinutes = 30): Promise<IOAuthToken[]> {
    const threshold = new Date(Date.now() + withinMinutes * 60 * 1000);
    return OAuthToken.find({ expiresAt: { $lte: threshold } }).populate("connectedAccountId");
  }
}

export const connectedAccountRepository = new ConnectedAccountRepository();
export const oauthTokenRepository = new OAuthTokenRepository();
