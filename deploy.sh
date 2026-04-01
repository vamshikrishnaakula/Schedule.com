#!/bin/bash

set -e

echo "=============================="
echo "Starting Schedule.leadnest.ai Deployment"
echo "=============================="

cd ~/cal.com

#echo "Pulling latest code..."
#git pull origin main

echo "Installing dependencies..."
yarn install --frozen-lockfile

echo "Setting Node memory..."
export NODE_OPTIONS="--max-old-space-size=8192"

echo "Generating Prisma client..."
cd packages/prisma
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy
cd ~/cal.com

echo "Building application..."
yarn build

echo "Restarting PM2 process..."
pm2 restart calcom || pm2 start "yarn workspace @calcom/web start" --name calcom

echo "Saving PM2 process..."
pm2 save

echo "=============================="
echo "Deployment Completed"
echo "=============================="
