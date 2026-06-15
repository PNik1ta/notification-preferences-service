import type { Channel, NotificationType, Region } from '@prisma/client';

export type NotificationDecision = 'allow' | 'deny';

export type NotificationDecisionReason =
  | 'allowed'
  | 'blocked_by_global_policy'
  | 'disabled_by_user_preference'
  | 'disabled_by_default_preference'
  | 'blocked_by_quiet_hours'
  | 'missing_default_preference';

export interface EvaluateNotificationInput {
  userId: string;
  notificationType: NotificationType;
  channel: Channel;
  region: Region;
  datetime: string;
}

export interface EvaluateNotificationResponse {
  decision: NotificationDecision;
  reason: NotificationDecisionReason;
}
