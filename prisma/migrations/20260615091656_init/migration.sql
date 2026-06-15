-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('transactional', 'marketing');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('email', 'sms', 'messenger', 'push');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('EU', 'US', 'GE', 'GLOBAL');

-- CreateTable
CREATE TABLE "DefaultPreference" (
    "id" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DefaultPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuietHours" (
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "startTimeLocal" TEXT NOT NULL,
    "endTimeLocal" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuietHours_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "GlobalPolicy" (
    "id" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "channel" "Channel" NOT NULL,
    "region" "Region" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT NOT NULL DEFAULT 'blocked_by_global_policy',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DefaultPreference_notificationType_channel_key" ON "DefaultPreference"("notificationType", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_notificationType_channel_key" ON "UserPreference"("userId", "notificationType", "channel");

-- CreateIndex
CREATE INDEX "GlobalPolicy_notificationType_channel_region_idx" ON "GlobalPolicy"("notificationType", "channel", "region");
