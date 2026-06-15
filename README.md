# Notification Preferences Service

A small backend service for managing user notification preferences and evaluating whether a notification can be sent to a user.

The service supports:

- default notification preferences
- user-specific preference overrides
- quiet hours with timezone support
- global policies by notification type, channel, and region
- idempotent preference updates
- allow/deny evaluation with clear decision reasons

## Stack

- TypeScript
- NestJS
- PostgreSQL
- Prisma
- Zod
- Luxon
- Jest
- Supertest
- Docker Compose

## Requirements

- Node.js
- npm
- Docker

## Environment

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL="postgresql://app:app@localhost:5432/notification_preferences?schema=public"
PORT=3000