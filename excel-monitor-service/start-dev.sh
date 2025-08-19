#!/bin/bash

# 开发环境启动脚本

# 设置环境变量
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=
export REDIS_DB=0
export EXCEL_WATCH_DIR=/tmp/test-contacts
export NODE_ENV=development

# 创建监控目录（如果不存在）
mkdir -p $EXCEL_WATCH_DIR

echo "Starting Excel Monitor Service in development mode..."
echo "Watch directory: $EXCEL_WATCH_DIR"
echo "Redis: $REDIS_HOST:$REDIS_PORT"

# 启动服务
node index.js