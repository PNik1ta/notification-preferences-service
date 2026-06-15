-- AlterTable
ALTER TABLE "UserQuietHours" ALTER COLUMN "startTimeLocal" DROP NOT NULL,
ALTER COLUMN "endTimeLocal" DROP NOT NULL,
ALTER COLUMN "timezone" DROP NOT NULL;
