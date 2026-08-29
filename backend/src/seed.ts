import { prisma } from "./lib/prisma";

async function main() {
  const senders = await prisma.sender.createMany({
    data: [
      {
        name: "Sender One",
        email: "sender1@reachinbox.ai",
        maxEmailsPerHour: 5,
      },
      {
        name: "Sender Two",
        email: "sender2@reachinbox.ai",
        maxEmailsPerHour: 200,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Created ${senders.count} senders.`);
  await prisma.$disconnect();
}

main();
