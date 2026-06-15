export const NOTIFICATION_TYPES = ['transactional', 'marketing'] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const CHANNELS = ['email', 'sms', 'messenger', 'push'] as const;

export type Channel = (typeof CHANNELS)[number];

export const REGIONS = ['EU', 'US', 'GE', 'GLOBAL'] as const;

export type Region = (typeof REGIONS)[number];
