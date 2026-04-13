import { Hono } from "hono";
import { prisma } from "../db";

export const publishRouter = new Hono();

// Scheduler tick - check for content to publish or notify
publishRouter.post("/tick", async (c) => {
  const now = new Date();
  // Find scheduled items that are due
  const dueItems = await prisma.contentItem.findMany({
    where: { status: "SCHEDULED", scheduledAt: { lte: now } },
    include: { campaign: { include: { instagramAccount: true } } },
  });

  const results: {
    id: string;
    status: string;
    error?: string;
  }[] = [];

  for (const item of dueItems) {
    const account = item.campaign.instagramAccount;
    const igAppId = process.env.INSTAGRAM_APP_ID;
    const credentialsConfigured =
      igAppId && igAppId !== "placeholder_add_later";

    if (!credentialsConfigured) {
      // Mark as simulated publish
      await prisma.contentItem.update({
        where: { id: item.id },
        data: { status: "POSTED", postedAt: now },
      });
      await prisma.notification.create({
        data: {
          userId: item.userId,
          contentItemId: item.id,
          message: `[Demo] Your ${item.postType === "REEL" ? "reel" : "post"} "${item.caption.substring(0, 50)}..." has been scheduled (Instagram credentials not yet configured).`,
          type: "POST_PUBLISHED",
        },
      });
      results.push({ id: item.id, status: "simulated" });
      continue;
    }

    try {
      // Create media container
      const mediaUrl =
        item.postType === "POST" ? item.imageUrl : item.videoUrl;
      if (!mediaUrl) throw new Error("No media URL");

      const containerBody =
        item.postType === "POST"
          ? {
              image_url: mediaUrl,
              caption: `${item.caption}\n\n${item.hashtags || ""}`.trim(),
              access_token: account.accessToken,
            }
          : {
              video_url: mediaUrl,
              media_type: "REELS",
              caption: `${item.caption}\n\n${item.hashtags || ""}`.trim(),
              access_token: account.accessToken,
            };

      const containerRes = await fetch(
        `https://graph.facebook.com/v18.0/${account.igUserId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(containerBody),
        }
      );
      const containerData = (await containerRes.json()) as {
        id?: string;
        error?: { message: string };
      };
      if (containerData.error) throw new Error(containerData.error.message);

      // Publish container
      const publishRes = await fetch(
        `https://graph.facebook.com/v18.0/${account.igUserId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: containerData.id,
            access_token: account.accessToken,
          }),
        }
      );
      const publishData = (await publishRes.json()) as {
        id?: string;
        error?: { message: string };
      };
      if (publishData.error) throw new Error(publishData.error.message);

      await prisma.contentItem.update({
        where: { id: item.id },
        data: {
          status: "POSTED",
          postedAt: now,
          igMediaId: publishData.id ?? null,
        },
      });
      await prisma.notification.create({
        data: {
          userId: item.userId,
          contentItemId: item.id,
          message: `Your ${item.postType === "REEL" ? "reel" : "post"} has been published to @${account.username}!`,
          type: "POST_PUBLISHED",
        },
      });
      results.push({ id: item.id, status: "published" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await prisma.contentItem.update({
        where: { id: item.id },
        data: { status: "FAILED", errorMsg: message },
      });
      await prisma.notification.create({
        data: {
          userId: item.userId,
          contentItemId: item.id,
          message: `Failed to publish: ${message}`,
          type: "POST_FAILED",
        },
      });
      results.push({ id: item.id, status: "failed", error: message });
    }
  }

  return c.json({ data: { processed: results.length, results } });
});
