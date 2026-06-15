import { z } from 'zod';
import {
  channelSchema,
  localTimeSchema,
  notificationTypeSchema,
  timezoneSchema,
} from '../../common/schemas/notification.schemas';

const enabledQuietHoursSchema = z
  .object({
    enabled: z.literal(true),
    startTimeLocal: localTimeSchema,
    endTimeLocal: localTimeSchema,
    timezone: timezoneSchema,
  })
  .strict();

const disabledQuietHoursSchema = z
  .object({
    enabled: z.literal(false),
  })
  .strict();

export const updateUserPreferencesSchema = z
  .object({
    preferences: z
      .array(
        z.object({
          notificationType: notificationTypeSchema,
          channel: channelSchema,
          enabled: z.boolean(),
        }),
      )
      .min(1, 'At least one preference must be provided')
      .optional(),

    quietHours: z
      .discriminatedUnion('enabled', [
        enabledQuietHoursSchema,
        disabledQuietHoursSchema,
      ])
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.preferences === undefined && value.quietHours === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either preferences or quietHours must be provided',
      });
    }

    const seenPreferences = new Set<string>();

    value.preferences?.forEach((preference, index) => {
      const key = `${preference.notificationType}:${preference.channel}`;

      if (seenPreferences.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['preferences', index],
          message: 'Duplicate preference for notificationType/channel',
        });
      }

      seenPreferences.add(key);
    });
  });

export type UpdateUserPreferencesRequest = z.infer<
  typeof updateUserPreferencesSchema
>;
