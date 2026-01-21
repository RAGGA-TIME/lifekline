# 手机验证码登录升级 - 腾讯云短信服务

## 更新说明

已将手机验证码登录从Mock模式升级为支持腾讯云国内短信服务。

## 主要变更

### 1. 新增文件

- **`services/tencentSmsService.ts`**
  - 腾讯云短信服务封装
  - 验证码生成和存储
  - 验证码验证逻辑
  - 支持Mock模式和生产模式

### 2. 修改文件

- **`services/authService.ts`**
  - 集成腾讯云短信服务
  - 更新验证码发送和验证逻辑
  - 移除固定验证码

- **`components/Login.tsx`**
  - 更新提示信息，提示控制台输出验证码

- **`.env.example`**
  - 添加腾讯云短信相关环境变量配置

- **`LOGIN_GUIDE.md`**
  - 更新腾讯云配置说明
  - 添加开发/生产模式说明

### 3. 新增文档

- **`TENCENT_SMS_GUIDE.md`**
  - 详细的腾讯云短信配置指南
  - 包含完整的配置步骤
  - CORS问题解决方案
  - 常见问题解答

## 功能特性

### 双模式支持

#### Mock模式（开发环境）
- 无需配置腾讯云
- 验证码在浏览器控制台输出
- 适合开发和测试

#### 生产模式（真实短信）
- 配置腾讯云参数后自动切换
- 发送真实短信验证码
- 5分钟有效期

### 验证码规则

- **格式**：6位随机数字
- **有效期**：5分钟（300000ms）
- **存储**：LocalStorage（生产环境建议使用Redis）
- **发送限制**：60秒倒计时

### 安全特性

- 验证码使用后立即删除
- 自动清理过期的验证码
- 手机号格式验证（中国大陆11位）
- 验证码错误提示

## 快速开始

### 开发模式（Mock）

1. 不配置腾讯云环境变量
2. 运行项目：`npm run dev`
3. 登录时查看浏览器控制台（F12）获取验证码

### 生产模式（真实短信）

1. 参考 `TENCENT_SMS_GUIDE.md` 配置腾讯云
2. 在 `.env` 文件中添加配置：

```env
VITE_TENCENT_SECRET_ID=AKIDxxxxxxxxxxxxxxxx
VITE_TENCENT_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
VITE_TENCENT_SMS_APP_ID=1400xxxxx
VITE_TENCENT_SMS_SIGN_NAME=人生K线
VITE_TENCENT_SMS_TEMPLATE_ID=123456
```

3. 运行项目：`npm run dev`
4. 使用真实手机号登录

## 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| VITE_TENCENT_SECRET_ID | 腾讯云SecretId | 生产模式 |
| VITE_TENCENT_SECRET_KEY | 腾讯云SecretKey | 生产模式 |
| VITE_TENCENT_SMS_APP_ID | 短信应用ID | 生产模式 |
| VITE_TENCENT_SMS_SIGN_NAME | 短信签名名称 | 生产模式 |
| VITE_TENCENT_SMS_TEMPLATE_ID | 短信模板ID | 生产模式 |

**注意**：所有环境变量都是可选的，未配置时自动使用Mock模式。

## 技术实现

### 腾讯云API调用

使用Web Crypto API实现HMAC-SHA256签名：

```typescript
async hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return this.base64Encode(signature);
}
```

### 验证码存储结构

```typescript
interface VerificationCode {
  code: string;      // 6位数字验证码
  phone: string;      // 手机号（作为key）
  expiresAt: number;  // 过期时间戳
}
```

存储在LocalStorage中，key为 `lifekline_verification_codes`。

## CORS问题

### 问题描述

浏览器直接调用腾讯云API会遇到CORS跨域错误。

### 解决方案

**开发环境**：使用Mock模式（无需后端）

**生产环境**：通过后端API转发请求

详见 `TENCENT_SMS_GUIDE.md` 的第9节。

## 成本估算

- **国内短信价格**：¥0.045/条
- **每日100个用户登录**：¥4.5/天
- **每月成本**：约¥135

腾讯云通常会赠送100条免费短信用于测试。

## 安全建议

### 密钥安全

✅ 使用环境变量存储密钥
✅ 将 `.env` 添加到 `.gitignore`
❌ 不要将密钥提交到Git
❌ 不要在前端代码中硬编码密钥

### 生产环境建议

✅ 使用后端API转发短信请求
✅ 添加请求频率限制
✅ 使用Redis存储验证码（替代LocalStorage）
✅ 记录发送日志
✅ 监控异常发送行为

## 测试建议

### 开发测试

```bash
# Mock模式
npm run dev

# 测试步骤：
# 1. 访问登录页面
# 2. 输入手机号
# 3. 点击获取验证码
# 4. 查看控制台输出的验证码
# 5. 使用验证码登录
```

### 生产测试

```bash
# 配置腾讯云环境变量
# 运行项目
npm run dev

# 测试步骤：
# 1. 使用真实手机号登录
# 2. 点击获取验证码
# 3. 等待接收短信
# 4. 输入短信验证码登录
```

## 故障排查

### 问题1：发送验证码失败

**可能原因**：
- 腾讯云参数配置错误
- 账户余额不足
- 手机号格式错误

**解决方法**：
- 检查 `.env` 配置是否正确
- 登录腾讯云控制台查看发送记录
- 查看浏览器控制台错误信息

### 问题2：验证码验证失败

**可能原因**：
- 验证码过期（5分钟）
- 验证码错误
- 手机号不匹配

**解决方法**：
- 重新获取验证码
- 确认输入的验证码正确
- 确认手机号格式正确

### 问题3：CORS错误

**错误信息**：
```
Access to XMLHttpRequest at 'https://sms.tencentcloudapi.com/'
has been blocked by CORS policy
```

**解决方法**：
- 开发环境：使用Mock模式（不配置腾讯云）
- 生产环境：通过后端API转发请求

详见 `TENCENT_SMS_GUIDE.md` 的第9节。

## 参考文档

- [腾讯云短信服务官方文档](https://cloud.tencent.com/document/product/382)
- [TENCENT_SMS_GUIDE.md](./TENCENT_SMS_GUIDE.md) - 详细配置指南
- [LOGIN_GUIDE.md](./LOGIN_GUIDE.md) - 登录功能使用说明

## 更新日志

**2026-01-21**
- ✅ 集成腾讯云国内短信服务
- ✅ 支持Mock模式和生产模式
- ✅ 添加验证码生成、存储、验证逻辑
- ✅ 更新登录页面提示信息
- ✅ 创建详细的配置指南文档

---

**注意**：生产环境中，建议将短信发送逻辑移至后端API，避免暴露密钥和CORS问题。
