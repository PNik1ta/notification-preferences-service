import type { Channel, NotificationType } from '@prisma/client';

export type PreferenceSource = 'default' | 'user';

export interface EffectivePreference {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
  source: PreferenceSource;
}

export interface QuietHoursResponse {
  enabled: boolean;
  startTimeLocal: string;
  endTimeLocal: string;
  timezone: string;
}

export interface UserPreferencesResponse {
  userId: string;
  preferences: EffectivePreference[];
  quietHours: QuietHoursResponse | null;
}

export interface UserPreferenceUpdateInput {
  userId: string;
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface QuietHoursUpdateInput {
  userId: string;
  enabled: boolean;
  startTimeLocal: string;
  endTimeLocal: string;
  timezone: string;
}

export interface UpdateUserPreferencesInput {
  userId: string;
  preferences?: UserPreferenceUpdateInput[];
  quietHours?: QuietHoursUpdateInput;
}
