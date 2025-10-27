#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Supplication App Update Script${NC}"
echo -e "${YELLOW}================================${NC}"
echo

# Step 1: Stop running containers
echo -e "${YELLOW}[1/4] Stopping Docker Compose...${NC}"
echo "docker compose down"
echo
docker compose down

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to stop containers${NC}"
    exit 1
fi

echo

# Step 2: Pull latest code
echo -e "${YELLOW}[2/4] Pulling latest code...${NC}"
BRANCH="claude/list-current-features-011CUSpxjonL3akNoyTpjvG7"
echo "git pull origin $BRANCH"
echo
git pull origin $BRANCH

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to pull latest code${NC}"
    exit 1
fi

echo

# Step 3: Rebuild and start containers
echo -e "${YELLOW}[3/4] Building and starting containers...${NC}"
echo "docker compose up -d --build"
echo
docker compose up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to start containers${NC}"
    exit 1
fi

echo

# Step 4: Wait for containers to be healthy and show status
echo -e "${YELLOW}[4/4] Waiting for services to be healthy...${NC}"
sleep 5

echo
echo -e "${GREEN}Container Status:${NC}"
docker compose ps

echo
echo -e "${GREEN}Recent Logs:${NC}"
docker compose logs --tail=20

echo
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Update completed successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo
echo "Frontend: http://localhost:8081"
echo "Health Check: curl http://localhost:8081/api/health"
