import { Injectable } from '@nestjs/common';
import type {
  Channel,
  DefaultPreference,
  NotificationType,
  UserPreference,
  UserQuietHours,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { UpdateUserPreferencesInput } from '../domain/preferences.types';

@Injectable()
export class PreferencesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDefaultPreferences(): Promise<DefaultPreference[]> {
    return this.prisma.defaultPreference.findMany({
      orderBy: [{ notificationType: 'asc' }, { channel: 'asc' }],
    });
  }

  async findDefaultPreference(
    notificationType: NotificationType,
    channel: Channel,
  ): Promise<DefaultPreference | null> {
    return this.prisma.defaultPreference.findUnique({
      where: {
        notificationType_channel: {
          notificationType,
          channel,
        },
      },
    });
  }

  async findUserPreferences(userId: string): Promise<UserPreference[]> {
    return this.prisma.userPreference.findMany({
      where: {
        userId,
      },
    });
  }

  async findUserPreference(
    userId: string,
    notificationType: NotificationType,
    channel: Channel,
  ): Promise<UserPreference | null> {
    return this.prisma.userPreference.findUnique({
      where: {
        userId_notificationType_channel: {
          userId,
          notificationType,
          channel,
        },
      },
    });
  }

  async findUserQuietHours(userId: string): Promise<UserQuietHours | null> {
    return this.prisma.userQuietHours.findUnique({
      where: {
        userId,
      },
    });
  }

  async updateUserPreferences(
    input: UpdateUserPreferencesInput,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      for (const preference of input.preferences ?? []) {
        await transaction.userPreference.upsert({
          where: {
            userId_notificationType_channel: {
              userId: input.userId,
              notificationType: preference.notificationType,
              channel: preference.channel,
            },
          },
          update: {
            enabled: preference.enabled,
          },
          create: {
            userId: input.userId,
            notificationType: preference.notificationType,
            channel: preference.channel,
            enabled: preference.enabled,
          },
        });
      }

      if (input.quietHours) {
        await transaction.userQuietHours.upsert({
          where: {
            userId: input.userId,
          },
          update: {
            enabled: input.quietHours.enabled,
            startTimeLocal: input.quietHours.startTimeLocal,
            endTimeLocal: input.quietHours.endTimeLocal,
            timezone: input.quietHours.timezone,
          },
          create: {
            userId: input.userId,
            enabled: input.quietHours.enabled,
            startTimeLocal: input.quietHours.startTimeLocal,
            endTimeLocal: input.quietHours.endTimeLocal,
            timezone: input.quietHours.timezone,
          },
        });
      }
    });
  }
}
