#!/bin/bash

# ─────────────────────────────────────────────────────────────────────────────
# Avenor — Setup Script for MacBook M2 Air
# Run this once: chmod +x setup.sh && ./setup.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════╗"
echo "║   🎯 Avenor — Setup Script           ║"
echo "║   MacBook M2 Air                     ║"
echo "╚══════════════════════════════════════╝"
echo -e "${NC}"

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org (LTS version)"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) found${NC}"

# Install server dependencies
echo -e "\n${YELLOW}📦 Installing server dependencies...${NC}"
cd server
npm install
echo -e "${GREEN}✅ Server dependencies installed${NC}"
cd ..

# Install client dependencies
echo -e "\n${YELLOW}📦 Installing client dependencies...${NC}"
cd client
npm install
echo -e "${GREEN}✅ Client dependencies installed${NC}"
cd ..

echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                                  ║"
echo "║                                                      ║"
echo "║  Next steps:                                         ║"
echo "║  1. Update server/.env with your MongoDB URI         ║"
echo "║  2. Open TWO terminal tabs and run:                  ║"
echo "║                                                      ║"
echo "║     Tab 1 (server):  cd server && npm run dev        ║"
echo "║     Tab 2 (client):  cd client && npm run dev        ║"
echo "║                                                      ║"
echo "║  3. Open: http://localhost:5173                      ║"
echo "║  4. API health: http://localhost:8000/api/health     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"
