import axios from "axios";

export async function notifySlackRateLimitHit(
  slackAccessToken: string | null,
  senderEmail: string,
  currentCount: number,
  maxAllowed: number,
) {
  if (!slackAccessToken) {
    // Sender hasn't connected Slack — silently skip, no crash
    console.log(`No Slack token for ${senderEmail}, skipping notification.`);
    return;
  }

  try {
    const response = await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: "#general", // for simplicity; could be made configurable per sender
        text: `⚠️ Rate limit hit for sender *${senderEmail}* (${currentCount}/${maxAllowed} emails this hour). Remaining emails have been rescheduled to the next hour window.`,
      },
      {
        headers: {
          Authorization: `Bearer ${slackAccessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.data.ok) {
      console.error(`Slack API rejected the message:`, response.data);
      return;
    }

    console.log(`Slack notification sent for ${senderEmail}.`);
    console.log(`Slack response:`, JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error("Failed to send Slack notification:", err);
    // Don't throw — a failed Slack notification shouldn't break email processing
  }
}
