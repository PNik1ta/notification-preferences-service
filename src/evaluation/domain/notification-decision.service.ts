import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import type {
  EvaluateNotificationInput,
  EvaluateNotificationResponse,
  GlobalPolicyState,
  PreferenceState,
  QuietHoursState,
} from './evaluation.types';

@Injectable()
export class NotificationDecisionService {
  decide(input: {
    request: EvaluateNotificationInput;
    globalPolicy: GlobalPolicyState | null;
    userPreference: PreferenceState | null;
    defaultPreference: PreferenceState | null;
    quietHours: QuietHoursState | null;
  }): EvaluateNotificationResponse {
    const {
      request,
      globalPolicy,
      userPreference,
      defaultPreference,
      quietHours,
    } = input;

    if (globalPolicy?.enabled) {
      return {
        decision: 'deny',
        reason: 'blocked_by_global_policy',
      };
    }

    if (!defaultPreference) {
      return {
        decision: 'deny',
        reason: 'missing_default_preference',
      };
    }

    const effectiveEnabled =
      userPreference?.enabled ?? defaultPreference.enabled;

    if (!effectiveEnabled) {
      return {
        decision: 'deny',
        reason: userPreference
          ? 'disabled_by_user_preference'
          : 'disabled_by_default_preference',
      };
    }

    if (
      this.shouldBlockByQuietHours({
        notificationType: request.notificationType,
        datetime: request.datetime,
        quietHours,
      })
    ) {
      return {
        decision: 'deny',
        reason: 'blocked_by_quiet_hours',
      };
    }

    return {
      decision: 'allow',
      reason: 'allowed',
    };
  }

  private shouldBlockByQuietHours(input: {
    notificationType: EvaluateNotificationInput['notificationType'];
    datetime: string;
    quietHours: QuietHoursState | null;
  }): boolean {
    const { notificationType, datetime, quietHours } = input;

    if (!quietHours?.enabled) {
      return false;
    }

    if (
      quietHours.startTimeLocal === null ||
      quietHours.endTimeLocal === null ||
      quietHours.timezone === null
    ) {
      return false;
    }

    if (notificationType === 'transactional') {
      return false;
    }

    const localDateTime = DateTime.fromISO(datetime, {
      setZone: true,
    }).setZone(quietHours.timezone);

    if (!localDateTime.isValid) {
      return false;
    }

    const currentMinutes = localDateTime.hour * 60 + localDateTime.minute;
    const startMinutes = this.parseLocalTimeToMinutes(
      quietHours.startTimeLocal,
    );
    const endMinutes = this.parseLocalTimeToMinutes(quietHours.endTimeLocal);

    if (startMinutes === endMinutes) {
      return false;
    }

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  private parseLocalTimeToMinutes(value: string): number {
    const [hours, minutes] = value.split(':').map(Number);

    return hours * 60 + minutes;
  }
}
