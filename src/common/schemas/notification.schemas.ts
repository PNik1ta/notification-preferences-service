import { DateTime } from 'luxon';
import { z } from 'zod';

export const notificationTypeSchema = z.enum(['transactional', 'marketing']);

export const channelSchema = z.enum(['email', 'sms', 'messenger', 'push']);

export const regionSchema = z.enum(['EU', 'US', 'GE', 'GLOBAL']);

export const localTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected time in HH:mm format');

export const timezoneSchema = z
  .string()
  .refine((timezone) => DateTime.local().setZone(timezone).isValid, {
    message: 'Invalid IANA timezone',
  });

export const isoDateTimeSchema = z
  .string()
  .refine((value) => DateTime.fromISO(value, { setZone: true }).isValid, {
    message: 'Invalid ISO datetime',
  });
