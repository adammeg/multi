import { z } from "zod";

const platformEnum = z.enum(["tiktok", "instagram", "facebook", "youtube"]);

export const createPostSchema = z.object({
  caption: z.string().max(2200).default(""),
  hashtags: z.array(z.string()).max(30).default([]),
  platforms: z.array(platformEnum).min(1, "Select at least one platform"),
  scheduledFor: z.string().datetime().optional(),
});

export const schedulePostSchema = z.object({
  postId: z.string(),
  scheduledFor: z
    .string()
    .datetime()
    .refine(
      (date) => {
        const d = new Date(date);
        const max = new Date();
        max.setDate(max.getDate() + 30);
        return d > new Date() && d <= max;
      },
      { message: "Schedule must be within 30 days" }
    ),
});

export const createPostJsonSchema = createPostSchema.extend({
  videoUrl: z.string().url().refine((u) => u.startsWith("https://"), "Video URL must be HTTPS"),
  videoFilename: z.string().min(1).max(255),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;
export type CreatePostJsonDto = z.infer<typeof createPostJsonSchema>;
export type SchedulePostDto = z.infer<typeof schedulePostSchema>;
