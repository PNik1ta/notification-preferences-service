import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import {
  Channel,
  NotificationType,
  PrismaClient,
  Region,
} from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });

async function seedDefaultPreferences(): Promise<void> {
  const defaultPreferences = [
    {
      notificationType: NotificationType.transactional,
      channel: Channel.email,
      enabled: true,
    },
    {
      notificationType: NotificationType.transactional,
      channel: Channel.sms,
      enabled: true,
    },
    {
      notificationType: NotificationType.transactional,
      channel: Channel.messenger,
      enabled: true,
    },
    {
      notificationType: NotificationType.transactional,
      channel: Channel.push,
      enabled: true,
    },
    {
      notificationType: NotificationType.marketing,
      channel: Channel.email,
      enabled: false,
    },
    {
      notificationType: NotificationType.marketing,
      channel: Channel.sms,
      enabled: false,
    },
    {
      notificationType: NotificationType.marketing,
      channel: Channel.messenger,
      enabled: true,
    },
    {
      notificationType: NotificationType.marketing,
      channel: Channel.push,
      enabled: true,
    },
  ];

  for (const preference of defaultPreferences) {
    await prisma.defaultPreference.upsert({
      where: {
        notificationType_channel: {
          notificationType: preference.notificationType,
          channel: preference.channel,
        },
      },
      update: {
        enabled: preference.enabled,
      },
      create: preference,
    });
  }
}

async function seedGlobalPolicies(): Promise<void> {
  await prisma.globalPolicy.upsert({
    where: {
      notificationType_channel_region: {
        notificationType: NotificationType.marketing,
        channel: Channel.sms,
        region: Region.EU,
      },
    },
    update: {
      enabled: true,
      reason: 'blocked_by_global_policy',
    },
    create: {
      notificationType: NotificationType.marketing,
      channel: Channel.sms,
      region: Region.EU,
      enabled: true,
      reason: 'blocked_by_global_policy',
    },
  });
}

async function main(): Promise<void> {
  await seedDefaultPreferences();
  await seedGlobalPolicies();

  console.log('Seed completed successfully');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
