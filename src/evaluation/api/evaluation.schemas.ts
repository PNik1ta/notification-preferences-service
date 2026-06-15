import { z } from 'zod';
import {
  channelSchema,
  isoDateTimeSchema,
  notificationTypeSchema,
  regionSchema,
} from '../../common/schemas/notification.schemas';

export const evaluateNotificationSchema = z.object({
  userId: z.string().min(1),
  notificationType: notificationTypeSchema,
  channel: channelSchema,
  region: regionSchema,
  datetime: isoDateTimeSchema,
});

export type EvaluateNotificationRequest = z.infer<
  typeof evaluateNotificationSchema
>;
