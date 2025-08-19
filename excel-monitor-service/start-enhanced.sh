#!/bin/bash

# 设置环境变量
export EXCEL_WATCH_DIR="/tmp/test-contacts"
export NAVIGATION_EXCEL_DIR="/tmp/test-navigation"
export REDIS_HOST="localhost"
export REDIS_PORT="6379"

echo "Starting Enhanced Excel Monitor Service..."
echo "Monitoring directories:"
echo "  - Contacts: $EXCEL_WATCH_DIR"
echo "  - Navigation: $NAVIGATION_EXCEL_DIR"
echo ""

# 启动增强版监控服务
node index-enhanced.js