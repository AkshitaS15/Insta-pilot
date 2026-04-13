import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import "./env";
import { auth } from "./auth";
import { instagramRouter } from "./routes/instagram";
import { campaignsRouter } from "./routes/campaigns";
import { contentRouter } from "./routes/content";
import { notificationsRouter } from "./routes/notifications";
import { publishRouter } from "./routes/publish";

// Type the Hono app with user/session variables
const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// CORS middleware - validates origin against allowlist
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.dev$/,
  /^https:\/\/vibecode\.dev$/,
];

app.use(
  "*",
  cors({
    origin: (origin) =>
      origin && allowed.some((re) => re.test(origin)) ? origin : null,
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Auth middleware - populates user/session for all routes
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);
  await next();
});

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Auth handler - must use app.all with * wildcard for Hono v4 compatibility
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

// Protected API example
app.get("/api/me", (c) => {
  const user = c.get("user");
  if (!user) return c.body(null, 401);
  return c.json({ data: { user } });
});

// Routes
app.route("/api/instagram", instagramRouter);
app.route("/api/campaigns", campaignsRouter);
app.route("/api/content", contentRouter);
app.route("/api/notifications", notificationsRouter);
app.route("/api/publish", publishRouter);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};
