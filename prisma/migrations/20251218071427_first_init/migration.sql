-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTING', 'AUTHENTICATED', 'LOGGED_OUT', 'ERROR');

-- CreateTable
CREATE TABLE "WhatsAppSession" (
    "id" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "whatsappId" TEXT,
    "pushName" TEXT,
    "phoneNumber" TEXT,
    "status" "ConnectionStatus" NOT NULL,
    "lastError" TEXT,
    "lastActivity" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_contact" (
    "id" TEXT NOT NULL,
    "pushName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "profilePicture" TEXT,
    "lastSeen" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessage" TEXT,
    "lastMessageTime" TIMESTAMP(3),
    "lastMessageFromMe" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "whatsapp_contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "contentType" TEXT NOT NULL,
    "fromMe" BOOLEAN NOT NULL,
    "status" INTEGER NOT NULL,
    "messageTimestamp" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT NOT NULL,
    "messageKey" JSONB NOT NULL,
    "reactionMessage" TEXT,
    "quotedMessage" TEXT,
    "mediaUrl" TEXT,
    "metaData" JSONB,
    "contactId" TEXT NOT NULL,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_contact_remoteJid_idx" ON "whatsapp_contact"("remoteJid");

-- CreateIndex
CREATE INDEX "whatsapp_contact_phoneNumber_idx" ON "whatsapp_contact"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contact_remoteJid_sessionId_key" ON "whatsapp_contact"("remoteJid", "sessionId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_messageId_idx" ON "WhatsAppMessage"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_messageId_contactId_key" ON "WhatsAppMessage"("messageId", "contactId");

-- AddForeignKey
ALTER TABLE "whatsapp_contact" ADD CONSTRAINT "whatsapp_contact_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WhatsAppSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "whatsapp_contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
