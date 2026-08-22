-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('locked', 'in_progress', 'completed', 'claimed');
CREATE TYPE "TaskType" AS ENUM ('tap_count');
CREATE TYPE "RewardType" AS ENUM ('tap', 'task_claim', 'migration');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlayerProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coinsMicro" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "crownTier" TEXT NOT NULL DEFAULT 'bronze_1',
    "totalTaps" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlayerProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TaskDefinition" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "target" INTEGER NOT NULL,
    "rewardMicro" INTEGER NOT NULL,
    "rewardXp" INTEGER NOT NULL DEFAULT 0,
    "unlockAfterTaps" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaskDefinition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "TaskStatus" NOT NULL DEFAULT 'locked',
    "unlockedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RewardTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RewardType" NOT NULL,
    "amountMicro" INTEGER NOT NULL,
    "xpAmount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RewardTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TapRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TapRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GameConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "tapRewardMicro" INTEGER NOT NULL DEFAULT 1000,
    "xpPerTap" INTEGER NOT NULL DEFAULT 1,
    "tapsRequiredToUnlockTask" INTEGER NOT NULL DEFAULT 25,
    "percentageRewardEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultPercentage" INTEGER NOT NULL DEFAULT 100,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
CREATE UNIQUE INDEX "PlayerProgress_userId_key" ON "PlayerProgress"("userId");
CREATE UNIQUE INDEX "TaskDefinition_title_key" ON "TaskDefinition"("title");
CREATE INDEX "PlayerProgress_userId_idx" ON "PlayerProgress"("userId");
CREATE UNIQUE INDEX "UserTask_userId_taskId_key" ON "UserTask"("userId", "taskId");
CREATE INDEX "UserTask_userId_idx" ON "UserTask"("userId");
CREATE INDEX "RewardTransaction_userId_idx" ON "RewardTransaction"("userId");
CREATE INDEX "RewardTransaction_createdAt_idx" ON "RewardTransaction"("createdAt");
CREATE UNIQUE INDEX "TapRequest_userId_requestId_key" ON "TapRequest"("userId", "requestId");
CREATE INDEX "TapRequest_userId_idx" ON "TapRequest"("userId");

ALTER TABLE "PlayerProgress" ADD CONSTRAINT "PlayerProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTask" ADD CONSTRAINT "UserTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RewardTransaction" ADD CONSTRAINT "RewardTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TapRequest" ADD CONSTRAINT "TapRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
