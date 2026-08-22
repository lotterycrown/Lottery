-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PlayerProgress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "coinsMicro" BIGINT NOT NULL DEFAULT 0,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PlayerProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "provider" TEXT NOT NULL,
  "rewardMicro" INTEGER NOT NULL,
  "rewardXp" INTEGER NOT NULL,
  "dailyUserLimit" INTEGER NOT NULL,
  "cooldownSeconds" INTEGER NOT NULL,
  "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "placementId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'CREATED',
  "transactionId" TEXT,
  "verificationData" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" DATETIME,
  "rewardedAt" DATETIME,
  "expiresAt" DATETIME NOT NULL,
  CONSTRAINT "AdSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdDailyUsage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "completedAds" INTEGER NOT NULL DEFAULT 0,
  "rewardedAds" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AdDailyUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "adSessionId" TEXT,
  "eventType" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "placementId" TEXT,
  "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AdEvent_adSessionId_fkey" FOREIGN KEY ("adSessionId") REFERENCES "AdSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RewardTransaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "amount" BIGINT NOT NULL,
  "xp" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RewardTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProgress_userId_key" ON "PlayerProgress"("userId");
CREATE UNIQUE INDEX "AdSession_transactionId_key" ON "AdSession"("transactionId");
CREATE INDEX "AdSession_userId_createdAt_idx" ON "AdSession"("userId", "createdAt");
CREATE INDEX "AdSession_status_expiresAt_idx" ON "AdSession"("status", "expiresAt");
CREATE UNIQUE INDEX "AdDailyUsage_userId_date_key" ON "AdDailyUsage"("userId", "date");
CREATE INDEX "AdEvent_userId_createdAt_idx" ON "AdEvent"("userId", "createdAt");
CREATE INDEX "AdEvent_adSessionId_idx" ON "AdEvent"("adSessionId");
CREATE UNIQUE INDEX "RewardTransaction_sourceId_key" ON "RewardTransaction"("sourceId");
CREATE INDEX "RewardTransaction_userId_createdAt_idx" ON "RewardTransaction"("userId", "createdAt");
