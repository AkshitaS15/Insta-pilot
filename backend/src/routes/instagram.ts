import { Hono } from "hono";
import { auth } from "../auth";
import { prisma } from "../db";

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;
const SCOPES =
  "instagram_basic,instagram_content_publish,pages_read_engagement,pages_show_list";

type Variables = { userId: string };

export const instagramRouter = new Hono<{ Variables: Variables }>();

// Public: check if Instagram credentials are configured
instagramRouter.get("/status", (c) => {
  const appId = process.env.INSTAGRAM_APP_ID;
  const configured = !!(appId && appId !== "placeholder_add_later" && appId.length > 5);
  return c.json({ data: { configured } });
});

// Middleware: require auth
instagramRouter.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session)
    return c.json(
      { error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
      401
    );
  c.set("userId", session.user.id);
  await next();
});

// Initiate OAuth
instagramRouter.get("/auth", async (c) => {
  const userId = c.get("userId");
  const state = Buffer.from(JSON.stringify({ userId })).toString("base64");
  const url = `https://www.facebook.com/dialog/oauth?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI!)}&scope=${SCOPES}&response_type=code&state=${state}`;
  return c.redirect(url);
});

// OAuth callback
instagramRouter.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state)
    return c.json({ error: { message: "Missing code or state" } }, 400);

  let userId: string;
  try {
    userId = JSON.parse(Buffer.from(state, "base64").toString()).userId;
  } catch {
    return c.json({ error: { message: "Invalid state" } }, 400);
  }

  // Check if Instagram credentials are configured
  if (!INSTAGRAM_APP_ID || INSTAGRAM_APP_ID === "placeholder_add_later") {
    return c.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:8000"}/connect?error=credentials_not_configured`
    );
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${INSTAGRAM_APP_ID}&client_secret=${INSTAGRAM_APP_SECRET}&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI!)}&code=${code}`
    );
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: { message: string };
    };
    if (tokenData.error) throw new Error(tokenData.error.message);

    const accessToken = tokenData.access_token!;

    // Get Facebook pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );
    const pagesData = (await pagesRes.json()) as {
      data?: { id: string; name: string; access_token: string }[];
      error?: { message: string };
    };
    if (!pagesData.data?.length)
      throw new Error(
        "No Facebook Pages found. Please create a Facebook Page connected to your Instagram account."
      );

    const page = pagesData.data[0]!;
    const pageAccessToken = page.access_token;

    // Get Instagram Business Account
    const igRes = await fetch(
      `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    const igData = (await igRes.json()) as {
      instagram_business_account?: { id: string };
      error?: { message: string };
    };
    if (!igData.instagram_business_account)
      throw new Error(
        "No Instagram Business Account found. Please connect your Instagram account to the Facebook Page."
      );

    const igUserId = igData.instagram_business_account.id;

    // Get IG user info
    const igUserRes = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}?fields=username,profile_picture_url&access_token=${pageAccessToken}`
    );
    const igUser = (await igUserRes.json()) as {
      username: string;
      profile_picture_url?: string;
      error?: { message: string };
    };

    // Upsert Instagram account
    await prisma.instagramAccount.upsert({
      where: { igUserId },
      create: {
        userId,
        igUserId,
        username: igUser.username,
        profilePicUrl: igUser.profile_picture_url ?? null,
        accessToken: pageAccessToken,
        pageId: page.id,
        pageName: page.name,
      },
      update: {
        userId,
        username: igUser.username,
        profilePicUrl: igUser.profile_picture_url ?? null,
        accessToken: pageAccessToken,
        pageId: page.id,
        pageName: page.name,
      },
    });

    return c.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:8000"}/connect?success=true`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:8000"}/connect?error=${encodeURIComponent(message)}`
    );
  }
});

// List connected accounts
instagramRouter.get("/accounts", async (c) => {
  const userId = c.get("userId");
  const accounts = await prisma.instagramAccount.findMany({
    where: { userId },
  });
  return c.json({
    data: accounts.map((a) => ({
      id: a.id,
      igUserId: a.igUserId,
      username: a.username,
      profilePicUrl: a.profilePicUrl,
      pageName: a.pageName,
      createdAt: a.createdAt.toISOString(),
    })),
  });
});

// Disconnect account
instagramRouter.delete("/accounts/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  await prisma.instagramAccount.deleteMany({ where: { id, userId } });
  return c.json({ data: { success: true } });
});
