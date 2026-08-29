import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";
import { emailQueue } from "./queues/emailQueue";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is alive" });
});

app.post("/test-email", async (req, res) => {
  // 1. Schedule this email 1 minute from now, for easy testing
  const scheduledTime = new Date(Date.now() + 60 * 1000);

  // 2. Save the email record in Postgres first, status = "scheduled"
  const email = await prisma.email.create({
    data: {
      recipient: "test@example.com",
      subject: "Hello from BullMQ",
      body: "This is a test scheduled email.",
      scheduledTime,
    },
  });

  // 3. Add a delayed job to BullMQ, using the email's DB id as the job id
  //    Using the DB id as the job id is what gives us idempotency later —
  //    BullMQ won't create a duplicate job with the same id.
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
  const emails = await prisma.email.findMany();
  res.json(emails);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
