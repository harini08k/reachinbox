import { esClient, EMAIL_INDEX } from "./elasticsearch";

interface EmailDoc {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledTime: Date;
  senderEmail: string;
}

export async function indexEmail(email: EmailDoc) {
  try {
    await esClient.index({
      index: EMAIL_INDEX,
      id: email.id,
      document: {
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        status: email.status,
        scheduledTime: email.scheduledTime,
        senderEmail: email.senderEmail,
      },
    });
  } catch (err) {
    console.error(`Failed to index email ${email.id} in Elasticsearch:`, err);
    // Don't throw — search indexing failing shouldn't break email scheduling/sending
  }
}
