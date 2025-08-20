#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Setting up development environment...${NC}"

# 1. 检查并启动 Redis
echo -e "\n${YELLOW}Checking Redis...${NC}"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Redis is already running${NC}"
    else
        echo -e "${YELLOW}Starting Redis...${NC}"
        if command -v brew &> /dev/null; then
            brew services start redis
        else
            redis-server --daemonize yes
        fi
        echo -e "${GREEN}✓ Redis started${NC}"
    fi
else
    echo -e "${RED}✗ Redis not installed${NC}"
    echo -e "${CYAN}Installing Redis...${NC}"
    if command -v brew &> /dev/null; then
        brew install redis
        brew services start redis
    else
        echo -e "${RED}Please install Redis manually${NC}"
        exit 1
    fi
fi

# 2. 检查并启动 PostgreSQL
echo -e "\n${YELLOW}Checking PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    if pg_isready &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is already running${NC}"
    else
        echo -e "${YELLOW}Starting PostgreSQL...${NC}"
        if command -v brew &> /dev/null; then
            brew services start postgresql@16
        else
            pg_ctl -D /usr/local/var/postgres start
        fi
        echo -e "${GREEN}✓ PostgreSQL started${NC}"
    fi
    
    # 创建数据库
    echo -e "${YELLOW}Creating database...${NC}"
    createdb navigation_db 2>/dev/null || echo -e "${GREEN}✓ Database already exists${NC}"
    
else
    echo -e "${RED}✗ PostgreSQL not installed${NC}"
    echo -e "${CYAN}Installing PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
        brew install postgresql@16
        brew services start postgresql@16
        createdb navigation_db
    else
        echo -e "${RED}Please install PostgreSQL manually${NC}"
        exit 1
    fi
fi

# 3. 创建测试目录
echo -e "\n${YELLOW}Creating test directories...${NC}"
mkdir -p /tmp/test-contacts /tmp/test-navigation
echo -e "${GREEN}✓ Test directories created${NC}"

# 4. 生成 Prisma Client
echo -e "\n${YELLOW}Generating Prisma Client...${NC}"
pnpm db:generate
echo -e "${GREEN}✓ Prisma Client generated${NC}"

# 5. 初始化数据库
echo -e "\n${YELLOW}Initializing database...${NC}"
pnpm db:push
echo -e "${GREEN}✓ Database schema created${NC}"

# 6. 种子数据
echo -e "\n${YELLOW}Seeding database...${NC}"
pnpm db:seed
echo -e "${GREEN}✓ Database seeded${NC}"

# 7. 创建测试数据
echo -e "\n${YELLOW}Creating test Excel files...${NC}"
node scripts/create-navigation-excel.js
echo -e "${GREEN}✓ Test data created${NC}"

echo -e "\n${GREEN}✅ Development environment is ready!${NC}"
echo -e "\n${CYAN}To start development:${NC}"
echo -e "  ${YELLOW}Terminal 1:${NC} cd excel-monitor-service && npm run dev"
echo -e "  ${YELLOW}Terminal 2:${NC} pnpm dev"
echo -e "\n${CYAN}Or use the all-in-one command:${NC}"
echo -e "  ${GREEN}pnpm dev:full${NC}"