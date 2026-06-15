import { Injectable } from '@nestjs/common';
import type {
  DefaultPreference,
  UserPreference,
  UserQuietHours,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

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
}
