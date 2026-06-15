import { DateTime } from 'luxon';
import { z } from 'zod';
import {
  CHANNELS,
  NOTIFICATION_TYPES,
  REGIONS,
} from '../domain/notification.types';

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);

export const channelSchema = z.enum(CHANNELS);

export const regionSchema = z.enum(REGIONS);

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
