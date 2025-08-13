# Windows Active Directory 域账号登录配置指南

## 概述

本项目已集成 Windows AD 域账号认证功能，支持企业内网环境下使用域账号直接登录系统。

## 技术架构

- **认证协议**: LDAP v3
- **会话管理**: JWT (JSON Web Token)
- **安全传输**: 支持 LDAP 和 LDAPS (LDAP over SSL)

## 配置步骤

### 1. 环境变量配置

复制 `.env.local.example` 为 `.env.local` 并配置以下参数：

```bash
# 域控制器地址
LDAP_URL=ldap://dc.company.local:389

# Base DN (根据你的域名设置)
LDAP_BASE_DN=DC=company,DC=local

# JWT 密钥 (请更改为随机字符串)
JWT_SECRET=your-secret-key-at-least-32-chars-long-change-this!!!
```

### 2. 常见配置示例

#### 标准 AD 配置

```bash
LDAP_URL=ldap://dc01.contoso.com:389
LDAP_BASE_DN=DC=contoso,DC=com
```

#### 使用 SSL/TLS 的安全连接

```bash
LDAP_URL=ldaps://dc01.contoso.com:636
LDAP_TLS_REJECT_UNAUTHORIZED=true
```

#### 多域控制器环境

```bash
# 主域控
LDAP_URL=ldap://dc01.contoso.com:389
# 备用域控可以在代码中配置故障转移
```

### 3. 测试连接

运行开发服务器并访问登录页面：

```bash
pnpm run dev
# 访问 http://localhost:3000/sign-in
```

## 功能特性

### 支持的认证方式

- ✅ 用户名密码认证
- ✅ UPN 格式 (user@domain.com)
- ✅ SAMAccountName 格式 (username)
- ✅ 自动域名识别

### 获取的用户信息

- 用户名 (sAMAccountName)
- 显示名称 (displayName)
- 邮箱地址 (mail)
- 部门 (department)
- 职位 (title)
- 所属组 (memberOf)

### 会话管理

- 默认会话时长: 8 小时
- 支持自动续期
- 安全的 httpOnly Cookie

## 故障排查

### 常见问题

#### 1. 无法连接到域控制器

```
错误: LDAP connection error
```

**解决方案**:

- 检查域控制器地址是否正确
- 确认防火墙允许 LDAP 端口 (389/636)
- 使用 `ping` 测试网络连通性

#### 2. 认证失败

```
错误: 用户名或密码错误
```

**解决方案**:

- 确认用户名格式正确
- 检查账号是否被锁定
- 验证 Base DN 配置

#### 3. LDAPS 证书问题

```
错误: self signed certificate
```

**解决方案**:

- 设置 `LDAP_TLS_REJECT_UNAUTHORIZED=false` (仅开发环境)
- 或导入企业 CA 证书

### 调试模式

在开发环境可以启用详细日志：

```javascript
// src/lib/auth/ldap.ts
console.log('LDAP Bind DN:', userDN);
console.log('Search Filter:', searchFilter);
```

## 安全建议

1. **生产环境必须使用 LDAPS**

   - 避免明文传输密码
   - 配置正确的 SSL 证书

2. **JWT 密钥管理**

   - 使用强随机密钥
   - 定期轮换密钥
   - 不要提交到版本控制

3. **访问控制**

   - 可以基于 AD 组实现权限控制
   - 限制特定组的用户访问

4. **审计日志**
   - 记录所有登录尝试
   - 监控异常登录行为

## 扩展功能

### 基于 AD 组的权限控制

```typescript
// 检查用户组
if (user.groups?.includes('CN=Admins,OU=Groups,DC=company,DC=local')) {
  // 管理员权限
}
```

### 单点登录 (SSO)

可以配合 Windows 集成认证实现免密登录：

- 配置 IIS/Nginx 的 Windows 认证
- 获取当前 Windows 用户
- 自动完成认证

## 技术支持

如有问题，请检查：

1. 域控制器服务状态
2. 网络连接和防火墙规则
3. LDAP 服务端口开放情况
4. 用户账号权限设置
