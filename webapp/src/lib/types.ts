// Re-export types from backend for frontend use
export type Genre =
  | "humanic"
  | "animated"
  | "ai_generated"
  | "satisfying"
  | "nature"
  | "motivational"
  | "comedy"
  | "fashion"
  | "food"
  | "travel";

export type PostType = "POST" | "REEL";
export type ContentSource = "AI" | "UPLOAD";
export type Frequency = "DAILY" | "3X_WEEK" | "WEEKLY" | "CUSTOM";
export type ContentStatus = "DRAFT" | "PENDING_PREVIEW" | "SCHEDULED" | "POSTED" | "FAILED";
export type NotificationType = "PREVIEW_REQUIRED" | "POST_PUBLISHED" | "POST_FAILED" | "CAMPAIGN_INFO";

export interface InstagramAccount {
  id: string;
  igUserId: string;
  username: string;
  profilePicUrl: string | null;
  pageName: string | null;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  genres: string[];
  postTypes: string[];
  contentSource: string[];
  frequency: string;
  frequencyDays: number[] | null;
  postTime: string;
  isActive: boolean;
  instagramAccount: {
    id: string;
    username: string;
    profilePicUrl: string | null;
  };
  contentCount: number;
  nextPostAt: string | null;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  campaignId: string;
  campaignName: string;
  imageUrl: string | null;
  videoUrl: string | null;
  caption: string;
  hashtags: string | null;
  genre: string;
  postType: string;
  contentSource: string;
  status: string;
  isFirstPost: boolean;
  scheduledAt: string | null;
  postedAt: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  contentItemId: string | null;
  createdAt: string;
}

export const GENRE_LABELS: Record<Genre, string> = {
  humanic: "Humanic",
  animated: "Animated",
  ai_generated: "AI Generated",
  satisfying: "Satisfying",
  nature: "Nature",
  motivational: "Motivational",
  comedy: "Comedy",
  fashion: "Fashion",
  food: "Food",
  travel: "Travel",
};

export const GENRE_EMOJIS: Record<Genre, string> = {
  humanic: "🧑",
  animated: "🎬",
  ai_generated: "🤖",
  satisfying: "😌",
  nature: "🌿",
  motivational: "💪",
  comedy: "😂",
  fashion: "👗",
  food: "🍕",
  travel: "✈️",
};

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  DAILY: "Daily",
  "3X_WEEK": "3x per Week",
  WEEKLY: "Weekly",
  CUSTOM: "Custom",
};

export const STATUS_COLORS: Record<ContentStatus, string> = {
  DRAFT: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  PENDING_PREVIEW: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  SCHEDULED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  POSTED: "bg-green-500/20 text-green-400 border-green-500/30",
  FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
};
