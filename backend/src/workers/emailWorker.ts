import { Worker, Job } from "bullmq";
import { connection } from "../lib/redis";
import { prisma } from "../lib/prisma";

interface EmailJobData {
  emailId: string;
}

const worker = new Worker<EmailJobData>(
  "email-queue",
  async (job: Job<EmailJobData>) => {
    console.log(`Processing job ${job.id} for email ${job.data.emailId}`);

    // 1. Fetch the latest version of this email from Postgres
    const email = await prisma.email.findUnique({
      where: { id: job.data.emailId },
    });

    if (!email) {
      console.log(`Email ${job.data.emailId} not found, skipping.`);
      return;
    }

    // 2. (For now) simulate "sending" the email
    console.log(`Sending email to ${email.recipient}: "${email.subject}"`);

    // 3. Mark it as sent in the database
    await prisma.email.update({
      where: { id: email.id },
      data: { status: "sent" },
    });

    console.log(`Email ${email.id} marked as sent.`);
  },
  {
    connection,
    concurrency: 5,
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} failed:`, err.message);
});

console.log("Email worker started, waiting for jobs...");
