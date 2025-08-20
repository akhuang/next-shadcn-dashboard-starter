#!/bin/bash

# 重置 Plausible 用户密码

EMAIL="${1:-admin@example.com}"
NEW_PASSWORD="${2:-changeme123}"

echo "Resetting password for: $EMAIL"

# 生成新的密码哈希并更新数据库
docker exec plausible-db psql -U postgres -d plausible_db -c "
    UPDATE users 
    SET password_hash = crypt('$NEW_PASSWORD', gen_salt('bf')) 
    WHERE email = '$EMAIL';
    
    SELECT email, name, email_verified 
    FROM users 
    WHERE email = '$EMAIL';
"

echo "Password has been reset to: $NEW_PASSWORD"
echo "Please login at: http://localhost:8000/login"