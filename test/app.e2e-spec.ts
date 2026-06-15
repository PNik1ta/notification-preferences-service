import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Channel, NotificationType, Region } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Notification Preferences API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userId = 'e2e-user-1';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);

    await app.init();

    await seedDefaults();
    await cleanupUser(userId);
  });

  afterAll(async () => {
    await cleanupUser(userId);
    await app.close();
  });

  it('returns default preferences for a new user', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${userId}/preferences`)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        userId,
        quietHours: null,
      }),
    );

    expect(response.body.preferences).toEqual(
      expect.arrayContaining([
        {
          notificationType: 'transactional',
          channel: 'email',
          enabled: true,
          source: 'default',
        },
        {
          notificationType: 'marketing',
          channel: 'email',
          enabled: false,
          source: 'default',
        },
      ]),
    );
  });

  it('updates user preference and quiet hours idempotently', async () => {
    const payload = {
      preferences: [
        {
          notificationType: 'marketing',
          channel: 'email',
          enabled: true,
        },
      ],
      quietHours: {
        enabled: true,
        startTimeLocal: '22:00',
        endTimeLocal: '08:00',
        timezone: 'Asia/Tbilisi',
      },
    };

    await request(app.getHttpServer())
      .post(`/users/${userId}/preferences`)
      .send(payload)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/users/${userId}/preferences`)
      .send(payload)
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`/users/${userId}/preferences`)
      .expect(200);

    expect(response.body.preferences).toEqual(
      expect.arrayContaining([
        {
          notificationType: 'marketing',
          channel: 'email',
          enabled: true,
          source: 'user',
        },
      ]),
    );

    expect(response.body.quietHours).toEqual({
      enabled: true,
      startTimeLocal: '22:00',
      endTimeLocal: '08:00',
      timezone: 'Asia/Tbilisi',
    });

    const storedPreferencesCount = await prisma.userPreference.count({
      where: {
        userId,
        notificationType: NotificationType.marketing,
        channel: Channel.email,
      },
    });

    expect(storedPreferencesCount).toBe(1);
  });

  it('denies notification by global policy', async () => {
    const response = await request(app.getHttpServer())
      .post('/evaluate')
      .send({
        userId,
        notificationType: 'marketing',
        channel: 'sms',
        region: 'EU',
        datetime: '2026-05-21T10:00:00Z',
      })
      .expect(200);

    expect(response.body).toEqual({
      decision: 'deny',
      reason: 'blocked_by_global_policy',
    });
  });

  it('blocks marketing push during quiet hours', async () => {
    const response = await request(app.getHttpServer())
      .post('/evaluate')
      .send({
        userId,
        notificationType: 'marketing',
        channel: 'push',
        region: 'GE',
        datetime: '2026-05-21T21:30:00Z',
      })
      .expect(200);

    expect(response.body).toEqual({
      decision: 'deny',
      reason: 'blocked_by_quiet_hours',
    });
  });

  it('denies notification by global fallback policy', async () => {
    const response = await request(app.getHttpServer())
      .post('/evaluate')
      .send({
        userId,
        notificationType: 'marketing',
        channel: 'messenger',
        region: 'GE',
        datetime: '2026-05-21T10:00:00Z',
      })
      .expect(200);

    expect(response.body).toEqual({
      decision: 'deny',
      reason: 'blocked_by_global_policy',
    });
  });

  it('allows transactional push during quiet hours', async () => {
    const response = await request(app.getHttpServer())
      .post('/evaluate')
      .send({
        userId,
        notificationType: 'transactional',
        channel: 'push',
        region: 'GE',
        datetime: '2026-05-21T21:30:00Z',
      })
      .expect(200);

    expect(response.body).toEqual({
      decision: 'allow',
      reason: 'allowed',
    });
  });

  it('rejects evaluate request when datetime has no timezone', async () => {
    const response = await request(app.getHttpServer())
      .post('/evaluate')
      .send({
        userId,
        notificationType: 'marketing',
        channel: 'push',
        region: 'GE',
        datetime: '2026-05-21T21:30:00',
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed',
      }),
    );
  });

  it('rejects duplicate preferences in one update request', async () => {
    const response = await request(app.getHttpServer())
      .post(`/users/${userId}/preferences`)
      .send({
        preferences: [
          {
            notificationType: 'marketing',
            channel: 'email',
            enabled: false,
          },
          {
            notificationType: 'marketing',
            channel: 'email',
            enabled: true,
          },
        ],
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed',
      }),
    );

    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Duplicate preference for notificationType/channel',
          path: ['preferences', 1],
        }),
      ]),
    );
  });

  it('rejects empty preferences update request', async () => {
    const response = await request(app.getHttpServer())
      .post(`/users/${userId}/preferences`)
      .send({
        preferences: [],
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed',
      }),
    );

    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'At least one preference must be provided',
          path: ['preferences'],
        }),
      ]),
    );
  });

  it('allows disabling quiet hours without schedule fields', async () => {
    const response = await request(app.getHttpServer())
      .post(`/users/${userId}/preferences`)
      .send({
        quietHours: {
          enabled: false,
        },
      })
      .expect(200);

    expect(response.body.quietHours).toEqual({
      enabled: false,
      startTimeLocal: null,
      endTimeLocal: null,
      timezone: null,
    });
  });

  it('rejects enabling quiet hours without schedule fields', async () => {
    const response = await request(app.getHttpServer())
      .post(`/users/${userId}/preferences`)
      .send({
        quietHours: {
          enabled: true,
        },
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed',
      }),
    );
  });

  it('rejects disabled quiet hours with schedule fields', async () => {
    const response = await request(app.getHttpServer())
      .post(`/users/${userId}/preferences`)
      .send({
        quietHours: {
          enabled: false,
          startTimeLocal: '22:00',
        },
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Validation failed',
      }),
    );
  });

  async function cleanupUser(targetUserId: string): Promise<void> {
    await prisma.userPreference.deleteMany({
      where: {
        userId: targetUserId,
      },
    });

    await prisma.userQuietHours.deleteMany({
      where: {
        userId: targetUserId,
      },
    });
  }

  async function seedDefaults(): Promise<void> {
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

    await prisma.globalPolicy.upsert({
      where: {
        notificationType_channel_region: {
          notificationType: NotificationType.marketing,
          channel: Channel.messenger,
          region: Region.GLOBAL,
        },
      },
      update: {
        enabled: true,
        reason: 'blocked_by_global_policy',
      },
      create: {
        notificationType: NotificationType.marketing,
        channel: Channel.messenger,
        region: Region.GLOBAL,
        enabled: true,
        reason: 'blocked_by_global_policy',
      },
    });
  }
});
