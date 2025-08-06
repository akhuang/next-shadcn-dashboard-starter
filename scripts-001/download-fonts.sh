#!/bin/bash

# 下载 Google Fonts 到本地
# 使用方法: ./scripts/download-fonts.sh

set -e

FONTS_DIR="public/fonts"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"
mkdir -p "$FONTS_DIR"

echo "正在下载字体文件到 $FONTS_DIR..."

# Geist 字体
echo "下载 Geist 字体..."
curl -s "https://fonts.googleapis.com/css2?family=Geist:wght@100;200;300;400;500;600;700;800;900&display=swap" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" \
  > "${FONTS_DIR}/geist.css"

# Geist Mono 字体
echo "下载 Geist Mono 字体..."
curl -s "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100;200;300;400;500;600;700;800;900&display=swap" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" \
  > "${FONTS_DIR}/geist-mono.css"

# Inter 字体
echo "下载 Inter 字体..."
curl -s "https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" \
  > "${FONTS_DIR}/inter.css"

# Instrument Sans 字体
echo "下载 Instrument Sans 字体..."
curl -s "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" \
  > "${FONTS_DIR}/instrument-sans.css"

# Mulish 字体
echo "下载 Mulish 字体..."
curl -s "https://fonts.googleapis.com/css2?family=Mulish:wght@200;300;400;500;600;700;800;900&display=swap" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" \
  > "${FONTS_DIR}/mulish.css"

# Noto Sans Mono 字体
echo "下载 Noto Sans Mono 字体..."
curl -s "https://fonts.googleapis.com/css2?family=Noto+Sans+Mono:wght@100;200;300;400;500;600;700;800;900&display=swap" \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" \
  > "${FONTS_DIR}/noto-sans-mono.css"

echo "字体 CSS 文件下载完成！"

# 下载实际的字体文件
echo "正在下载字体文件..."

# 从 CSS 文件中提取字体 URL 并下载
for css_file in "${FONTS_DIR}"/*.css; do
  echo "处理 $css_file..."
  # 提取 woff2 URL 并下载
  grep -o 'https://[^)]*\.woff2' "$css_file" | while read -r url; do
    filename=$(basename "$url")
    if [ ! -f "${FONTS_DIR}/$filename" ]; then
      echo "下载 $filename..."
      curl -s "$url" -o "${FONTS_DIR}/$filename"
    fi
  done
  
  # 替换 CSS 中的 URL 为本地路径
  sed -i.bak "s|https://[^)]*fonts/\([^)]*\.woff2\)|/fonts/\1|g" "$css_file"
  rm "${css_file}.bak" 2>/dev/null || true
done

echo "✅ 所有字体文件下载完成！"
echo "字体文件位置: $FONTS_DIR/"
ls -la "$FONTS_DIR/"