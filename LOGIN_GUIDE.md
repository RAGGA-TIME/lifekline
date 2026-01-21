# 登录功能使用说明

## 功能概述

本项目已集成以下登录功能：

1. **手机号+验证码登录**（前端Mock演示模式）
2. **微信公众号H5登录**（OAuth2.0授权）
3. **选择性登录拦截**：游客可浏览，生成K线数据时才需要登录
4. **用户数据关联**：导出的数据会关联用户信息

## 登录流程说明

### 游客模式
- 用户可以直接访问网站首页
- 可以浏览页面内容
- 右上角显示"登录"按钮

### 登录触发点
只有在以下操作时才会要求登录：
- 点击"生成人生K线"按钮
- 导出包含用户信息的数据

### 登录成功后
- 自动返回首页
- 右上角显示用户昵称和退出按钮
- 可以正常使用所有功能

## 环境配置

在项目根目录创建 `.env` 文件，添加以下配置：

```env
# GLM API Key（原有配置）
VITE_GLM_API_KEY=your_glm_api_key_here
GLM_API_KEY=your_glm_api_key_here

# 微信公众号App ID（用于H5登录）
# 在微信公众平台 -> 开发 -> 基本配置中获取
VITE_WECHAT_APP_ID=your_wechat_app_id_here
```

**注意**：
- 如果不配置 `VITE_WECHAT_APP_ID`，微信登录将使用Mock模式
- 手机号验证码当前使用Mock模式，固定验证码为 `123456`

## 功能说明

### 1. 手机号登录（腾讯云短信服务）

- **验证码发送**：点击"获取验证码"按钮
- **验证码输入**：输入6位验证码（5分钟内有效）
- **倒计时限制**：60秒后可重新发送
- **腾讯云集成**：支持腾讯云国内短信服务
- **开发模式**：未配置腾讯云参数时，验证码会在控制台输出

**腾讯云短信配置**：
1. 登录腾讯云控制台（https://console.cloud.tencent.com/sms）
2. 创建短信应用，获取App ID
3. 创建短信签名（需要审核，通常1-2个工作日）
4. 创建短信模板（需要审核，模板内容：`您的验证码是{1}，5分钟内有效。`）
5. 在密钥管理中获取SecretId和SecretKey
6. 将配置信息添加到 `.env` 文件

**环境变量配置**：
```env
VITE_TENCENT_SECRET_ID=your_secret_id
VITE_TENCENT_SECRET_KEY=your_secret_key
VITE_TENCENT_SMS_APP_ID=your_sms_app_id
VITE_TENCENT_SMS_SIGN_NAME=your_signature_name
VITE_TENCENT_SMS_TEMPLATE_ID=your_template_id
```

**注意**：
- 前端直接调用腾讯云API存在CORS限制
- 生产环境建议通过后端API转发短信请求
- 开发环境可以使用Mock模式，验证码在控制台输出

### 2. 微信公众号H5登录

**生产环境配置**：
1. 在微信公众平台（https://mp.weixin.qq.com/）注册公众号
2. 获取App ID和App Secret
3. 配置网页授权域名（需要在微信公众平台设置）
4. 将App ID配置到 `.env` 文件中

**授权流程**：
1. 用户点击"微信登录"
2. 跳转到微信授权页面
3. 用户授权后返回到 `/wechat-callback`
4. 系统处理授权码并完成登录

**Mock模式**：
- 如果未配置App ID，点击微信登录会使用Mock数据直接登录
- 用于开发和演示环境

### 3. 登录拦截（生成K线时触发）

- 游客可以直接浏览网站首页
- 点击"生成人生K线"按钮时会检查登录状态
- 如果未登录，显示提示信息并跳转到登录页
- 登录成功后返回首页，可以继续生成K线
- Token保存在LocalStorage中

### 4. 用户数据关联

导出JSON时，数据会包含以下用户信息：
```json
{
  "userId": "user_xxx",
  "userName": "用户昵称",
  "bazi": [...],
  "chartPoints": [...]
  ...
}
```

## 开发和测试

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 测试登录功能

1. **游客模式测试**：
   - 直接访问首页（不登录）
   - 应该能看到页面内容
   - 右上角显示"登录"按钮

2. **生成K线时的登录拦截测试**：
   - 在未登录状态下，填写完整的出生信息
   - 点击"生成人生K线"按钮
   - 应该显示"请先登录后再生成人生K线"
   - 1秒后自动跳转到登录页

 3. **手机号登录测试**：
    **开发模式（Mock）**：
    - 输入任意11位手机号
    - 点击获取验证码
    - 查看浏览器控制台，会显示生成的验证码
    - 输入控制台显示的验证码（5分钟内有效）
    - 点击登录
    - 登录成功后应返回首页

    **生产模式（腾讯云）**：
    - 配置腾讯云短信服务参数（见上方配置说明）
    - 输入真实手机号
    - 点击获取验证码
    - 手机会收到腾讯云短信
    - 输入短信中的验证码
    - 点击登录

4. **微信登录测试（Mock模式）**：
   - 点击"微信登录"选项卡
   - 点击"微信登录"按钮
   - 系统自动使用Mock用户信息登录

5. **登录后功能测试**：
   - 右上角应显示用户昵称和退出按钮
   - 可以正常生成K线数据
   - 导出的数据包含用户信息

### 微信H5登录调试

如果要测试真实的微信H5登录：

1. 配置正确的 `VITE_WECHAT_APP_ID`
2. 使用微信内置浏览器或手机浏览器访问
3. 确保访问的域名已在微信公众平台配置

### 腾讯云短信服务配置详细说明

#### 1. 创建腾讯云短信应用
1. 登录腾讯云控制台（https://console.cloud.tencent.com/sms）
2. 点击"添加应用"，填写应用名称
3. 创建成功后，在应用列表中获取 **SMS App ID**

#### 2. 创建短信签名
1. 进入"国内短信" → "签名管理"
2. 点击"创建签名"
3. 填写签名内容（如：人生K线）
4. 提交审核（通常需要1-2个工作日）
5. 审核通过后，记录 **签名名称**

#### 3. 创建短信模板
1. 进入"国内短信" → "正文模板管理"
2. 点击"创建正文模板"
3. 填写模板内容（必须包含验证码）：
   ```
   您的验证码是{1}，5分钟内有效。
   ```
4. 选择类型为"验证码"
5. 提交审核（通常需要1-2个工作日）
6. 审核通过后，记录 **模板ID**

#### 4. 获取API密钥
1. 进入"访问管理" → "API密钥管理"
2. 创建新密钥或使用现有密钥
3. 记录 **SecretId** 和 **SecretKey**
4. **重要**：妥善保管密钥，不要泄露

#### 5. 配置环境变量
在项目根目录的 `.env` 文件中添加：

```env
VITE_TENCENT_SECRET_ID=AKIDxxxxxxxxxxxxxxxx
VITE_TENCENT_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
VITE_TENCENT_SMS_APP_ID=1400xxxxx
VITE_TENCENT_SMS_SIGN_NAME=人生K线
VITE_TENCENT_SMS_TEMPLATE_ID=123456
```

#### 6. CORS问题说明

**问题**：浏览器直接调用腾讯云API会遇到CORS跨域错误

**解决方案**：
- **开发环境**：可以使用Mock模式，验证码在控制台输出
- **生产环境**：通过后端API转发短信请求，避免CORS问题

**后端API示例（Node.js）**：
```javascript
// 后端API路由示例
app.post('/api/send-sms', async (req, res) => {
  const { phone } = req.body;
  // 调用腾讯云SDK发送短信
  const result = await sendTencentSms(phone);
  res.json(result);
});
```

#### 验证码规则
- **有效期**：5分钟
- **格式**：6位数字
- **存储**：LocalStorage（生产环境应使用Redis等）
- **重复发送**：60秒倒计时限制

## 安全注意事项

### 生产环境

1. **不要在前端暴露密钥**：
   - 短信服务API密钥应放在后端
   - 微信App Secret应放在后端

2. **Token验证**：
   - 后端需要验证token的有效性
   - 实现token刷新机制

3. **HTTPS要求**：
   - 微信OAuth2.0要求使用HTTPS
   - 确保生产环境使用SSL证书

4. **短信服务集成**：
   - 当前使用Mock模式
   - 生产环境需要对接真实的短信服务（腾讯云、阿里云等）

### 建议的后端API

```typescript
// 发送验证码
POST /api/auth/send-sms
{
  "phone": "13800138000"
}

// 手机号登录
POST /api/auth/login-phone
{
  "phone": "13800138000",
  "code": "123456"
}

// 微信登录
POST /api/auth/login-wechat
{
  "code": "oauth_code_from_wechat"
}

// 验证Token
GET /api/auth/verify
Headers: Authorization: Bearer <token>
```

## 文件说明

- `types.ts`: 用户和认证相关的类型定义
- `services/authService.ts`: 认证服务，处理登录、验证码验证等逻辑
- `services/tencentSmsService.ts`: 腾讯云短信服务，处理验证码生成和发送
- `components/Login.tsx`: 登录页面组件
- `components/WeChatCallback.tsx`: 微信授权回调处理组件
- `App.tsx`: 主应用，包含路由和登录拦截逻辑
- `.env.example`: 环境变量配置示例

## 常见问题

### Q: 如何切换Mock模式和真实模式？

**手机号验证码**：
- Mock模式：验证码固定为 `123456`
- 真实模式：需要在 `authService.ts` 中对接真实短信API

**微信登录**：
- Mock模式：不配置 `VITE_WECHAT_APP_ID` 或设置为空
- 真实模式：配置正确的 `VITE_WECHAT_APP_ID`

### Q: 登录后token有效期多久？

当前Mock模式下的token没有过期时间。生产环境应该：
1. 设置合理的过期时间（如7天）
2. 实现token刷新机制
3. 后端验证token有效性

### Q: 如何退出登录？

点击右上角用户信息旁边的退出图标即可。

### Q: 导出的数据如何保存到后端？

需要创建保存API：
```typescript
POST /api/analysis/save
Headers: Authorization: Bearer <token>
Body: {
  "chartData": [...],
  "analysis": {...}
}
```

## 下一步开发建议

1. **后端API开发**：
   - 实现真实的短信发送API
   - 实现微信OAuth2.0后端验证
   - 实现用户数据保存API

2. **用户中心**：
   - 查看历史分析记录
   - 修改个人信息
   - 数据管理

3. **权限管理**：
   - 实现基于角色的权限控制
   - VIP功能或付费功能

4. **数据安全**：
   - 加密敏感信息
   - 实现数据备份
   - 日志审计
