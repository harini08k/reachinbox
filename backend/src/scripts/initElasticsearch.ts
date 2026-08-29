import { esClient, EMAIL_INDEX } from "../lib/elasticsearch";

async function main() {
  const exists = await esClient.indices.exists({ index: EMAIL_INDEX });

  if (exists) {
    console.log(`Index "${EMAIL_INDEX}" already exists, skipping creation.`);
    return;
  }

  await esClient.indices.create({
    index: EMAIL_INDEX,
    mappings: {
      properties: {
        recipient: { type: "text" },
        subject: { type: "text" },
        body: { type: "text" },
        status: { type: "keyword" },
        scheduledTime: { type: "date" },
        senderEmail: { type: "keyword" },
      },
    },
  });

  console.log(`Index "${EMAIL_INDEX}" created successfully.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
