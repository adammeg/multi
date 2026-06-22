import { Post, IPost, ScheduledPost, IScheduledPost } from "@/lib/db/models";

export class PostRepository {
  async create(data: Partial<IPost>): Promise<IPost> {
    return Post.create(data);
  }

  async findById(id: string): Promise<IPost | null> {
    return Post.findById(id);
  }

  async findByUserId(
    userId: string,
    skip = 0,
    limit = 20
  ): Promise<IPost[]> {
    return Post.find({ userId }).skip(skip).limit(limit).sort({ createdAt: -1 });
  }

  async update(id: string, data: Partial<IPost>): Promise<IPost | null> {
    return Post.findByIdAndUpdate(id, data, { new: true });
  }

  async countByUser(userId: string, filter: Record<string, unknown> = {}): Promise<number> {
    return Post.countDocuments({ userId, ...filter });
  }

  async countAll(filter: Record<string, unknown> = {}): Promise<number> {
    return Post.countDocuments(filter);
  }
}

export class ScheduledPostRepository {
  async create(data: Partial<IScheduledPost>): Promise<IScheduledPost> {
    return ScheduledPost.create(data);
  }

  async findById(id: string): Promise<IScheduledPost | null> {
    return ScheduledPost.findById(id);
  }

  async findByUserId(userId: string): Promise<IScheduledPost[]> {
    return ScheduledPost.find({ userId }).sort({ scheduledFor: -1 });
  }

  async update(
    id: string,
    data: Partial<IScheduledPost>
  ): Promise<IScheduledPost | null> {
    return ScheduledPost.findByIdAndUpdate(id, data, { new: true });
  }

  async findPending(): Promise<IScheduledPost[]> {
    return ScheduledPost.find({
      status: "QUEUED",
      scheduledFor: { $lte: new Date() },
    });
  }
}

export const postRepository = new PostRepository();
export const scheduledPostRepository = new ScheduledPostRepository();
