import { Worker, Job } from "bullmq";
import { connection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { transporter } from "../lib/mailer";
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
    });

    if (!email) {
      console.log(`Email ${job.data.emailId} not found, skipping.`);
      return;
    }

    try {
      const info = await transporter.sendMail({
        from: '"ReachInbox Scheduler" <scheduler@reachinbox.ai>',
        to: email.recipient,
        subject: email.subject,
        text: email.body,
      });

      console.log(`Email sent: ${info.messageId}`);
      console.log(`Preview URL: ${nodemailerPreviewUrl(info)}`);

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

      throw err; // re-throw so BullMQ marks the job as failed too
    }
  },
  {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
  },
);

// Small helper to safely extract Ethereal's preview URL
function nodemailerPreviewUrl(info: any): string {
  const nodemailer = require("nodemailer");
  return nodemailer.getTestMessageUrl(info) || "N/A";
}

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} failed:`, err.message);
});

console.log("Email worker started, waiting for jobs...");
