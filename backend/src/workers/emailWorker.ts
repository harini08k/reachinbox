import { Worker, Job } from "bullmq";
import { connection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { transporter } from "../lib/mailer";
import {
  incrementSenderHourlyCount,
  msUntilNextHour,
} from "../lib/rateLimiter";
import { emailQueue } from "../queues/emailQueue";
import dotenv from "dotenv";

dotenv.config();

interface EmailJobData {
  emailId: string;
}

const worker = new Worker<EmailJobData>(
  "email-queue",
  async (job: Job<EmailJobData>) => {
    console.log(`Processing job ${job.id} for email ${job.data.emailId}`);

    const email = await prisma.email.findUnique({
      where: { id: job.data.emailId },
      include: { sender: true },
    });

    if (!email) {
      console.log(`Email ${job.data.emailId} not found, skipping.`);
      return;
    }

    // 1. Check rate limit BEFORE sending
    const currentCount = await incrementSenderHourlyCount(email.senderId);

    if (currentCount > email.sender.maxEmailsPerHour) {
      console.log(
        `Rate limit hit for sender ${email.sender.email} (${currentCount}/${email.sender.maxEmailsPerHour}). Rescheduling.`,
      );

      const delay = msUntilNextHour();

      // Re-add a new delayed job for the next hour window.
      // We use a new jobId (old one is already "used up" in BullMQ's history)
      await emailQueue.add(
        "send-email",
        { emailId: email.id },
        {
          jobId: `${email.id}-retry-${Date.now()}`,
          delay,
        },
      );

      // Email stays "scheduled" — it wasn't sent, just deferred
      return;
    }

    // 2. Under the limit — proceed to actually send
    try {
      const info = await transporter.sendMail({
        from: '"ReachInbox Scheduler" <scheduler@reachinbox.ai>',
        to: email.recipient,
        subject: email.subject,
        text: email.body,
      });

      console.log(`Email sent: ${info.messageId}`);

      const nodemailer = require("nodemailer");
      console.log(
        `Preview URL: ${nodemailer.getTestMessageUrl(info) || "N/A"}`,
      );

      await prisma.email.update({
        where: { id: email.id },
        data: { status: "sent" },
      });
    } catch (err) {
      console.error(`Failed to send email ${email.id}:`, err);

      await prisma.email.update({
        where: { id: email.id },
        data: { status: "failed" },
      });

      throw err;
    }
  },
  {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} failed:`, err.message);
});

console.log("Email worker started, waiting for jobs...");
