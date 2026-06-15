/*
  Warnings:

  - A unique constraint covering the columns `[notificationType,channel,region]` on the table `GlobalPolicy` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GlobalPolicy_notificationType_channel_region_key" ON "GlobalPolicy"("notificationType", "channel", "region");
