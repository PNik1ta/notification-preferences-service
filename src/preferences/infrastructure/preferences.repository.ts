import { Injectable } from '@nestjs/common';
import type {
  DefaultPreference,
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

  async findUserPreferences(userId: string): Promise<UserPreference[]> {
    return this.prisma.userPreference.findMany({
      where: {
        userId,
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
