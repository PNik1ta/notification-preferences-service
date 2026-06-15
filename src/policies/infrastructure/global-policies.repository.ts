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

  async findBlockingPolicy(
    notificationType: NotificationType,
    channel: Channel,
    region: Region,
  ): Promise<GlobalPolicy | null> {
    const regionPolicy = await this.prisma.globalPolicy.findFirst({
      where: {
        notificationType,
        channel,
        region,
        enabled: true,
      },
    });

    if (regionPolicy) {
      return regionPolicy;
    }

    return this.prisma.globalPolicy.findFirst({
      where: {
        notificationType,
        channel,
        region: 'GLOBAL',
        enabled: true,
      },
    });
  }
}
