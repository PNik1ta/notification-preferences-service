import { NotificationDecisionService } from '../notification-decision.service';
import type {
  EvaluateNotificationInput,
  GlobalPolicyState,
  PreferenceState,
  QuietHoursState,
} from '../evaluation.types';

describe('NotificationDecisionService', () => {
  let service: NotificationDecisionService;

  beforeEach(() => {
    service = new NotificationDecisionService();
  });

  it('allows notification when default preference is enabled', () => {
    const result = service.decide({
      request: createRequest({
        notificationType: 'transactional',
        channel: 'email',
      }),
      globalPolicy: null,
      userPreference: null,
      defaultPreference: createPreference({ enabled: true }),
      quietHours: null,
    });

    expect(result).toEqual({
      decision: 'allow',
      reason: 'allowed',
    });
  });

  it('denies notification when default preference is disabled', () => {
    const result = service.decide({
      request: createRequest({
        notificationType: 'marketing',
        channel: 'email',
      }),
      globalPolicy: null,
      userPreference: null,
      defaultPreference: createPreference({ enabled: false }),
      quietHours: null,
    });

    expect(result).toEqual({
      decision: 'deny',
      reason: 'disabled_by_default_preference',
    });
  });

  it('allows notification when user preference overrides disabled default', () => {
    const result = service.decide({
      request: createRequest({
        notificationType: 'marketing',
        channel: 'email',
      }),
      globalPolicy: null,
      userPreference: createPreference({ enabled: true }),
      defaultPreference: createPreference({ enabled: false }),
      quietHours: null,
    });

    expect(result).toEqual({
      decision: 'allow',
      reason: 'allowed',
    });
  });

  it('denies notification when user preference disables enabled default', () => {
    const result = service.decide({
      request: createRequest({
        notificationType: 'transactional',
        channel: 'email',
      }),
      globalPolicy: null,
      userPreference: createPreference({ enabled: false }),
      defaultPreference: createPreference({ enabled: true }),
      quietHours: null,
    });

    expect(result).toEqual({
      decision: 'deny',
      reason: 'disabled_by_user_preference',
    });
  });

  it('denies notification when global policy is enabled', () => {
    const result = service.decide({
      request: createRequest({
        notificationType: 'marketing',
        channel: 'sms',
        region: 'EU',
      }),
      globalPolicy: createGlobalPolicy({ enabled: true }),
      userPreference: createPreference({ enabled: true }),
      defaultPreference: createPreference({ enabled: true }),
      quietHours: null,
    });

    expect(result).toEqual({
      decision: 'deny',
      reason: 'blocked_by_global_policy',
    });
  });

  it('blocks non-transactional notification during quiet hours crossing midnight', () => {
    const result = service.decide({
      request: createRequest({
        notificationType: 'marketing',
        channel: 'push',
        datetime: '2026-05-21T21:30:00Z',
      }),
      globalPolicy: null,
      userPreference: null,
      defaultPreference: createPreference({ enabled: true }),
      quietHours: createQuietHours({
        enabled: true,
        startTimeLocal: '22:00',
        endTimeLocal: '08:00',
        timezone: 'Asia/Tbilisi',
      }),
    });

    expect(result).toEqual({
      decision: 'deny',
      reason: 'blocked_by_quiet_hours',
    });
  });

  it('allows transactional notification during quiet hours', () => {
    const result = service.decide({
      request: createRequest({
        notificationType: 'transactional',
        channel: 'push',
        datetime: '2026-05-21T21:30:00Z',
      }),
      globalPolicy: null,
      userPreference: null,
      defaultPreference: createPreference({ enabled: true }),
      quietHours: createQuietHours({
        enabled: true,
        startTimeLocal: '22:00',
        endTimeLocal: '08:00',
        timezone: 'Asia/Tbilisi',
      }),
    });

    expect(result).toEqual({
      decision: 'allow',
      reason: 'allowed',
    });
  });

  it('allows non-transactional notification outside quiet hours', () => {
    const result = service.decide({
      request: createRequest({
        notificationType: 'marketing',
        channel: 'push',
        datetime: '2026-05-21T10:00:00Z',
      }),
      globalPolicy: null,
      userPreference: null,
      defaultPreference: createPreference({ enabled: true }),
      quietHours: createQuietHours({
        enabled: true,
        startTimeLocal: '22:00',
        endTimeLocal: '08:00',
        timezone: 'Asia/Tbilisi',
      }),
    });

    expect(result).toEqual({
      decision: 'allow',
      reason: 'allowed',
    });
  });

  it('denies notification when default preference is missing', () => {
    const result = service.decide({
      request: createRequest({
        notificationType: 'marketing',
        channel: 'email',
      }),
      globalPolicy: null,
      userPreference: null,
      defaultPreference: null,
      quietHours: null,
    });

    expect(result).toEqual({
      decision: 'deny',
      reason: 'missing_default_preference',
    });
  });
});

function createRequest(
  input: Partial<EvaluateNotificationInput>,
): EvaluateNotificationInput {
  return {
    userId: input.userId ?? 'user-1',
    notificationType: input.notificationType ?? 'marketing',
    channel: input.channel ?? 'email',
    region: input.region ?? 'GE',
    datetime: input.datetime ?? '2026-05-21T10:00:00Z',
  };
}

function createPreference(input: { enabled: boolean }): PreferenceState {
  return {
    enabled: input.enabled,
  };
}

function createGlobalPolicy(input: { enabled: boolean }): GlobalPolicyState {
  return {
    enabled: input.enabled,
  };
}

function createQuietHours(input: QuietHoursState): QuietHoursState {
  return input;
}
