# 华为域账号登录配置指南

## 快速配置

### 1. 复制环境配置文件

```bash
# 使用预配置的华为域配置
cp .env.huawei .env.local
```

### 2. 更新域控制器地址

编辑 `.env.local` 文件，更新实际的域控制器地址：

```bash
# 华为域配置
LDAP_URL=ldap://dc.china.huawei.com:389  # 替换为实际的域控制器地址
LDAP_BASE_DN=DC=china,DC=huawei,DC=com
LDAP_BIND_DN=                             # 留空，使用用户自绑定模式
LDAP_BIND_PASSWORD=                       # 留空
```

### 3. 测试连接

```bash
# 安装依赖
pnpm install

# 运行测试脚本
node scripts/test-huawei-ldap.js
```

## 配置说明

### 基础配置

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `AUTH_MODE` | 认证模式 | `production` (启用AD认证) |
| `LDAP_URL` | 域控制器地址 | `ldap://dc.china.huawei.com:389` |
| `LDAP_BASE_DN` | 基础 DN | `DC=china,DC=huawei,DC=com` |
| `LDAP_BIND_DN` | 绑定 DN | 留空（用户自绑定） |
| `JWT_SECRET` | JWT 密钥 | 32位以上随机字符串 |

### 支持的认证格式

系统会自动尝试以下格式进行认证：

1. **UPN 格式**: `username@china.huawei.com`
2. **DN 格式**: `CN=username,DC=china,DC=huawei,DC=com`
3. **简单用户名**: `username`

### 安全连接 (LDAPS)

如果需要使用加密连接：

```bash
# 使用 LDAPS（636端口）
LDAP_URL=ldaps://dc.china.huawei.com:636

# 如果使用自签名证书
LDAP_TLS_REJECT_UNAUTHORIZED=false
```

## 用户登录流程

1. 用户访问 `/dashboard` 
2. 系统检测到未登录，重定向到 `/sign-in`
3. 用户输入域账号和密码
4. 系统使用 LDAP 验证用户身份
5. 验证成功后，生成 JWT Token
6. 用户被重定向回 `/dashboard`

## 故障排查

### 1. 连接失败

```bash
# 检查网络连通性
ping dc.china.huawei.com

# 检查端口是否开放
telnet dc.china.huawei.com 389

# 使用 ldapsearch 测试（Linux/Mac）
ldapsearch -x -H ldap://dc.china.huawei.com -b "DC=china,DC=huawei,DC=com" -s base
```

### 2. 认证失败

- 确认用户名格式正确
- 检查密码是否正确
- 确认用户账号未被锁定
- 查看服务器日志：`pnpm run dev`

### 3. 调试模式

在 `.env.local` 中启用调试：

```bash
LDAP_DEBUG=true
```

这将在控制台输出详细的 LDAP 操作日志。

## 高级配置

### 限制特定用户组

如果只允许特定组的用户登录：

```bash
# 只允许 AppUsers 组的成员登录
LDAP_SEARCH_FILTER=(&(|(sAMAccountName={{username}})(uid={{username}}))(memberOf=CN=AppUsers,OU=Groups,DC=china,DC=huawei,DC=com))
```

### 使用服务账号

如果需要使用服务账号进行初始绑定：

```bash
LDAP_BIND_DN=CN=ldap-service,OU=ServiceAccounts,DC=china,DC=huawei,DC=com
LDAP_BIND_PASSWORD=service-account-password
```

## 生产部署检查清单

- [ ] 使用 LDAPS 加密连接
- [ ] 设置强随机 JWT 密钥
- [ ] 关闭调试模式 (`LDAP_DEBUG=false`)
- [ ] 配置访问日志
- [ ] 设置会话超时策略
- [ ] 实施账号锁定策略
- [ ] 配置 SSL 证书验证

## 相关文档

- [Active Directory 认证文档](./AD_AUTH_SETUP.md)
- [Docker 部署指南](./DOCKER_DEPLOYMENT.md)
- [环境变量配置](./../env.example.txt)