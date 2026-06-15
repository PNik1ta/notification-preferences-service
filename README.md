# Notification Preferences Service

A backend service for managing user notification preferences and evaluating whether a notification can be sent to a user.

The service supports:

- default notification preferences for new users
- user-specific preference overrides
- quiet hours with timezone support
- global policies by notification type, channel, and region
- idempotent preference updates
- allow/deny notification evaluation with clear decision reasons
- basic structured logging for preference updates and evaluation decisions

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
- Swagger / OpenAPI

## Requirements

For Docker-based usage:

- Docker
- Docker Compose

For local development:

- Node.js
- npm
- PostgreSQL or Docker Compose

## Quick start with Docker

The easiest way to run the service is with Docker Compose:

```bash
docker compose up -d --build
```

This starts PostgreSQL and the API service.

On application startup, the API container runs:

1. Prisma migrations
2. Database seed
3. NestJS application

The API will be available at:

```txt
http://localhost:3000
```

Swagger UI is available at:

```txt
http://localhost:3000/docs
```

To view logs:

```bash
docker compose logs -f app
```

To stop services:

```bash
docker compose down
```

To reset the database volume:

```bash
docker compose down -v
```

## Environment

Create a `.env` file based on `.env.example` when running the app locally:

```env
DATABASE_URL="postgresql://app:app@localhost:5432/notification_preferences?schema=public"
PORT=3000
```

For Docker Compose, the API container uses the internal service name as the database host:

```env
DATABASE_URL="postgresql://app:app@postgres:5432/notification_preferences?schema=public"
```

This difference is important: inside Docker, `localhost` means the current container, not the PostgreSQL container.

## Local development

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npm run db:generate
```

Run migrations:

```bash
npm run db:migrate -- --name init
```

Seed default preferences and global policies:

```bash
npm run db:seed
```

Start the application:

```bash
npm run start:dev
```

## Scripts

```bash
npm run start:dev      # start app in development mode
npm run build          # build the application
npm run start:prod     # run compiled app
npm run lint           # run eslint
npm run test           # run unit tests
npm run test:e2e       # run e2e tests
npm run test:cov       # run tests with coverage
npm run db:generate    # generate Prisma Client
npm run db:migrate     # create and apply local migration
npm run db:seed        # seed database
npm run db:studio      # open Prisma Studio
```

## API documentation

Swagger UI is available at:

```txt
http://localhost:3000/docs
```

It can be used to inspect and manually test the available API endpoints.

## API overview

### Get user preferences

```http
GET /users/:userId/preferences
```

Example:

```bash
curl http://localhost:3000/users/user-1/preferences
```

Response example:

```json
{
  "userId": "user-1",
  "preferences": [
    {
      "notificationType": "transactional",
      "channel": "email",
      "enabled": true,
      "source": "default"
    },
    {
      "notificationType": "marketing",
      "channel": "email",
      "enabled": false,
      "source": "default"
    }
  ],
  "quietHours": null
}
```

The `source` field shows whether the effective value came from default preferences or from a user override.

### Update user preferences

```http
POST /users/:userId/preferences
```

Example:

```bash
curl -X POST http://localhost:3000/users/user-1/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [
      {
        "notificationType": "marketing",
        "channel": "email",
        "enabled": true
      }
    ],
    "quietHours": {
      "enabled": true,
      "startTimeLocal": "22:00",
      "endTimeLocal": "08:00",
      "timezone": "Asia/Tbilisi"
    }
  }'
```

Response example:

```json
{
  "userId": "user-1",
  "preferences": [
    {
      "notificationType": "marketing",
      "channel": "email",
      "enabled": true,
      "source": "user"
    }
  ],
  "quietHours": {
    "enabled": true,
    "startTimeLocal": "22:00",
    "endTimeLocal": "08:00",
    "timezone": "Asia/Tbilisi"
  }
}
```

The update operation is idempotent. Repeating the same request produces the same final state and does not create duplicate preference records.

### Evaluate notification

```http
POST /evaluate
```

Example:

```bash
curl -X POST http://localhost:3000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "notificationType": "marketing",
    "channel": "sms",
    "region": "EU",
    "datetime": "2026-05-21T10:00:00Z"
  }'
```

Response example:

```json
{
  "decision": "deny",
  "reason": "blocked_by_global_policy"
}
```

## Domain model

Notification type and channel are modeled separately.

Instead of modeling combined values like `marketing_email`, the service uses structured values:

```json
{
  "notificationType": "marketing",
  "channel": "email"
}
```

This avoids duplication and makes preferences and policies easier to evaluate by:

```txt
notificationType + channel + region
```

Supported notification types:

- `transactional`
- `marketing`

Supported channels:

- `email`
- `sms`
- `messenger`
- `push`

Supported regions:

- `EU`
- `US`
- `GE`
- `GLOBAL`

## Seed data

The seed creates default preferences:

| Notification type | Channel | Enabled |
| --- | --- | --- |
| transactional | email | true |
| transactional | sms | true |
| transactional | messenger | true |
| transactional | push | true |
| marketing | email | false |
| marketing | sms | false |
| marketing | messenger | true |
| marketing | push | true |

The seed also creates one global policy:

| Notification type | Channel | Region | Effect |
| --- | --- | --- | --- |
| marketing | sms | EU | deny |

## Evaluation order

The notification evaluation flow is:

1. Check global policy
2. Resolve effective preference:
   - user preference override
   - default preference fallback
3. Check whether the effective preference is disabled
4. Check quiet hours
5. Allow notification

Global policies have priority over user preferences.

Quiet hours do not block transactional notifications.

Decision reasons:

- `allowed`
- `blocked_by_global_policy`
- `disabled_by_user_preference`
- `disabled_by_default_preference`
- `blocked_by_quiet_hours`
- `missing_default_preference`

## Quiet hours

Quiet hours are evaluated in the user's configured timezone.

Example:

```json
{
  "enabled": true,
  "startTimeLocal": "22:00",
  "endTimeLocal": "08:00",
  "timezone": "Asia/Tbilisi"
}
```

The service supports intervals that cross midnight, for example `22:00` to `08:00`.

Transactional notifications are allowed during quiet hours. Non-transactional notifications, such as marketing notifications, are denied during quiet hours.

## Idempotency

Preference updates are idempotent because the API sets the desired state instead of toggling it.

For example, sending this request multiple times:

```json
{
  "preferences": [
    {
      "notificationType": "marketing",
      "channel": "email",
      "enabled": false
    }
  ]
}
```

has the same result as sending it once.

At the database level, this is implemented with unique constraints and Prisma `upsert` operations.

## Architecture

The project uses feature-first modules with a light clean architecture split.

Inside each feature:

- `api` — NestJS controllers and request schemas
- `application` — use cases and orchestration logic
- `domain` — business types and decision rules
- `infrastructure` — Prisma repositories and persistence details

This keeps HTTP, database access, and business decision logic separated without adding unnecessary complexity for the test task.

Main modules:

```txt
src/
  common/
  database/
  preferences/
  policies/
  evaluation/
```

### Preferences module

Responsible for:

- reading effective user preferences
- updating user preference overrides
- updating quiet hours
- preserving idempotent update behavior

### Policies module

Responsible for:

- reading enabled global policies
- isolating policy persistence from evaluation logic

### Evaluation module

Responsible for:

- orchestrating preference, policy, and quiet-hours lookup
- calling the domain decision service
- returning allow/deny decisions with reasons

The core decision logic is placed in the domain layer and can be tested without NestJS, HTTP, or PostgreSQL.

## Persistence

The service stores:

- default preferences
- user preference overrides
- user quiet hours
- global policies

Default preferences are not copied for each new user.

Instead, effective preferences are resolved dynamically from defaults plus user overrides.

This avoids duplicated data and keeps default configuration centralized.

## Validation

Request validation is implemented with Zod.

The service validates:

- notification types
- channels
- regions
- local time format in `HH:mm`
- IANA timezones
- ISO datetimes
- non-empty request bodies for update operations

## Observability

The service logs key business events:

- preference updates
- notification evaluation decisions

Example events:

```txt
preferences.updated
notification.evaluate.allow
notification.evaluate.deny
```

For production, I would add structured metrics such as:

- `notification_decisions_total{decision,reason,channel,region}`
- `preference_updates_total`
- `evaluation_duration_ms`
- `http_request_duration_ms`

These metrics could be scraped by Prometheus and visualized in Grafana. Logs could be shipped to Loki, ELK, or OpenSearch depending on the infrastructure.

Grafana, Kibana, and a full observability stack are intentionally not included in this test task to keep the scope focused on the core service behavior.

## Tests

The project includes:

- unit tests for the notification decision service
- e2e tests for API behavior

Covered scenarios:

- default preferences for a new user
- user preference overrides
- quiet hours
- quiet hours crossing midnight
- transactional notifications during quiet hours
- global policy denial
- idempotent preference updates

Run unit tests:

```bash
npm run test
```

Run e2e tests:

```bash
npm run test:e2e
```

## Production improvements

If this service were prepared for production, I would add:

- authentication and authorization
- tenant or organization isolation
- admin API for managing global policies
- audit log for preference changes
- rate limiting
- CI pipeline with lint, tests, build, and migration checks
- separate test database for e2e tests
- caching for default preferences and global policies
- more flexible policy matching, for example region-wide or channel-wide policies
- idempotency keys for external clients if commands become asynchronous
- OpenTelemetry tracing
- Prometheus metrics and Grafana dashboards
- centralized log shipping
- stricter migration strategy for production deployments

## Useful manual checks

Get preferences:

```bash
curl http://localhost:3000/users/user-1/preferences
```

Update preferences:

```bash
curl -X POST http://localhost:3000/users/user-1/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": [
      {
        "notificationType": "marketing",
        "channel": "email",
        "enabled": true
      }
    ],
    "quietHours": {
      "enabled": true,
      "startTimeLocal": "22:00",
      "endTimeLocal": "08:00",
      "timezone": "Asia/Tbilisi"
    }
  }'
```

Evaluate global policy denial:

```bash
curl -X POST http://localhost:3000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "notificationType": "marketing",
    "channel": "sms",
    "region": "EU",
    "datetime": "2026-05-21T10:00:00Z"
  }'
```

Evaluate quiet hours denial:

```bash
curl -X POST http://localhost:3000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "notificationType": "marketing",
    "channel": "push",
    "region": "GE",
    "datetime": "2026-05-21T21:30:00Z"
  }'
```

Evaluate transactional notification during quiet hours:

```bash
curl -X POST http://localhost:3000/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "notificationType": "transactional",
    "channel": "push",
    "region": "GE",
    "datetime": "2026-05-21T21:30:00Z"
  }'
```
