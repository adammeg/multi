import { User, IUser } from "@/lib/db/models";

export class UserRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select("+password");
    return query;
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  async findAll(
    filter: Record<string, unknown> = {},
    skip = 0,
    limit = 20
  ): Promise<IUser[]> {
    return User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return User.countDocuments(filter);
  }
}

export const userRepository = new UserRepository();
