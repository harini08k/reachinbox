/*
  Warnings:

  - Added the required column `senderId` to the `emails` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "emails" ADD COLUMN     "senderId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "senders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "maxEmailsPerHour" INTEGER NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "senders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "senders_email_key" ON "senders"("email");

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "senders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
