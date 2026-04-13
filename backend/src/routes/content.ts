import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { auth } from "../auth";
import { prisma } from "../db";
import {
  GenerateContentSchema,
  ApproveContentSchema,
  UpdateContentSchema,
} from "../types";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GENRE_PROMPTS: Record<string, string> = {
  humanic: "heartwarming and relatable everyday human moments",
  animated: "animated characters and cartoon-style art",
  ai_generated: "futuristic AI-generated digital art and technology themes",
  satisfying: "oddly satisfying patterns, textures, and perfect arrangements",
  nature: "breathtaking natural landscapes and wildlife",
  motivational: "inspiring quotes and motivational imagery",
  comedy: "funny and lighthearted comedic scenes",
  fashion: "trendy fashion, outfits, and style inspiration",
  food: "delicious food photography and culinary art",
  travel: "exotic travel destinations and adventure photography",
};

type Variables = { userId: string };

export const contentRouter = new Hono<{ Variables: Variables }>();

contentRouter.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session)
    return c.json({ error: { message: "Unauthorized" } }, 401);
  c.set("userId", session.user.id);
  await next();
});

// Helper to generate caption and split hashtags
async function generateCaption(
  genre: string,
  postType: string,
  prefix = ""
): Promise<{ caption: string; hashtags: string }> {
  const genreDesc = GENRE_PROMPTS[genre] || genre;
  const prompt = prefix
    ? `${prefix} Write an engaging Instagram ${postType === "REEL" ? "reel" : "post"} caption for ${genreDesc} content. Keep it under 150 words, conversational, and end with 5-8 relevant hashtags on a new line.`
    : `Write an engaging Instagram ${postType === "REEL" ? "reel" : "post"} caption for ${genreDesc} content. Keep it under 150 words, conversational, and end with 5-8 relevant hashtags on a new line.`;

  const captionRes = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
  });
  const fullCaption = captionRes.choices[0]?.message?.content ?? "";
  const parts = fullCaption.split("\n#");
  const caption = (parts[0] ?? "").trim();
  const hashtags =
    parts.length > 1 ? "#" + parts.slice(1).join("\n#") : "";
  return { caption, hashtags };
}

// List content items
contentRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const status = c.req.query("status");
  const campaignId = c.req.query("campaignId");

  const items = await prisma.contentItem.findMany({
    where: {
      userId,
      ...(status && { status }),
      ...(campaignId && { campaignId }),
    },
    include: { campaign: { select: { name: true } } },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  });

  return c.json({
    data: items.map((item) => ({
      id: item.id,
      campaignId: item.campaignId,
      campaignName: item.campaign.name,
      imageUrl: item.imageUrl,
      videoUrl: item.videoUrl,
      caption: item.caption,
      hashtags: item.hashtags,
      genre: item.genre,
      postType: item.postType,
      contentSource: item.contentSource,
      status: item.status,
      isFirstPost: item.isFirstPost,
      scheduledAt: item.scheduledAt?.toISOString() ?? null,
      postedAt: item.postedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
  });
});

// Generate content (AI or upload URL)
contentRouter.post(
  "/generate",
  zValidator("json", GenerateContentSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");

    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findFirst({
      where: { id: data.campaignId, userId },
    });
    if (!campaign)
      return c.json({ error: { message: "Campaign not found" } }, 404);

    // Check if this is the first post for this campaign
    const existingCount = await prisma.contentItem.count({
      where: { campaignId: data.campaignId },
    });
    const isFirstPost = existingCount === 0;

    let imageUrl: string | null = null;
    let videoUrl: string | null = null;
    let caption = "";
    let hashtags = "";

    const genreDesc = GENRE_PROMPTS[data.genre] || data.genre;

    if (data.contentSource === "UPLOAD") {
      if (!data.uploadUrl)
        return c.json(
          {
            error: {
              message: "uploadUrl is required for UPLOAD content source",
            },
          },
          400
        );

      if (data.postType === "POST") imageUrl = data.uploadUrl;
      else videoUrl = data.uploadUrl;

      // Still generate caption with AI
      const result = await generateCaption(data.genre, data.postType);
      caption = result.caption;
      hashtags = result.hashtags;
    } else {
      // AI generated
      const result = await generateCaption(data.genre, data.postType);
      caption = result.caption;
      hashtags = result.hashtags;

      if (data.postType === "POST") {
        // Generate image with DALL-E 3
        const imgRes = await openai.images.generate({
          model: "dall-e-3",
          prompt: `A beautiful Instagram post featuring ${genreDesc}. High quality, vibrant, eye-catching, suitable for social media. Aspect ratio 1:1 square format.`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        imageUrl = imgRes.data?.[0]?.url ?? null;
      } else {
        // For REELS, AI video gen not supported
        caption =
          caption +
          "\n\n[Note: AI video generation for Reels requires uploading a video URL. Please use the UPLOAD option for Reels.]";
      }
    }

    const item = await prisma.contentItem.create({
      data: {
        campaignId: data.campaignId,
        userId,
        imageUrl,
        videoUrl,
        caption,
        hashtags,
        genre: data.genre,
        postType: data.postType,
        contentSource: data.contentSource,
        status: "DRAFT",
        isFirstPost,
      },
    });

    return c.json(
      {
        data: {
          id: item.id,
          campaignId: item.campaignId,
          campaignName: campaign.name,
          imageUrl: item.imageUrl,
          videoUrl: item.videoUrl,
          caption: item.caption,
          hashtags: item.hashtags,
          genre: item.genre,
          postType: item.postType,
          contentSource: item.contentSource,
          status: item.status,
          isFirstPost: item.isFirstPost,
          scheduledAt: null,
          postedAt: null,
          createdAt: item.createdAt.toISOString(),
        },
      },
      201
    );
  }
);

// Get single content item
contentRouter.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const item = await prisma.contentItem.findFirst({
    where: { id, userId },
    include: { campaign: { select: { name: true } } },
  });
  if (!item) return c.json({ error: { message: "Not found" } }, 404);

  return c.json({
    data: {
      id: item.id,
      campaignId: item.campaignId,
      campaignName: item.campaign.name,
      imageUrl: item.imageUrl,
      videoUrl: item.videoUrl,
      caption: item.caption,
      hashtags: item.hashtags,
      genre: item.genre,
      postType: item.postType,
      contentSource: item.contentSource,
      status: item.status,
      isFirstPost: item.isFirstPost,
      scheduledAt: item.scheduledAt?.toISOString() ?? null,
      postedAt: item.postedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    },
  });
});

// Approve content (schedule it)
contentRouter.post(
  "/:id/approve",
  zValidator("json", ApproveContentSchema),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const item = await prisma.contentItem.findFirst({ where: { id, userId } });
    if (!item) return c.json({ error: { message: "Not found" } }, 404);

    const scheduledAt = data.scheduledAt
      ? new Date(data.scheduledAt)
      : new Date();

    const updated = await prisma.contentItem.update({
      where: { id },
      data: { status: "SCHEDULED", scheduledAt },
    });

    return c.json({
      data: {
        id: updated.id,
        status: updated.status,
        scheduledAt: updated.scheduledAt?.toISOString() ?? null,
      },
    });
  }
);

// Update content
contentRouter.patch(
  "/:id",
  zValidator("json", UpdateContentSchema),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const item = await prisma.contentItem.findFirst({ where: { id, userId } });
    if (!item) return c.json({ error: { message: "Not found" } }, 404);

    const updated = await prisma.contentItem.update({
      where: { id },
      data: {
        ...(data.caption !== undefined && { caption: data.caption }),
        ...(data.hashtags !== undefined && { hashtags: data.hashtags }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: new Date(data.scheduledAt),
        }),
      },
    });

    return c.json({ data: { id: updated.id } });
  }
);

// Delete content
contentRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  await prisma.contentItem.deleteMany({ where: { id, userId } });
  return c.json({ data: { success: true } });
});

// Regenerate (AI only - creates a new version)
contentRouter.post("/:id/regenerate", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const item = await prisma.contentItem.findFirst({ where: { id, userId } });
  if (!item) return c.json({ error: { message: "Not found" } }, 404);
  if (item.contentSource !== "AI")
    return c.json(
      { error: { message: "Can only regenerate AI content" } },
      400
    );

  const genreDesc = GENRE_PROMPTS[item.genre] || item.genre;
  let imageUrl = item.imageUrl;

  // Regenerate caption
  const { caption, hashtags } = await generateCaption(
    item.genre,
    item.postType,
    "Write a different, creative version."
  );

  if (item.postType === "POST") {
    const imgRes = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A beautiful Instagram post featuring ${genreDesc}. High quality, vibrant, eye-catching, suitable for social media. Aspect ratio 1:1 square format. Make it unique and different from the previous version.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    imageUrl = imgRes.data?.[0]?.url ?? item.imageUrl;
  }

  const updated = await prisma.contentItem.update({
    where: { id },
    data: { imageUrl, caption, hashtags, status: "DRAFT" },
  });

  return c.json({
    data: {
      id: updated.id,
      imageUrl: updated.imageUrl,
      videoUrl: updated.videoUrl,
      caption: updated.caption,
      hashtags: updated.hashtags,
      status: updated.status,
    },
  });
});
