import { z } from "zod";

export const GenreEnum = z.enum([
  "humanic",
  "animated",
  "ai_generated",
  "satisfying",
  "nature",
  "motivational",
  "comedy",
  "fashion",
  "food",
  "travel",
]);
export type Genre = z.infer<typeof GenreEnum>;

export const PostTypeEnum = z.enum(["POST", "REEL"]);
export const ContentSourceEnum = z.enum(["AI", "UPLOAD"]);
export const FrequencyEnum = z.enum(["DAILY", "3X_WEEK", "WEEKLY", "CUSTOM"]);
export const ContentStatusEnum = z.enum([
  "DRAFT",
  "PENDING_PREVIEW",
  "SCHEDULED",
  "POSTED",
  "FAILED",
]);
export const NotificationTypeEnum = z.enum([
  "PREVIEW_REQUIRED",
  "POST_PUBLISHED",
  "POST_FAILED",
  "CAMPAIGN_INFO",
]);

export const CreateCampaignSchema = z.object({
  instagramAccountId: z.string(),
  name: z.string().min(1),
  genres: z.array(GenreEnum).min(1),
  postTypes: z.array(PostTypeEnum).min(1),
  contentSource: z.array(ContentSourceEnum).min(1),
  frequency: FrequencyEnum,
  frequencyDays: z.array(z.number().min(0).max(6)).optional(),
  postTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export const UpdateCampaignSchema = CreateCampaignSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const GenerateContentSchema = z.object({
  campaignId: z.string(),
  genre: GenreEnum,
  postType: PostTypeEnum,
  contentSource: ContentSourceEnum,
  uploadUrl: z.string().url().optional(), // required if contentSource === "UPLOAD"
});

export const ApproveContentSchema = z.object({
  scheduledAt: z.string().datetime().optional(), // ISO string, defaults to now
});

export const UpdateContentSchema = z.object({
  caption: z.string().optional(),
  hashtags: z.string().optional(),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  scheduledAt: z.string().datetime().optional(),
});

// Response types
export const InstagramAccountResponse = z.object({
  id: z.string(),
  igUserId: z.string(),
  username: z.string(),
  profilePicUrl: z.string().nullable(),
  pageName: z.string().nullable(),
  createdAt: z.string(),
});

export const CampaignResponse = z.object({
  id: z.string(),
  name: z.string(),
  genres: z.array(z.string()),
  postTypes: z.array(z.string()),
  contentSource: z.array(z.string()),
  frequency: z.string(),
  frequencyDays: z.array(z.number()).nullable(),
  postTime: z.string(),
  isActive: z.boolean(),
  instagramAccount: z.object({
    id: z.string(),
    username: z.string(),
    profilePicUrl: z.string().nullable(),
  }),
  contentCount: z.number(),
  nextPostAt: z.string().nullable(),
  createdAt: z.string(),
});

export const ContentItemResponse = z.object({
  id: z.string(),
  campaignId: z.string(),
  campaignName: z.string(),
  imageUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
  caption: z.string(),
  hashtags: z.string().nullable(),
  genre: z.string(),
  postType: z.string(),
  contentSource: z.string(),
  status: z.string(),
  isFirstPost: z.boolean(),
  scheduledAt: z.string().nullable(),
  postedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const NotificationResponse = z.object({
  id: z.string(),
  message: z.string(),
  type: z.string(),
  read: z.boolean(),
  contentItemId: z.string().nullable(),
  createdAt: z.string(),
});
