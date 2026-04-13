import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { createVibecodeSDK } from "@vibecodeapp/backend-sdk";
import { prisma } from "./db";
import { env } from "./env";

// Initialize Vibecode SDK for email sending
const vibecode = createVibecodeSDK();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BACKEND_URL,
  trustedOrigins: [
    "http://localhost:*",
    "http://127.0.0.1:*",
    "https://*.dev.vibecode.run",
    "https://*.vibecode.run",
    "https://*.vibecodeapp.com",
    "https://*.vibecode.dev",
    "https://vibecode.dev",
  ],
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Only send OTPs for sign-in
        if (type !== "sign-in") return;

        await vibecode.email.sendOTP({
          to: email,
          code: String(otp),
          fromName: "Instagram AutoPost",
          lang: "en",
        });
      },
    }),
  ],
  advanced: {
    trustedProxyHeaders: true,
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
});
