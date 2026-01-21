# 用户使用次数和分享功能实现说明

## 功能概述

已实现以下功能：

1. **用户免费次数**：登录后赠送1次免费生成K线次数
2. **分享获取次数**：每天分享一次可获得1次免费次数
3. **后端API访问数据库**：通过HTTP请求访问MySQL数据库
4. **LocalStorage后备**：API失败时使用LocalStorage存储

## 重要说明

### ✅ 新架构（推荐）

- **前端**：通过HTTP请求调用后端API
- **后端**：Node.js + Express + MySQL
- **安全性**：数据库连接信息在后端，不暴露给前端
- **持久化**：数据存储在MySQL数据库

### 架构说明

```
前端 (React + Vite)
    ↓ HTTP请求
后端 (Node.js + Express)
    ↓ MySQL连接
数据库 (MySQL)
```

## 数据库表结构

### 1. 用户表 (users)
```sql
CREATE TABLE `users` (
  `id` VARCHAR(100) PRIMARY KEY,
  `phone` VARCHAR(20) UNIQUE NOT NULL,
  `nickname` VARCHAR(50) DEFAULT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `openid` VARCHAR(100) UNIQUE DEFAULT NULL,
  `login_type` ENUM('phone', 'wechat') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. 免费次数表 (user_free_quota)
```sql
CREATE TABLE `user_free_quota` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(100) NOT NULL,
  `remaining_count` INT DEFAULT 0,
  `last_share_date` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

### 3. 使用记录表 (usage_records)
```sql
CREATE TABLE `usage_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(100) NOT NULL,
  `usage_type` ENUM('free', 'share', 'paid') NOT NULL,
  `usage_count` INT DEFAULT 1,
  `used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `remark` VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

### 4. 分享记录表 (share_records)
```sql
CREATE TABLE `share_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(100) NOT NULL,
  `share_date` DATE NOT NULL,
  `share_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `share_platform` VARCHAR(50) DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

## 后端API设置

### 1. 创建数据库

```bash
# 连接MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE IF NOT EXISTS `lifekline` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

# 使用数据库
USE lifekline;

# 执行schema.sql
source /path/to/database/schema.sql;

# 退出
exit;
```

### 2. 安装后端依赖

```bash
cd backend
npm install
```

### 3. 配置后端环境变量

在 `backend/` 目录下创建 `.env` 文件：

```env
# MySQL配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=lifekline

# 服务器端口
PORT=3000
```

### 4. 启动后端服务

```bash
cd backend

# 启动服务
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

## 前端配置

### 1. 配置API地址

在前端项目的 `.env` 文件中：

```env
# 后端API地址
VITE_API_BASE_URL=http://localhost:3000/api

# 其他配置...
VITE_GLM_API_KEY=your_glm_api_key_here
VITE_WECHAT_APP_ID=your_wechat_app_id_here
# ...
```

### 2. API服务

前端通过 `services/apiService.ts` 调用后端API：

```typescript
import { apiService } from './services/apiService';

// 获取剩余次数
const remaining = await apiService.getRemainingQuota(userId);

// 使用免费次数
const success = await apiService.useFreeQuota(userId);

// 分享获取次数
const shared = await apiService.shareForQuota(userId, 'wechat');
```

### 3. 数据库服务

`services/databaseService.ts` 提供：

```typescript
import { databaseService } from './services/databaseService';

// 获取剩余次数
const remaining = await databaseService.getRemainingQuota(userId);

// 使用免费次数
const success = await databaseService.useFreeQuota(userId);

// 分享获取次数
const success = await databaseService.shareForQuota(userId, 'wechat');

// 获取用户信息
const user = await databaseService.getUserById(userId);
```

## 使用方式

### 1. 用户登录

1. 用户通过手机号或微信登录
2. 创建用户记录（如果不存在）
3. 初始化免费次数为1
4. 返回用户信息和token

**流程：**
```
用户登录 → authService.loginWithPhone()
           ↓
           databaseService.getUserByPhone()
           ↓
           apiService.getUserByPhone()
           ↓
           apiService.createUser() (新用户）
           ↓
           后端创建用户并初始化免费次数
```

### 2. 生成K线

1. 用户填写出生信息
2. 点击"生成人生K线"
3. 检查登录状态
4. 检查免费次数（剩余>0）
5. 扣减免费次数
6. 生成K线数据

**流程：**
```
用户点击生成 → ConfirmDataMode.handleGenerate()
                ↓
                检查登录
                ↓
                databaseService.useFreeQuota(userId)
                ↓
                apiService.useFreeQuota(userId)
                ↓
                后端扣减次数并记录
                ↓
                生成K线
```

### 3. 分享获取次数

1. 用户点击"分享"按钮
2. 打开分享弹窗
3. 点击任意分享按钮（微信/微博/QQ等）
4. 记录分享行为
5. 增加免费次数（每日限1次）
6. 显示成功消息

**流程：**
```
用户点击分享 → ShareModal
                ↓
                用户选择平台
                ↓
                databaseService.shareForQuota(userId, platform)
                ↓
                apiService.shareForQuota(userId, platform)
                ↓
                后端增加次数并记录
                ↓
                显示成功消息
```

## API接口文档

### 健康检查

**GET** `/health`

```bash
curl http://localhost:3000/health
```

**返回：**
```json
{
  "status": "ok",
  "message": "后端服务正常运行"
}
```

### 用户相关

#### 创建用户

**POST** `/api/users`

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

#### 获取用户

**GET** `/api/users/:userId`

#### 通过手机号获取用户

**GET** `/api/users/phone/:phone`

### 免费次数相关

#### 获取剩余次数

**GET** `/api/quota/:userId`

**返回：**
```json
{
  "remaining": 1
}
```

#### 使用免费次数

**POST** `/api/quota/use`

```json
{
  "userId": "user_123456"
}
```

#### 检查是否可分享

**GET** `/api/quota/can-share/:userId`

**返回：**
```json
{
  "canShare": true
}
```

#### 分享获取次数

**POST** `/api/quota/share`

```json
{
  "userId": "user_123456",
  "platform": "wechat"
}
```

#### 获取今日分享状态

**GET** `/api/quota/share-status/:userId`

**返回：**
```json
{
  "canShare": true,
  "lastShareDate": null
}
```

### 记录相关

#### 记录使用

**POST** `/api/usage`

```json
{
  "userId": "user_123456",
  "usageType": "free",
  "count": 1,
  "remark": "生成K线消耗1次免费次数"
}
```

#### 记录分享

**POST** `/api/share`

```json
{
  "userId": "user_123456",
  "shareDate": "2026-01-21T00:00:00.000Z",
  "platform": "wechat"
}
```

## 测试

### 1. 测试后端API

```bash
# 1. 启动后端
cd backend
npm start

# 2. 测试健康检查
curl http://localhost:3000/health

# 3. 测试创建用户
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_user_1",
    "phone": "13800138000",
    "nickname": "测试用户",
    "login_type": "phone"
  }'

# 4. 测试获取剩余次数
curl http://localhost:3000/api/quota/test_user_1

# 5. 测试分享获取次数
curl -X POST http://localhost:3000/api/quota/share \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user_1", "platform": "wechat"}'
```

### 2. 测试前端

```bash
# 1. 启动后端
cd backend
npm start

# 2. 启动前端（另一个终端）
cd ..
npm run dev

# 3. 访问 http://localhost:5173
# 4. 登录用户
# 5. 查看剩余次数
# 6. 生成K线（消耗次数）
# 7. 分享获取次数
```

## 部署

### 开发环境

```bash
# 后端
cd backend
npm install
npm start  # 运行在 http://localhost:3000

# 前端
npm install
npm run dev  # 运行在 http://localhost:5173
```

### 生产环境

#### 后端部署（Vercel）

```bash
cd backend
npm install -g vercel
vercel login
vercel
```

#### 后端部署（传统服务器）

```bash
# 使用PM2守护进程
npm install -g pm2
pm2 start server.js --name lifekline-backend
pm2 startup  # 开机自启
pm2 logs lifekline-backend
```

#### 后端部署（Docker）

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
```

```bash
# 构建镜像
docker build -t lifekline-backend .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e MYSQL_HOST=your_mysql_host \
  -e MYSQL_USER=your_mysql_user \
  -e MYSQL_PASSWORD=your_mysql_password \
  -e MYSQL_DATABASE=lifekline \
  lifekline-backend
```

#### 前端部署

```bash
# 修改 .env 配置
VITE_API_BASE_URL=https://your-backend-api.com/api

# 构建前端
npm run build

# 部署到 Vercel
vercel
```

## 常见问题

### Q1: 前端无法连接后端？

**检查项：**
1. 后端服务是否启动？访问 http://localhost:3000/health
2. 前端 `VITE_API_BASE_URL` 是否正确？
3. 是否有CORS问题？后端已配置CORS中间件
4. 防火墙是否阻止？

### Q2: MySQL连接失败？

**错误信息：**
```
Error: connect ECONNREFUSED
```

**解决方案：**
1. 检查MySQL服务是否启动
2. 检查 `.env` 中的数据库配置
3. 检查数据库用户名和密码
4. 检查数据库名称是否正确

### Q3: API请求失败？

**错误信息：**
```
API请求失败: 404
```

**解决方案：**
1. 检查API端点是否正确
2. 检查后端路由是否正确注册
3. 查看后端日志

### Q4: 数据不一致？

**问题：** 前端显示的次数与数据库不一致

**解决方案：**
1. 刷新页面重新获取数据
2. 检查LocalStorage缓存
3. 检查后端API返回数据

## 安全建议

### 1. 数据库安全

- ✅ 创建专用的数据库用户（不使用root）
- ✅ 使用强密码
- ✅ 限制远程访问IP
- ✅ 定期备份数据

### 2. API安全

- ✅ 生产环境使用HTTPS
- ✅ 实现API速率限制
- ✅ 添加用户认证中间件
- ✅ 输入参数验证
- ✅ 记录API访问日志

### 3. 环境变量

- ✅ 使用 `.env` 文件存储敏感信息
- ✅ 将 `.env` 添加到 `.gitignore`
- ✅ 生产环境使用环境变量
- ❌ 不要在代码中硬编码密码

## 文件说明

### 新增文件

**前端：**
- `services/apiService.ts` - API服务（HTTP请求）
- `services/databaseService.ts` - 数据库服务（LocalStorage后备）
- `components/ShareModal.tsx` - 分享弹窗组件

**后端：**
- `backend/server.js` - Express服务器
- `backend/package.json` - 后端依赖配置
- `backend/README.md` - 后端使用文档

**文档：**
- `database/schema.sql` - 数据库表结构
- `USER_QUOTA_GUIDE.md` - 本文档

### 修改文件

**前端：**
- `services/authService.ts` - 集成数据库服务
- `components/ConfirmDataMode.tsx` - 生成前检查和使用次数
- `App.tsx` - 显示剩余次数和分享按钮
- `.env.example` - 添加API配置示例

## 架构优势

### 相比直接连接MySQL

1. **更安全**：数据库连接信息在后端，前端无法访问
2. **更灵活**：后端可以添加业务逻辑、验证、限流等
3. **更稳定**：使用连接池，性能更好
4. **更易扩展**：可以添加缓存、队列等功能

### LocalStorage后备

1. **容错性**：API失败时使用LocalStorage，不影响用户体验
2. **离线支持**：可以在没有网络时基本使用
3. **快速开发**：开发阶段可以不启动后端

## 下一步建议

1. **添加用户认证中间件**
   - JWT token验证
   - API请求签名
   - 会话管理

2. **添加API速率限制**
   - 防止恶意请求
   - 保护数据库

3. **添加缓存机制**
   - Redis缓存热门数据
   - 减少数据库压力

4. **添加付费功能**
   - 购买使用次数
   - VIP会员系统

5. **添加监控**
   - API响应时间
   - 错误率统计
   - 用户行为分析

## 参考文档

- [Express.js官方文档](https://expressjs.com/)
- [MySQL2文档](https://github.com/sidorares/node-mysql2)
- [Node.js最佳实践](https://nodejs.org/en/docs/guides)

---

**最后更新**: 2026-01-21
