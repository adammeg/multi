import { z } from "zod";

export const captionGeneratorSchema = z.object({
  topic: z.string().min(3),
  language: z.enum(["fr", "ar", "en"]).default("fr"),
  platforms: z
    .array(z.enum(["tiktok", "instagram", "facebook", "youtube"]))
    .min(1),
});

export const hashtagGeneratorSchema = z.object({
  category: z.string().min(2),
  country: z.string().default("TN"),
  language: z.enum(["fr", "ar", "en"]).default("fr"),
  count: z.number().min(5).max(30).default(15),
});

export const viralScoreSchema = z.object({
  duration: z.number().positive(),
  hashtags: z.array(z.string()),
  category: z.string(),
  postingHour: z.number().min(0).max(23),
  captionLength: z.number(),
});

export const qualityCheckSchema = z.object({
  duration: z.number(),
  captionLength: z.number(),
  hashtags: z.array(z.string()),
  aspectRatio: z.string(),
});

export type CaptionGeneratorDto = z.infer<typeof captionGeneratorSchema>;
export type HashtagGeneratorDto = z.infer<typeof hashtagGeneratorSchema>;
export type ViralScoreDto = z.infer<typeof viralScoreSchema>;
