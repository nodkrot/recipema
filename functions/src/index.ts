// Firebase entry point: an HTTPS function Telegram calls via webhook.

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { handleUpdate } from "./bot";
import type { TgUpdate } from "./telegram";

initializeApp();

const TELEGRAM_BOT_TOKEN = defineSecret("TELEGRAM_BOT_TOKEN");
const TELEGRAM_WEBHOOK_SECRET = defineSecret("TELEGRAM_WEBHOOK_SECRET");
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const ALLOWED_USER_IDS = defineString("ALLOWED_USER_IDS", { default: "" });
const GEMINI_MODEL = defineString("GEMINI_MODEL", { default: "gemini-3.5-flash-lite" });
const AUTHOR_IDS = defineString("AUTHOR_IDS", { default: "" });
const PORTAL_URL = defineString("PORTAL_URL", { default: "https://recipema.appletreelabs.com" });

export const recipeBot = onRequest(
  {
    secrets: [TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, GEMINI_API_KEY],
    timeoutSeconds: 120,
    memory: "512MiB",
    maxInstances: 5,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method not allowed");
      return;
    }
    // Telegram sends back the secret_token we registered with setWebhook.
    if (req.get("X-Telegram-Bot-Api-Secret-Token") !== TELEGRAM_WEBHOOK_SECRET.value()) {
      res.status(401).send("Unauthorized");
      return;
    }

    try {
      await handleUpdate(req.body as TgUpdate, {
        botToken: TELEGRAM_BOT_TOKEN.value(),
        allowedUserIds: new Set(
          ALLOWED_USER_IDS.value()
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map(Number)
            .filter(Number.isFinite),
        ),
        llm: { apiKey: GEMINI_API_KEY.value(), model: GEMINI_MODEL.value() },
        portalUrl: PORTAL_URL.value().replace(/\/+$/, ""),
        authorIds: new Map(
          AUTHOR_IDS.value()
            .split(",")
            .map((pair) => pair.split(":").map((s) => s.trim()))
            .filter(([tgId, uid]) => tgId && uid)
            .map(([tgId, uid]) => [Number(tgId), uid]),
        ),
      });
    } catch (err) {
      logger.error("Unhandled error", err);
    }
    // Always 200 so Telegram doesn't retry the same update forever.
    res.status(200).send("ok");
  },
);
