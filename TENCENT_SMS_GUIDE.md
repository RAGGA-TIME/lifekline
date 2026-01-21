# 腾讯云短信服务配置指南

本文档详细说明如何配置腾讯云国内短信服务，用于手机号验证码登录功能。

## 目录

1. [腾讯云账号准备](#1-腾讯云账号准备)
2. [创建短信应用](#2-创建短信应用)
3. [创建短信签名](#3-创建短信签名)
4. [创建短信模板](#4-创建短信模板)
5. [获取API密钥](#5-获取api密钥)
6. [配置环境变量](#6-配置环境变量)
7. [测试短信功能](#7-测试短信功能)
8. [常见问题](#8-常见问题)
9. [CORS问题解决方案](#9-cors问题解决方案)

---

## 1. 腾讯云账号准备

### 1.1 注册/登录腾讯云

访问腾讯云官网：https://cloud.tencent.com/

- 如果没有账号，需要注册（需要手机号验证）
- 如果已有账号，直接登录

### 1.2 开通短信服务

1. 登录后进入控制台
2. 搜索"短信"或访问：https://console.cloud.tencent.com/sms
3. 如果是首次使用，需要：
   - 进行实名认证
   - 充值账户（至少10元用于测试）
   - 同意服务协议

---

## 2. 创建短信应用

### 2.1 添加应用

1. 在短信控制台，点击"国内短信" → "应用管理"
2. 点击"添加应用"按钮
3. 填写应用信息：
   - **应用名称**：人生K线（或您喜欢的名称）
   - **应用描述**：人生K线命理分析平台的短信验证码服务

### 2.2 获取App ID

应用创建成功后，在应用列表中可以看到：
- **SMS App ID**（格式：1400xxxxx）
- 请记录这个ID，配置时需要使用

---

## 3. 创建短信签名

### 3.1 什么是短信签名

短信签名是短信内容的标识，显示在短信开头，例如：
> 【人生K线】您的验证码是123456，5分钟内有效。

其中"【人生K线】"就是短信签名。

### 3.2 创建签名

1. 进入"国内短信" → "签名管理"
2. 点击"创建签名"按钮
3. 填写签名信息：
   - **签名用途**：验证码
   - **签名名称**：人生K线
   - **证明材料**：上传营业执照或授权书
   - **备注**：人生K线命理分析平台验证码服务

### 3.3 提交审核

- 提交后需要等待审核（通常1-2个工作日）
- 审核通过后，状态会变为"已通过"
- 记录 **签名名称**（例如：人生K线）

### 3.4 签名审核要求

- 签名名称必须是已备案的网站、应用名称或公司名称
- 需要提供相应的证明材料
- 签名长度2-12个字符

---

## 4. 创建短信模板

### 4.1 创建模板

1. 进入"国内短信" → "正文模板管理"
2. 点击"创建正文模板"按钮
3. 填写模板信息：
   - **模板名称**：验证码模板
   - **模板类型**：验证码
   - **模板内容**：
     ```
     您的验证码是{1}，5分钟内有效。
     ```
   - **应用场景**：用户注册/登录验证
   - **备注**：用户登录时发送的验证码

### 4.2 模板变量说明

- `{1}`：占位符，发送时会替换为验证码
- 可以使用多个占位符：{1}, {2}, {3}...
- 验证码模板只能使用一个变量

### 4.3 提交审核

- 提交后需要等待审核（通常1-2个工作日）
- 审核通过后，状态会变为"已通过"
- 记录 **模板ID**（格式：数字ID，例如：123456）

---

## 5. 获取API密钥

### 5.1 创建密钥

1. 进入腾讯云控制台
2. 点击右上角账号 → "访问管理" → "API密钥管理"
3. 或直接访问：https://console.cloud.tencent.com/cam/capi
4. 点击"创建密钥"按钮

### 5.2 获取密钥信息

创建成功后，会显示两个密钥：
- **SecretId**：例如：AKIDxxxxxxxxxxxxxxxx
- **SecretKey**：例如：xxxxxxxxxxxxxxxxxxxxxxxx

**重要**：
- SecretKey只在创建时显示一次，请立即保存
- 建议下载密钥文件备份

### 5.3 安全建议

- 不要将密钥提交到Git仓库
- 不要在前端直接暴露密钥（存在安全风险）
- 生产环境建议通过后端API转发请求

---

## 6. 配置环境变量

### 6.1 创建.env文件

在项目根目录创建 `.env` 文件（如果不存在）

### 6.2 添加配置

```env
# 腾讯云短信配置
VITE_TENCENT_SECRET_ID=AKIDxxxxxxxxxxxxxxxx
VITE_TENCENT_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
VITE_TENCENT_SMS_APP_ID=1400xxxxx
VITE_TENCENT_SMS_SIGN_NAME=人生K线
VITE_TENCENT_SMS_TEMPLATE_ID=123456
```

### 6.3 配置说明

| 配置项 | 说明 | 示例 |
|--------|------|------|
| VITE_TENCENT_SECRET_ID | 腾讯云API密钥ID | AKIDxxxxxxxxxxxxxxxx |
| VITE_TENCENT_SECRET_KEY | 腾讯云API密钥Key | xxxxxxxxxxxxxxxxxxxxxxxx |
| VITE_TENCENT_SMS_APP_ID | 短信应用ID | 1400xxxxx |
| VITE_TENCENT_SMS_SIGN_NAME | 短信签名名称 | 人生K线 |
| VITE_TENCENT_SMS_TEMPLATE_ID | 短信模板ID | 123456 |

### 6.4 重新启动项目

```bash
# 停止当前开发服务器（Ctrl+C）
# 重新启动
npm run dev
```

---

## 7. 测试短信功能

### 7.1 开发模式测试（Mock）

**未配置腾讯云参数时**：

1. 运行项目：`npm run dev`
2. 访问登录页面
3. 输入手机号，点击"获取验证码"
4. 打开浏览器控制台（F12）
5. 查看控制台输出的验证码：
   ```
   [SMS Sent] 验证码已发送到 13800138000: 123456
   ```
6. 使用控制台显示的验证码登录

### 7.2 生产模式测试（真实短信）

**配置腾讯云参数后**：

1. 配置所有腾讯云环境变量（见第6步）
2. 运行项目：`npm run dev`
3. 访问登录页面
4. 输入真实手机号，点击"获取验证码"
5. 等待手机接收短信（通常3-10秒）
6. 输入短信中的验证码登录

### 7.3 检查短信发送状态

如果短信未收到，可以在腾讯云控制台查看：
1. 进入"国内短信" → "发送记录"
2. 查看发送状态和错误信息

---

## 8. 常见问题

### Q1: 短信签名审核失败

**可能原因**：
- 签名名称与证明材料不符
- 签名包含违禁词
- 证明材料不完整或模糊

**解决方案**：
- 确保证明材料与签名名称一致
- 使用清晰的扫描件或照片
- 联系腾讯云客服咨询具体原因

### Q2: 短信模板审核失败

**可能原因**：
- 模板内容包含违禁词
- 模板格式不规范
- 未提供完整的应用场景

**解决方案**：
- 检查模板内容，避免使用营销词汇
- 使用标准的验证码格式
- 详细填写应用场景说明

### Q3: 收不到验证码

**可能原因**：
- 账户余额不足
- 手机号输入错误
- 手机号在黑名单中
- 网络问题

**解决方案**：
- 检查账户余额，确保有足够短信配额
- 确认手机号格式正确（11位数字）
- 查看腾讯云控制台的发送记录
- 等待几分钟后重试

### Q4: 验证码过期

**原因**：验证码有效期为5分钟

**解决方案**：
- 收到验证码后尽快输入
- 如果过期，重新获取新的验证码

### Q5: 频繁获取验证码限制

**限制**：每个手机号60秒内只能发送一次

**解决方案**：
- 等待60秒后重新获取
- 系统会显示倒计时

---

## 9. CORS问题解决方案

### 9.1 问题描述

**问题**：浏览器直接调用腾讯云API会遇到CORS跨域错误

**错误信息**：
```
Access to XMLHttpRequest at 'https://sms.tencentcloudapi.com/'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

### 9.2 为什么会有CORS问题

- 浏览器安全策略禁止跨域请求
- 腾讯云API服务器未配置CORS头
- 前端直接调用API会失败

### 9.3 解决方案

#### 方案一：使用开发模式（推荐开发环境）

**优点**：
- 简单快速，无需后端
- 适合开发测试

**缺点**：
- 验证码在控制台显示，不发送真实短信
- 不能用于生产环境

**实现**：
- 不配置腾讯云环境变量
- 系统自动进入Mock模式
- 验证码在浏览器控制台输出

#### 方案二：通过后端API转发（推荐生产环境）

**优点**：
- 解决CORS问题
- 安全性更好（密钥不暴露给前端）
- 可以添加限流、日志等功能

**缺点**：
- 需要搭建后端服务
- 增加开发和维护成本

**实现示例（Node.js + Express）**：

```javascript
// backend/server.js
const express = require('express');
const tencentcloud = require('tencentcloud-sdk-nodejs');

const SmsClient = tencentcloud.sms.v20210111.Client;

const app = express();
app.use(express.json());

// 初始化腾讯云客户端
const client = new SmsClient({
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: "ap-guangzhou",
});

// 发送验证码API
app.post('/api/send-sms', async (req, res) => {
  try {
    const { phone, code } = req.body;

    const params = {
      PhoneNumberSet: [`+86${phone}`],
      SmsSdkAppId: process.env.TENCENT_SMS_APP_ID,
      SignName: process.env.TENCENT_SMS_SIGN_NAME,
      TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID,
      TemplateParamSet: [code],
    };

    const result = await client.SendSms(params);

    res.json({
      success: true,
      message: '验证码已发送',
    });
  } catch (error) {
    console.error('发送短信失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '发送验证码失败',
    });
  }
});

app.listen(3000, () => {
  console.log('后端服务运行在 http://localhost:3000');
});
```

**前端调用后端API**：

```typescript
// 修改 tencentSmsService.ts
async sendSms(phone: string): Promise<{ success: boolean; message: string }> {
  const code = this.generateCode();

  try {
    const response = await fetch('http://localhost:3000/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, code }),
    });

    const result = await response.json();

    if (result.success) {
      this.generateAndStoreCode(phone, code);
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '发送验证码失败',
    };
  }
}
```

#### 方案三：使用代理服务器（临时方案）

使用开发代理转发请求到腾讯云：

```javascript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api/sms': {
        target: 'https://sms.tencentcloudapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sms/, ''),
      },
    },
  },
});
```

**注意**：这仍然不能完全解决CORS问题，因为腾讯云API未配置CORS头。

---

## 10. 成本说明

### 10.1 腾讯云短信价格

- **国内短信**：¥0.045/条
- **测试期间**：腾讯云会赠送免费额度（通常是100条）

### 10.2 估算成本

假设每天100个用户登录，每天需要发送100条验证码：
- 每天成本：100 × ¥0.045 = ¥4.5
- 每月成本（30天）：¥135

### 10.3 优化建议

- 合理设置验证码有效期（5分钟）
- 避免重复发送（60秒限制）
- 记录发送失败的手机号，避免重复请求

---

## 11. 安全建议

### 11.1 密钥安全

- ✅ 使用环境变量存储密钥
- ✅ 将 `.env` 添加到 `.gitignore`
- ❌ 不要将密钥提交到Git
- ❌ 不要在前端代码中硬编码密钥

### 11.2 验证码安全

- ✅ 设置合理的过期时间（5分钟）
- ✅ 验证后立即删除验证码
- ✅ 限制每个手机号的发送频率
- ❌ 不要使用简单的验证码（如000000）

### 11.3 生产环境

- ✅ 使用后端API转发短信请求
- ✅ 添加请求频率限制
- ✅ 记录发送日志
- ✅ 监控异常发送行为

---

## 12. 参考文档

- [腾讯云短信官方文档](https://cloud.tencent.com/document/product/382)
- [腾讯云API文档](https://cloud.tencent.com/document/api/382/55981)
- [腾讯云SDK文档](https://cloud.tencent.com/document/sdk/Nodejs)

---

## 13. 联系支持

如果遇到问题：

1. 查看腾讯云控制台的发送记录和错误信息
2. 查阅腾讯云官方文档
3. 联系腾讯云技术支持
4. 提交工单咨询

---

**最后更新**：2026-01-21
