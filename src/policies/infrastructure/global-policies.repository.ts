import { Injectable } from '@nestjs/common';
import type {
  Channel,
  GlobalPolicy,
  NotificationType,
  Region,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GlobalPoliciesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findEnabledPolicy(
    notificationType: NotificationType,
    channel: Channel,
    region: Region,
  ): Promise<GlobalPolicy | null> {
    return this.prisma.globalPolicy.findUnique({
      where: {
        notificationType_channel_region: {
          notificationType,
          channel,
          region,
        },
      },
    });
  }
}
