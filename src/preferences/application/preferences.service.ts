import { Injectable } from '@nestjs/common';
import { PreferencesRepository } from '../infrastructure/preferences.repository';
import type {
  EffectivePreference,
  QuietHoursResponse,
  UserPreferencesResponse,
} from '../domain/preferences.types';

@Injectable()
export class PreferencesService {
  constructor(private readonly preferencesRepository: PreferencesRepository) {}

  async getUserPreferences(userId: string): Promise<UserPreferencesResponse> {
    const [defaultPreferences, userPreferences, quietHours] = await Promise.all(
      [
        this.preferencesRepository.findDefaultPreferences(),
        this.preferencesRepository.findUserPreferences(userId),
        this.preferencesRepository.findUserQuietHours(userId),
      ],
    );

    const userPreferencesByKey = new Map(
      userPreferences.map((preference) => [
        this.getPreferenceKey(preference.notificationType, preference.channel),
        preference,
      ]),
    );

    const preferences: EffectivePreference[] = defaultPreferences.map(
      (defaultPreference) => {
        const userPreference = userPreferencesByKey.get(
          this.getPreferenceKey(
            defaultPreference.notificationType,
            defaultPreference.channel,
          ),
        );

        return {
          notificationType: defaultPreference.notificationType,
          channel: defaultPreference.channel,
          enabled: userPreference?.enabled ?? defaultPreference.enabled,
          source: userPreference ? 'user' : 'default',
        };
      },
    );

    return {
      userId,
      preferences,
      quietHours: quietHours ? this.mapQuietHoursResponse(quietHours) : null,
    };
  }

  private getPreferenceKey(notificationType: string, channel: string): string {
    return `${notificationType}:${channel}`;
  }

  private mapQuietHoursResponse(quietHours: {
    enabled: boolean;
    startTimeLocal: string;
    endTimeLocal: string;
    timezone: string;
  }): QuietHoursResponse {
    return {
      enabled: quietHours.enabled,
      startTimeLocal: quietHours.startTimeLocal,
      endTimeLocal: quietHours.endTimeLocal,
      timezone: quietHours.timezone,
    };
  }
}
