import { Injectable, Logger } from '@nestjs/common';
import { PreferencesRepository } from '../infrastructure/preferences.repository';
import type {
  EffectivePreference,
  QuietHoursResponse,
  UpdateUserPreferencesInput,
  UserPreferencesResponse,
} from '../domain/preferences.types';
import type { UpdateUserPreferencesRequest } from '../api/preferences.schemas';

@Injectable()
export class PreferencesService {
  private readonly logger = new Logger(PreferencesService.name);

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

  async updateUserPreferences(
    userId: string,
    request: UpdateUserPreferencesRequest,
  ): Promise<UserPreferencesResponse> {
    const updateInput = this.mapUpdateRequest(userId, request);

    await this.preferencesRepository.updateUserPreferences(updateInput);

    this.logger.log(
      JSON.stringify({
        event: 'preferences.updated',
        userId,
        preferencesCount: request.preferences?.length ?? 0,
        quietHoursUpdated: request.quietHours !== undefined,
      }),
    );

    return this.getUserPreferences(userId);
  }

  private mapUpdateRequest(
    userId: string,
    request: UpdateUserPreferencesRequest,
  ): UpdateUserPreferencesInput {
    return {
      userId,
      preferences: request.preferences?.map((preference) => ({
        userId,
        notificationType: preference.notificationType,
        channel: preference.channel,
        enabled: preference.enabled,
      })),
      quietHours: request.quietHours
        ? {
            userId,
            enabled: request.quietHours.enabled,
            startTimeLocal: request.quietHours.startTimeLocal,
            endTimeLocal: request.quietHours.endTimeLocal,
            timezone: request.quietHours.timezone,
          }
        : undefined,
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
