#!/bin/bash

# 下载思源黑体中文字体脚本
set -e

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    echo -e "${2}${1}${NC}"
}

print_message "开始下载思源黑体中文字体..." "$BLUE"

# 创建字体目录
FONTS_DIR="public/fonts"
mkdir -p "$FONTS_DIR"

# 清理旧文件
rm -f "${FONTS_DIR}"/SourceHanSans*.otf
rm -f "${FONTS_DIR}"/NotoSansSC*.woff2

# 下载完整的 Noto Sans SC 字体文件
print_message "正在下载 NotoSansSC-Regular.woff2..." "$YELLOW"
curl -L -o "${FONTS_DIR}/NotoSansSC-Regular.woff2" "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400&display=swap" | grep -o 'https://[^)]*\.woff2' | head -1 | xargs curl -L -o "${FONTS_DIR}/NotoSansSC-Regular.woff2"

print_message "使用备用下载源..." "$YELLOW"

# 使用备用字体源 - 从 cdn 下载
print_message "正在下载 NotoSansSC-Light.woff2..." "$YELLOW"
curl -L -o "${FONTS_DIR}/NotoSansSC-Light.woff2" "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-300-normal.woff2"

print_message "正在下载 NotoSansSC-Regular.woff2..." "$YELLOW"  
curl -L -o "${FONTS_DIR}/NotoSansSC-Regular.woff2" "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-400-normal.woff2"

print_message "正在下载 NotoSansSC-Medium.woff2..." "$YELLOW"
curl -L -o "${FONTS_DIR}/NotoSansSC-Medium.woff2" "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-500-normal.woff2"

print_message "正在下载 NotoSansSC-Bold.woff2..." "$YELLOW"
curl -L -o "${FONTS_DIR}/NotoSansSC-Bold.woff2" "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest/chinese-simplified-700-normal.woff2"

print_message "思源黑体字体下载完成！" "$GREEN"
print_message "字体文件保存在: ${FONTS_DIR}/" "$BLUE"

# 显示下载的文件
print_message "已下载的中文字体文件:" "$BLUE"
ls -lh "${FONTS_DIR}"/NotoSans*