import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";
import { emailQueue } from "./queues/emailQueue";
import slackRouter from "./routes/slack";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { indexEmail } from "./lib/emailIndexer";
import { esClient } from "./lib/elasticsearch";
import "./workers/emailWorker";

dotenv.config();

const app = express();
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/slack", slackRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is alive" });
});

app.post("/test-email", async (req, res) => {
  const { senderEmail, recipient, recipientName, subject, body } = req.body;

  const sender = await prisma.sender.findUnique({
    where: { email: senderEmail || "harini@testemail.com" },
  });

  if (!sender) {
    return res.status(400).json({ error: "Sender not found" });
  }

  const scheduledTime = new Date(Date.now() + 10 * 1000);

  const email = await prisma.email.create({
    data: {
      recipient: recipient || "test@example.com",
      recipientName: recipientName || null,
      subject: subject || "Hello from BullMQ",
      body: body || "This is a test scheduled email.",
      scheduledTime,
      senderId: sender.id,
    },
  });

  await indexEmail({
    id: email.id,
    recipient: email.recipient,
    subject: email.subject,
    body: email.body,
    status: email.status,
    scheduledTime: email.scheduledTime,
    senderEmail: sender.email,
  });

  const delay = scheduledTime.getTime() - Date.now();

  await emailQueue.add(
    "send-email",
    { emailId: email.id },
    {
      jobId: email.id,
      delay,
    },
  );

  res.json({ message: "Email scheduled", email });
});

app.post("/schedule-batch", async (req, res) => {
  const {
    senderEmail,
    recipients,
    subject,
    body,
    startTime,
    delayBetweenEmailsMs,
    hourlyLimit,
    attachments,
  } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: "recipients array is required" });
  }

  let sender = await prisma.sender.findUnique({
    where: { email: senderEmail || "sender1@reachinbox.ai" },
  });

  if (!sender) {
    return res.status(400).json({ error: "Sender not found" });
  }

  if (hourlyLimit) {
    sender = await prisma.sender.update({
      where: { id: sender.id },
      data: { maxEmailsPerHour: Number(hourlyLimit) },
    });
  }

  const baseTime = startTime
    ? new Date(startTime)
    : new Date(Date.now() + 10 * 1000);
  const stagger =
    Number(delayBetweenEmailsMs) || Number(process.env.MIN_DELAY_MS) || 2000;

  const createdEmails = [];

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    const scheduledTime = new Date(baseTime.getTime() + i * stagger);

    const email = await prisma.email.create({
      data: {
        recipient: r.email,
        recipientName: r.name || null,
        subject,
        body,
        scheduledTime,
        senderId: sender.id,
        attachments:
          attachments && attachments.length > 0 ? attachments : undefined,
      },
    });

    await indexEmail({
      id: email.id,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: email.status,
      scheduledTime: email.scheduledTime,
      senderEmail: sender.email,
    });

    const delay = scheduledTime.getTime() - Date.now();

    await emailQueue.add(
      "send-email",
      { emailId: email.id },
      {
        jobId: email.id,
        delay: Math.max(delay, 0),
      },
    );

    createdEmails.push(email);
  }

  res.json({
    message: `Scheduled ${createdEmails.length} emails`,
    emails: createdEmails,
  });
});

app.get("/test-emails", async (req, res) => {
  const emails = await prisma.email.findMany({ include: { sender: true } });
  res.json(emails);
});

app.get("/search-emails", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Query param 'q' is required" });
  }

  if (!process.env.ELASTICSEARCH_URL) {
    // Fallback: simple Postgres search when Elasticsearch isn't configured (e.g. hosted deployment)
    const results = await prisma.email.findMany({
      where: {
        OR: [
          { subject: { contains: q as string, mode: "insensitive" } },
          { body: { contains: q as string, mode: "insensitive" } },
          { recipient: { contains: q as string, mode: "insensitive" } },
        ],
      },
      include: { sender: true },
    });
    return res.json(results);
  }

  const result = await esClient.search({
    index: "emails",
    query: {
      multi_match: {
        query: q as string,
        fields: ["subject", "body", "recipient"],
      },
    },
  });

  const hits = result.hits.hits.map((hit: any) => ({
    id: hit._id,
    ...hit._source,
  }));

  res.json(hits);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
