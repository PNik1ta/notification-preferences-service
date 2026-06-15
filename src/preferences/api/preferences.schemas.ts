import { z } from 'zod';
import {
  channelSchema,
  localTimeSchema,
  notificationTypeSchema,
  timezoneSchema,
} from '../../common/schemas/notification.schemas';

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
      .optional(),

    quietHours: z
      .object({
        enabled: z.boolean(),
        startTimeLocal: localTimeSchema,
        endTimeLocal: localTimeSchema,
        timezone: timezoneSchema,
      })
      .optional(),
  })
  .refine(
    (value) =>
      value.preferences !== undefined || value.quietHours !== undefined,
    {
      message: 'Either preferences or quietHours must be provided',
    },
  );

export type UpdateUserPreferencesRequest = z.infer<
  typeof updateUserPreferencesSchema
>;
