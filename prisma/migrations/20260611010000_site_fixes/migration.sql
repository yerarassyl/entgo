ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPERADMIN';

CREATE TYPE "SupportTicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED');
CREATE TYPE "ContentSubmissionStatus" AS ENUM ('REVIEW', 'APPROVED', 'REJECTED');

ALTER TABLE "Topic"
ADD COLUMN "difficulty" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN "expectedScoreGain" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN "status" "QuestionStatus" NOT NULL DEFAULT 'PUBLISHED';

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "message" TEXT NOT NULL,
  "screenshotUrl" TEXT,
  "pageUrl" TEXT NOT NULL,
  "userAgent" TEXT,
  "subscription" TEXT,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'NEW',
  "assigneeId" TEXT,
  "response" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentSubmission" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "ContentSubmissionStatus" NOT NULL DEFAULT 'REVIEW',
  "moderatorId" TEXT,
  "feedback" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContentSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");
CREATE INDEX "ContentSubmission_status_createdAt_idx" ON "ContentSubmission"("status", "createdAt");
CREATE INDEX "ContentSubmission_adminId_idx" ON "ContentSubmission"("adminId");

ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContentSubmission" ADD CONSTRAINT "ContentSubmission_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContentSubmission" ADD CONSTRAINT "ContentSubmission_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
