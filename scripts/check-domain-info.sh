#!/bin/bash
# Linux/Mac 脚本 - 检查域信息

echo "=== 检查 Windows 域信息 ==="
echo ""

# 方法 1: 使用 nslookup 查找域控制器
echo "方法 1: 查找域控制器 (SRV 记录)"
echo "请输入您的域名 (例如: contoso.com):"
read DOMAIN

echo ""
echo "查找 LDAP 服务器..."
nslookup -type=SRV _ldap._tcp.$DOMAIN 2>/dev/null | grep -A 2 "service"

echo ""
echo "查找域控制器..."
nslookup -type=SRV _ldap._tcp.dc._msdcs.$DOMAIN 2>/dev/null | grep -A 2 "service"

# 方法 2: 使用 ldapsearch 测试连接
echo ""
echo "方法 2: 测试 LDAP 连接"
echo "请输入域控制器地址 (例如: dc01.contoso.com):"
read DC_HOST

echo ""
echo "测试匿名连接..."
ldapsearch -x -H ldap://$DC_HOST -b "" -s base "(objectclass=*)" namingContexts 2>/dev/null

# 生成 Base DN
IFS='.' read -ra PARTS <<< "$DOMAIN"
BASE_DN=""
for part in "${PARTS[@]}"; do
    if [ -z "$BASE_DN" ]; then
        BASE_DN="DC=$part"
    else
        BASE_DN="$BASE_DN,DC=$part"
    fi
done

echo ""
echo "=== 建议的 .env 配置 ==="
echo "LDAP_URL=ldap://$DC_HOST:389"
echo "LDAP_BASE_DN=$BASE_DN"
echo ""
echo "# 或使用加密连接"
echo "LDAP_URL=ldaps://$DC_HOST:636"
echo "LDAP_BASE_DN=$BASE_DN"