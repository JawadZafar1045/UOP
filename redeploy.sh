#!/bin/bash

echo "🚀 Starting CSZone LMS Redeployment..."

# Backup env files
echo "📦 Backing up environment files..."
cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
cp frontend/.env.local frontend/.env.local.backup.$(date +%Y%m%d_%H%M%S)

# Pull latest changes
echo "📥 Pulling latest code from cszone_lms branch..."
git pull origin cszone_lms

# Install dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install

echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install

# Restore env files
echo "🔄 Restoring environment files..."
cd ../backend
cp .env.backup .env 2>/dev/null || echo "⚠️  No .env.backup found, keeping existing .env"

cd ../frontend
cp .env.local.backup .env.local 2>/dev/null || echo "⚠️  No .env.local.backup found, keeping existing .env.local"

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Restart PM2 processes
echo "🔄 Restarting PM2 processes..."
cd ../backend
pm2 restart cszone-lms-backend

cd ../frontend
pm2 restart cszone-lms-frontend

# Save PM2 configuration
pm2 save

echo "✅ Redeployment complete!"
echo "📊 Checking status..."
pm2 status

echo "🌐 Testing application..."
curl -s https://lms.cszone.pk/api/health
