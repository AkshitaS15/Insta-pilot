import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { auth } from "../auth";
import { prisma } from "../db";
import { CreateCampaignSchema, UpdateCampaignSchema } from "../types";

type Variables = { userId: string };

export const campaignsRouter = new Hono<{ Variables: Variables }>();

campaignsRouter.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session)
    return c.json({ error: { message: "Unauthorized" } }, 401);
  c.set("userId", session.user.id);
  await next();
});

campaignsRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    include: {
      instagramAccount: {
        select: { id: true, username: true, profilePicUrl: true },
      },
      _count: { select: { contentItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return c.json({
    data: campaigns.map((cam) => ({
      id: cam.id,
      name: cam.name,
      genres: JSON.parse(cam.genres) as string[],
      postTypes: JSON.parse(cam.postTypes) as string[],
      contentSource: JSON.parse(cam.contentSource) as string[],
      frequency: cam.frequency,
      frequencyDays: cam.frequencyDays
        ? (JSON.parse(cam.frequencyDays) as number[])
        : null,
      postTime: cam.postTime,
      isActive: cam.isActive,
      instagramAccount: cam.instagramAccount,
      contentCount: cam._count.contentItems,
      nextPostAt: null,
      createdAt: cam.createdAt.toISOString(),
    })),
  });
});

campaignsRouter.post(
  "/",
  zValidator("json", CreateCampaignSchema),
  async (c) => {
    const userId = c.get("userId");
    const data = c.req.valid("json");

    // Verify account belongs to user
    const account = await prisma.instagramAccount.findFirst({
      where: { id: data.instagramAccountId, userId },
    });
    if (!account)
      return c.json({ error: { message: "Instagram account not found" } }, 404);

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: data.name,
        instagramAccountId: data.instagramAccountId,
        genres: JSON.stringify(data.genres),
        postTypes: JSON.stringify(data.postTypes),
        contentSource: JSON.stringify(data.contentSource),
        frequency: data.frequency,
        frequencyDays: data.frequencyDays
          ? JSON.stringify(data.frequencyDays)
          : null,
        postTime: data.postTime,
      },
    });
    return c.json({ data: { id: campaign.id } }, 201);
  }
);

campaignsRouter.get("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId },
    include: {
      instagramAccount: {
        select: { id: true, username: true, profilePicUrl: true },
      },
    },
  });
  if (!campaign)
    return c.json({ error: { message: "Not found" } }, 404);

  return c.json({
    data: {
      id: campaign.id,
      name: campaign.name,
      genres: JSON.parse(campaign.genres) as string[],
      postTypes: JSON.parse(campaign.postTypes) as string[],
      contentSource: JSON.parse(campaign.contentSource) as string[],
      frequency: campaign.frequency,
      frequencyDays: campaign.frequencyDays
        ? (JSON.parse(campaign.frequencyDays) as number[])
        : null,
      postTime: campaign.postTime,
      isActive: campaign.isActive,
      instagramAccount: campaign.instagramAccount,
      contentCount: 0,
      nextPostAt: null,
      createdAt: campaign.createdAt.toISOString(),
    },
  });
});

campaignsRouter.patch(
  "/:id",
  zValidator("json", UpdateCampaignSchema),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const campaign = await prisma.campaign.findFirst({ where: { id, userId } });
    if (!campaign)
      return c.json({ error: { message: "Not found" } }, 404);

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.genres !== undefined && {
          genres: JSON.stringify(data.genres),
        }),
        ...(data.postTypes !== undefined && {
          postTypes: JSON.stringify(data.postTypes),
        }),
        ...(data.contentSource !== undefined && {
          contentSource: JSON.stringify(data.contentSource),
        }),
        ...(data.frequency !== undefined && { frequency: data.frequency }),
        ...(data.frequencyDays !== undefined && {
          frequencyDays: data.frequencyDays
            ? JSON.stringify(data.frequencyDays)
            : null,
        }),
        ...(data.postTime !== undefined && { postTime: data.postTime }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    return c.json({ data: { id: updated.id } });
  }
);

campaignsRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  await prisma.campaign.deleteMany({ where: { id, userId } });
  return c.json({ data: { success: true } });
});
