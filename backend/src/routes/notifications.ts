import { Hono } from "hono";
import { auth } from "../auth";
import { prisma } from "../db";

type Variables = { userId: string };

export const notificationsRouter = new Hono<{ Variables: Variables }>();

notificationsRouter.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session)
    return c.json({ error: { message: "Unauthorized" } }, 401);
  c.set("userId", session.user.id);
  await next();
});

notificationsRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return c.json({
    data: notifications.map((n) => ({
      id: n.id,
      message: n.message,
      type: n.type,
      read: n.read,
      contentItemId: n.contentItemId,
      createdAt: n.createdAt.toISOString(),
    })),
  });
});

notificationsRouter.get("/unread-count", async (c) => {
  const userId = c.get("userId");
  const count = await prisma.notification.count({
    where: { userId, read: false },
  });
  return c.json({ data: { count } });
});

notificationsRouter.post("/:id/read", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
  return c.json({ data: { success: true } });
});

notificationsRouter.post("/read-all", async (c) => {
  const userId = c.get("userId");
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return c.json({ data: { success: true } });
});
