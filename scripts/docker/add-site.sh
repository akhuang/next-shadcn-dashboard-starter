#!/bin/bash

# 直接在数据库中添加网站的脚本

DOMAIN="${1:-localhost}"
USER_EMAIL="${2:-admin@example.com}"

echo "Adding site: $DOMAIN for user: $USER_EMAIL"

# 获取用户 ID
USER_ID=$(docker exec plausible-db psql -U postgres -d plausible_db -t -c "SELECT id FROM users WHERE email = '$USER_EMAIL';" | tr -d ' ')

if [ -z "$USER_ID" ]; then
    echo "User not found: $USER_EMAIL"
    exit 1
fi

echo "User ID: $USER_ID"

# 添加网站
docker exec plausible-db psql -U postgres -d plausible_db -c "
    INSERT INTO sites (domain, inserted_at, updated_at, timezone, public) 
    VALUES ('$DOMAIN', NOW(), NOW(), 'Asia/Shanghai', false)
    ON CONFLICT (domain) DO NOTHING;
"

# 获取网站 ID
SITE_ID=$(docker exec plausible-db psql -U postgres -d plausible_db -t -c "SELECT id FROM sites WHERE domain = '$DOMAIN';" | tr -d ' ')

echo "Site ID: $SITE_ID"

# 添加用户为网站所有者
docker exec plausible-db psql -U postgres -d plausible_db -c "
    INSERT INTO site_memberships (site_id, user_id, role, inserted_at, updated_at) 
    VALUES ($SITE_ID, $USER_ID, 'owner', NOW(), NOW())
    ON CONFLICT (site_id, user_id) DO NOTHING;
"

echo "Site added successfully!"
echo "Domain: $DOMAIN"
echo "Owner: $USER_EMAIL"
echo ""
echo "You can now view analytics at: http://localhost:8000/$DOMAIN"