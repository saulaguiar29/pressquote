#!/bin/bash

# PressQuote startup script
# Starts both backend API and frontend dev server

set -e

RESET="\033[0m"
BLUE="\033[34m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"

echo ""
echo -e "${CYAN}  🖨️  PressQuote — Print Shop Quoting${RESET}"
echo -e "${CYAN}  =====================================\n${RESET}"

# Check Node version
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo -e "  ❌ Node.js 22+ required (found: $(node -v))"
  echo -e "  Please upgrade: https://nodejs.org\n"
  exit 1
fi
echo -e "  ✅ Node.js $(node -v) detected\n"

# Install if needed
if [ ! -d "backend/node_modules" ]; then
  echo -e "  📦 Installing backend dependencies..."
  npm install --prefix backend --silent
fi

if [ ! -d "frontend/node_modules" ]; then
  echo -e "  📦 Installing frontend dependencies..."
  npm install --prefix frontend --silent
fi

# Seed if no database
if [ ! -f "backend/pressquote.db" ]; then
  echo -e "  🌱 Seeding database with sample data..."
  node --experimental-sqlite backend/db/seed.js 2>/dev/null
  echo -e "  ✅ Database ready\n"
fi

echo -e "  ${GREEN}Starting PressQuote...${RESET}"
echo -e "  ${BLUE}API:      http://localhost:3001${RESET}"
echo -e "  ${BLUE}Frontend: http://localhost:5173${RESET}"
echo -e "  ${YELLOW}Login:    admin@pressquote.com / password123${RESET}"
echo ""

# Start both in parallel
trap 'kill $(jobs -p) 2>/dev/null' EXIT

node --experimental-sqlite backend/server.js 2>/dev/null &
sleep 1
cd frontend && npm run dev 2>/dev/null &

wait
