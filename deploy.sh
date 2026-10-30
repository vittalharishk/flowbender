#!/usr/bin/env bash
set -e

cd /home/flowbender
echo "Pulling latest code from origin main..."
git pull origin main

echo "Installing any new dependencies if needed..."
npm install

echo "Checking PM2 process..."
pm2 reload flowbender-next || pm2 restart flowbender-next

echo "Deployment complete! Application is updated."
