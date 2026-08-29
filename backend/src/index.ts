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
app.use(express.json());
app.use("/slack", slackRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is alive" });
});

app.post("/test-email", async (req, res) => {
  const { senderEmail } = req.body;

  const sender = await prisma.sender.findUnique({
    where: { email: senderEmail || "sender1@reachinbox.ai" },
  });

  if (!sender) {
    return res.status(400).json({ error: "Sender not found" });
  }

  const scheduledTime = new Date(Date.now() + 10 * 1000); // 10s for faster testing now

  const email = await prisma.email.create({
    data: {
      recipient: "test@example.com",
      subject: "Hello from BullMQ",
      body: "This is a test scheduled email.",
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

app.get("/test-emails", async (req, res) => {
  const emails = await prisma.email.findMany({ include: { sender: true } });
  res.json(emails);
});

app.get("/search-emails", async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Query param 'q' is required" });
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
