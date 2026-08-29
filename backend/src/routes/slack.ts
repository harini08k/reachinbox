import { Router } from "express";
import axios from "axios";
import { prisma } from "../lib/prisma";

const router = Router();

// Step A: Redirect the user to Slack's authorization page
router.get("/oauth/authorize", (req, res) => {
  const { senderId } = req.query;

  if (!senderId) {
    return res.status(400).json({ error: "senderId is required" });
  }

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: "chat:write",
    redirect_uri: process.env.SLACK_REDIRECT_URI!,
    state: senderId as string, // we'll use this to know WHICH sender is connecting
  });

  res.redirect(`https://slack.com/oauth/v2/authorize?${params.toString()}`);
});

// Step B: Slack redirects back here after the user approves
router.get("/oauth/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ error: "Missing code or state" });
  }

  try {
    const response = await axios.post(
      "https://slack.com/api/oauth.v2.access",
      new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code: code as string,
        redirect_uri: process.env.SLACK_REDIRECT_URI!,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    if (!response.data.ok) {
      console.error("Slack OAuth error:", response.data);
      return res
        .status(400)
        .json({ error: "Slack OAuth failed", details: response.data });
    }

    const botToken = response.data.access_token;
    const senderId = state as string;

    await prisma.sender.update({
      where: { id: senderId },
      data: { slackAccessToken: botToken },
    });

    res.send("Slack connected successfully! You can close this tab.");
  } catch (err) {
    console.error("Slack OAuth callback error:", err);
    res.status(500).json({ error: "Something went wrong connecting Slack" });
  }
});

export default router;
