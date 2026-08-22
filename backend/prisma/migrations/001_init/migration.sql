-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "telegramUsername" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'user',
    "balance" BIGINT NOT NULL DEFAULT 0,
    "xp" BIGINT NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "crownTier" TEXT NOT NULL DEFAULT 'bronze_1',
    "totalTaps" BIGINT NOT NULL DEFAULT 0,
    "lastTapAt" TIMESTAMP(3),
    "referralCode" TEXT NOT NULL,
    "referrerId" TEXT,
    "referralQualifiedAt" TIMESTAMP(3),
    "referralRewardClaimedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "balanceBefore" BIGINT NOT NULL,
    "balanceAfter" BIGINT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "duplicateOf" TEXT,
    "tapId" TEXT,
    "taskClaimId" TEXT,
    "adViewId" TEXT,
    "referralId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reward" BIGINT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "clientTimestamp" TIMESTAMP(3) NOT NULL,
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "rateLimitCheckPassed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "reward" BIGINT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetCount" INTEGER NOT NULL DEFAULT 1,
    "claimCooldownHours" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),
    "claimIdempotencyKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reward" BIGINT NOT NULL,
    "provider" TEXT NOT NULL,
    "adNetworkId" TEXT,
    "adUnitId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verificationError" TEXT,
    "verificationTimestamp" TIMESTAMP(3),
    "clientVerificationToken" TEXT,
    "metadata" JSONB,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "qualifiedAt" TIMESTAMP(3),
    "rewardClaimedAt" TIMESTAMP(3),
    "qualificationThreshold" BIGINT NOT NULL DEFAULT 1000000,
    "qualificationMet" BOOLEAN NOT NULL DEFAULT false,
    "claimIdempotencyKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameConfig" (
    "id" TEXT NOT NULL,
    "tapReward" BIGINT NOT NULL DEFAULT 1000,
    "taskRewardSmall" BIGINT NOT NULL DEFAULT 50000,
    "taskRewardMedium" BIGINT NOT NULL DEFAULT 100000,
    "taskRewardLarge" BIGINT NOT NULL DEFAULT 250000,
    "adReward" BIGINT NOT NULL DEFAULT 10000,
    "referralReward" BIGINT NOT NULL DEFAULT 500000,
    "referralBonusReward" BIGINT NOT NULL DEFAULT 1000000,
    "xpPerTap" INTEGER NOT NULL DEFAULT 1,
    "xpPerTaskSmall" INTEGER NOT NULL DEFAULT 10,
    "xpPerTaskMedium" INTEGER NOT NULL DEFAULT 25,
    "xpPerTaskLarge" INTEGER NOT NULL DEFAULT 50,
    "xpPerAd" INTEGER NOT NULL DEFAULT 5,
    "maxTapsPerHour" INTEGER NOT NULL DEFAULT 3600,
    "tapCooldownMs" INTEGER NOT NULL DEFAULT 100,
    "taskClaimCooldownHours" INTEGER NOT NULL DEFAULT 24,
    "levelThresholds" JSONB NOT NULL DEFAULT '{}',
    "crownProgression" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "newUsers" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalTaps" BIGINT NOT NULL DEFAULT 0,
    "totalTasksClaimed" BIGINT NOT NULL DEFAULT 0,
    "totalAdsWatched" BIGINT NOT NULL DEFAULT 0,
    "totalReferrals" BIGINT NOT NULL DEFAULT 0,
    "totalRewardsPaid" BIGINT NOT NULL DEFAULT 0,
    "averageBalance" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_referrerId_idx" ON "User"("referrerId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_idempotencyKey_key" ON "Transaction"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_tapId_key" ON "Transaction"("tapId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_taskClaimId_key" ON "Transaction"("taskClaimId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_adViewId_key" ON "Transaction"("adViewId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tap_idempotencyKey_key" ON "Tap"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Tap_userId_idx" ON "Tap"("userId");

-- CreateIndex
CREATE INDEX "Tap_serverTimestamp_idx" ON "Tap"("serverTimestamp");

-- CreateIndex
CREATE INDEX "Task_isActive_idx" ON "Task"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TaskProgress_userId_taskId_key" ON "TaskProgress"("userId", "taskId");

-- CreateIndex
CREATE INDEX "TaskProgress_userId_idx" ON "TaskProgress"("userId");

-- CreateIndex
CREATE INDEX "TaskProgress_taskId_idx" ON "TaskProgress"("taskId");

-- CreateIndex
CREATE INDEX "TaskProgress_completed_idx" ON "TaskProgress"("completed");

-- CreateIndex
CREATE INDEX "AdView_userId_idx" ON "AdView"("userId");

-- CreateIndex
CREATE INDEX "AdView_provider_idx" ON "AdView"("provider");

-- CreateIndex
CREATE INDEX "AdView_verified_idx" ON "AdView"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referrerId_referredId_key" ON "Referral"("referrerId", "referredId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAnalytics_date_key" ON "DailyAnalytics"("date");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tap" ADD CONSTRAINT "Tap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskProgress" ADD CONSTRAINT "TaskProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskProgress" ADD CONSTRAINT "TaskProgress_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdView" ADD CONSTRAINT "AdView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
