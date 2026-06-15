#!/bin/sh

set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npm run db:seed

echo "Starting application..."
node dist/main.js