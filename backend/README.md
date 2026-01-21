# 后端API服务 - 使用说明

## 概述

本后端API服务使用 Express + MySQL，为前端提供数据库访问接口。

## 技术栈

- **后端框架**: Express.js
- **数据库**: MySQL
- **数据库驱动**: mysql2 (Promise版本）
- **跨域支持**: CORS

## 安装步骤

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置数据库

确保MySQL服务已启动，并且创建了`lifekline`数据库。

#### 方式1：手动创建数据库

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS `lifekline` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE lifekline;

-- 执行schema.sql中的所有表创建语句
-- 详见 database/schema.sql
```

#### 方式2：使用命令行工具

```bash
mysql -u root -p < database/schema.sql
```

### 3. 配置环境变量

在 `backend/` 目录下创建 `.env` 文件：

```env
# MySQL配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=lifekline

# 服务器端口
PORT=3000
```

### 4. 启动服务

```bash
# 启动后端服务
npm start

# 开发模式（自动重启）
npm run dev
```

启动成功后，终端会显示：

```
✅ 后端服务运行在 http://localhost:3000
✅ 健康检查: http://localhost:3000/health

可用的API端点:
  POST   /api/users              - 创建用户
  GET    /api/users/:userId       - 获取用户
  GET    /api/users/phone/:phone - 通过手机号获取用户
  GET    /api/quota/:userId       - 获取剩余次数
  POST   /api/quota/use           - 使用免费次数
  GET    /api/quota/can-share/:userId - 检查是否可分享
  POST   /api/quota/share         - 分享获取次数
  POST   /api/usage                - 记录使用
  POST   /api/share                - 记录分享
```

## API接口文档

### 健康检查

**GET** `/health`

返回示例：
```json
{
  "status": "ok",
  "message": "后端服务正常运行"
}
```

### 用户相关API

#### 1. 创建用户

**POST** `/api/users`

**请求体：**
```json
{
  "id": "user_123456",
  "phone": "13800138000",
  "nickname": "用户8000",
  "avatar": "https://avatar.url",
  "openid": null,
  "login_type": "phone"
}
```

**返回：**
```json
{
  "success": true
}
```

#### 2. 获取用户信息

**GET** `/api/users/:userId`

**返回：**
```json
{
  "id": "user_123456",
  "phone": "13800138000",
  "nickname": "用户8000",
  "avatar": "https://avatar.url",
  "openid": null,
  "login_type": "phone",
  "created_at": "2026-01-21T00:00:00.000Z",
  "updated_at": "2026-01-21T00:00:00.000Z"
}
```

#### 3. 通过手机号获取用户

**GET** `/api/users/phone/:phone`

**参数**: `phone` - 手机号（11位数字）

**返回：** 同获取用户信息

### 免费次数相关API

#### 1. 获取剩余免费次数

**GET** `/api/quota/:userId`

**返回：**
```json
{
  "remaining": 1
}
```

#### 2. 使用免费次数

**POST** `/api/quota/use`

**请求体：**
```json
{
  "userId": "user_123456"
}
```

**成功返回：**
```json
{
  "success": true,
  "message": "使用成功"
}
```

**失败返回：**
```json
{
  "success": false,
  "message": "剩余次数不足"
}
```

#### 3. 检查是否可以分享

**GET** `/api/quota/can-share/:userId`

**返回：**
```json
{
  "canShare": true
}
```

#### 4. 分享获取免费次数

**POST** `/api/quota/share`

**请求体：**
```json
{
  "userId": "user_123456",
  "platform": "wechat"
}
```

**成功返回：**
```json
{
  "success": true,
  "message": "分享成功！已获得1次免费次数"
}
```

**失败返回：**
```json
{
  "success": false,
  "message": "今日已分享过，明天再来吧"
}
```

#### 5. 获取今日分享状态

**GET** `/api/quota/share-status/:userId`

**返回：**
```json
{
  "canShare": true,
  "lastShareDate": null
}
```

### 记录相关API

#### 1. 记录使用

**POST** `/api/usage`

**请求体：**
```json
{
  "userId": "user_123456",
  "usageType": "free",
  "count": 1,
  "remark": "生成K线消耗1次免费次数"
}
```

**返回：**
```json
{
  "success": true
}
```

#### 2. 记录分享

**POST** `/api/share`

**请求体：**
```json
{
  "userId": "user_123456",
  "shareDate": "2026-01-21",
  "platform": "wechat"
}
```

**返回：**
```json
{
  "success": true
}
```

## 数据库表结构

详见 `../database/schema.sql`

### 主要表：

1. **users** - 用户表
2. **user_free_quota** - 免费次数表
3. **usage_records** - 使用记录表
4. **share_records** - 分享记录表
5. **kline_records** - K线生成记录表（可选）

## 前端配置

### 1. 配置API地址

在前端项目的 `.env` 文件中：

```env
# 后端API地址
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2. 使用API

前端会通过 `services/apiService.ts` 自动调用后端API。

代码示例：

```typescript
import { apiService } from './services/apiService';

// 获取剩余次数
const remaining = await apiService.getRemainingQuota(userId);

// 使用免费次数
const success = await apiService.useFreeQuota(userId);

// 分享获取次数
const shared = await apiService.shareForQuota(userId, 'wechat');
```

## 部署到生产环境

### 方案1：Vercel部署

```bash
cd backend

# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 部署
vercel
```

### 方案2：传统服务器部署

```bash
# 使用PM2守护进程
npm install -g pm2

# 启动服务
pm2 start server.js --name lifekline-backend

# 查看日志
pm2 logs lifekline-backend

# 设置开机自启
pm2 startup
```

### 方案3：Docker部署

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

构建并运行：

```bash
docker build -t lifekline-backend .
docker run -p 3000:3000 -e MYSQL_HOST=host.docker.internal lifekline-backend
```

## 故障排查

### 问题1：无法连接MySQL

**错误信息：**
```
Error: connect ECONNREFUSED
```

**解决方案：**
1. 检查MySQL服务是否启动
2. 检查 `.env` 中的数据库配置是否正确
3. 检查防火墙设置

### 问题2：端口被占用

**错误信息：**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案：**
1. 查找占用端口的进程：`lsof -i :3000`
2. 杀死进程或更改端口

### 问题3：数据库表不存在

**错误信息：**
```
Error: Table 'lifekline.users' doesn't exist
```

**解决方案：**
1. 执行 `database/schema.sql` 创建表
2. 确认数据库名称正确

### 问题4：CORS错误

**问题：** 前端无法访问后端API

**解决方案：**
- 后端已配置CORS中间件
- 检查前端请求的地址是否正确
- 检查后端是否正确启动

## 测试

### 使用Postman测试

1. 导入API端点到Postman
2. 测试各个接口
3. 查看数据库中的数据是否正确

### 使用curl测试

```bash
# 健康检查
curl http://localhost:3000/health

# 创建用户
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_user_1",
    "phone": "13800138000",
    "nickname": "测试用户",
    "login_type": "phone"
  }'

# 获取剩余次数
curl http://localhost:3000/api/quota/test_user_1

# 使用免费次数
curl -X POST http://localhost:3000/api/quota/use \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_1"}'
```

## 监控和日志

### 查看日志

```bash
# 如果使用PM2
pm2 logs lifekline-backend

# 直接启动
# 日志会输出到终端
```

### 日志级别

所有错误都会输出到控制台，包含：
- 错误信息
- 请求参数
- SQL错误

## 安全建议

### 1. 数据库安全

- ✅ 不要使用root用户连接生产数据库
- ✅ 创建专用的数据库用户，只授予必要权限
- ✅ 使用强密码
- ❌ 不要将数据库密码提交到Git

### 2. API安全

- ✅ 生产环境使用HTTPS
- ✅ 配置CORS白名单
- ✅ 添加API速率限制
- ✅ 实现用户认证中间件
- ❌ 不要暴露数据库结构信息

### 3. 环境变量

- ✅ 使用 `.env` 文件存储敏感信息
- ✅ 将 `.env` 添加到 `.gitignore`
- ✅ 生产环境使用环境变量或密钥管理服务
- ❌ 不要在代码中硬编码密码或密钥

## 开发工具

### 推荐工具

- **API测试**: Postman, Insomnia
- **数据库管理**: MySQL Workbench, phpMyAdmin, DBeaver
- **监控**: PM2, Docker
- **日志分析**: Winston, Morgan

## 扩展功能建议

### 1. 用户认证中间件

```javascript
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token || !isValidToken(token)) {
    return res.status(401).json({ error: '未授权' });
  }
  
  req.user = decodeToken(token);
  next();
};

app.use('/api/protected', authenticate, routes);
```

### 2. API速率限制

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 最多100次请求
});

app.use('/api/', limiter);
```

### 3. 日志记录

```javascript
const morgan = require('morgan');
const fs = require('fs');

const accessLogStream = fs.createWriteStream(__dirname + '/access.log', { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));
```

## 文件说明

- `server.js` - 主服务器文件
- `package.json` - 依赖配置
- `database/schema.sql` - 数据库表结构（在父目录）

## 支持

如有问题，请查看：
- 前端文档：`../USER_QUOTA_GUIDE.md`
- 数据库文档：`../TENCENT_SMS_GUIDE.md`
- 腾讯云文档：https://cloud.tencent.com/document/product/382

---

**最后更新**: 2026-01-21
