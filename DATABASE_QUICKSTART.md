# 快速数据库初始化指南

## 方法一：使用Navicat或MySQL Workbench（推荐）

### 1. 安装MySQL客户端

**选项A：Navicat for MySQL（推荐）**
- 下载：https://www.navicat.com/en/download/navicat-for-mysql
- 更易使用，支持图形化界面

**选项B：MySQL Workbench（官方）**
- 下载：https://dev.mysql.com/downloads/workbench/
- MySQL官方提供的图形化工具

### 2. 连接数据库

使用以下信息连接：

| 项目 | 值 |
|------|-----|
| 主机 | `gz-cdb-blinrztt.sql.tencentcdb.com` |
| 端口 | `20615` |
| 用户名 | `root` |
| 密码 | `shuhuiAI@mysql-cshj-0427` |

**注意**：密码中包含特殊字符 `@`，某些工具需要特殊处理。

### 3. 创建数据库

连接成功后，执行以下SQL：

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS `lifekline`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### 4. 执行表结构脚本

创建数据库后，选择 `lifekline` 数据库，然后打开 `database/schema.sql` 文件，复制所有内容并执行。

或者点击 `database/schema.sql` 文件，选择"运行SQL文件"。

### 5. 验证表创建

检查是否成功创建了以下5个表：
- ✅ users
- ✅ user_free_quota
- ✅ usage_records
- ✅ share_records
- ✅ kline_records

## 方法二：使用MySQL命令行

### 1. 安装MySQL客户端

**macOS：**
```bash
brew install mysql-client
```

**Windows：**
- 下载 MySQL Shell：https://dev.mysql.com/downloads/shell/

**Linux：**
```bash
sudo apt-get install mysql-client
```

### 2. 连接数据库

```bash
mysql -h gz-cdb-blinrztt.sql.tencentcdb.com -P 20615 -u root -p'shuhuiAI@mysql-cshj-0427'
```

**注意**：密码使用单引号包裹，`-p` 和密码之间没有空格。

### 3. 创建数据库和表

连接成功后，复制以下SQL并粘贴：

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS `lifekline`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE lifekline;

-- ========================================
-- 用户表
-- ========================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(100) PRIMARY KEY COMMENT '用户ID',
  `phone` VARCHAR(20) UNIQUE NOT NULL COMMENT '手机号',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `openid` VARCHAR(100) UNIQUE DEFAULT NULL COMMENT '微信OpenID',
  `login_type` ENUM('phone', 'wechat') NOT NULL COMMENT '登录类型',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_phone (`phone`),
  INDEX idx_openid (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ========================================
-- 免费次数表
-- ========================================
CREATE TABLE IF NOT EXISTS `user_free_quota` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID',
  `remaining_count` INT DEFAULT 0 COMMENT '剩余免费次数',
  `last_share_date` DATE DEFAULT NULL COMMENT '最后一次分享日期',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_user_id (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户免费次数表';

-- ========================================
-- 使用记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `usage_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID',
  `usage_type` ENUM('free', 'share', 'paid') NOT NULL COMMENT '使用类型',
  `usage_count` INT DEFAULT 1 COMMENT '使用次数',
  `used_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '使用时间',
  `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
  INDEX idx_user_id (`user_id`),
  INDEX idx_used_at (`used_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='使用记录表';

-- ========================================
-- 分享记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `share_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID',
  `share_date` DATE NOT NULL COMMENT '分享日期',
  `share_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分享时间',
  `share_platform` VARCHAR(50) DEFAULT NULL COMMENT '分享平台（wechat, weibo, qq等）',
  INDEX idx_user_id (`user_id`),
  INDEX idx_share_date (`share_date`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分享记录表';

-- ========================================
-- K线生成记录表（可选，用于历史记录）
-- ========================================
CREATE TABLE IF NOT EXISTS `kline_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(100) NOT NULL COMMENT '用户ID',
  `bazi_info` JSON COMMENT '八字信息',
  `analysis_result` JSON COMMENT '分析结果',
  `chart_data` JSON COMMENT 'K线数据',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_user_id (`user_id`),
  INDEX idx_created_at (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='K线生成记录表';
```

执行完成后，输入 `exit` 退出。

### 4. 验证表创建

```bash
mysql -h gz-cdb-blinrztt.sql.tencentcdb.com -P 20615 -u root -p'shuhuiAI@mysql-cshj-0427' lifekline -e "SHOW TABLES;"
```

应该看到5个表：
- users
- user_free_quota
- usage_records
- share_records
- kline_records

## 方法三：使用腾讯云控制台

### 1. 登录腾讯云控制台

访问：https://console.cloud.tencent.com/cdb

### 2. 找到您的MySQL实例

找到名为 `shujian-cshj-0427` 的实例

### 3. 进入数据库管理

- 点击"管理"或"登录"按钮
- 选择"Web Shell"或"DBeaver"工具
- 使用提供的连接信息登录

### 4. 执行SQL

在SQL编辑器中，复制上面的SQL并执行。

## 配置文件已就绪

✅ **后端配置**：`backend/.env` 已创建
✅ **数据库表结构**：`database/schema.sql` 已创建
✅ **初始化脚本**：`init-db.sh` 已创建（需要MySQL命令行工具）

## 启动服务

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 启动后端服务

```bash
npm start
```

如果启动成功，会看到：
```
✅ 后端服务运行在 http://localhost:3000
✅ 健康检查: http://localhost:3000/health
```

### 3. 测试API连接

在浏览器中访问：
```
http://localhost:3000/health
```

应该返回：
```json
{
  "status": "ok",
  "message": "后端服务正常运行"
}
```

### 4. 启动前端服务

```bash
# 返回项目根目录
cd ..

# 启动前端
npm run dev
```

访问：http://localhost:5173

## 常见连接问题

### 问题1：密码中包含特殊字符

**解决方案**：
- 在Navicat/MySQL Workbench中，密码输入框正常输入即可
- 在命令行中，使用单引号包裹：`-p'shuhuiAI@mysql-cshj-0427'`

### 问题2：连接超时

**解决方案**：
- 检查网络连接
- 检查防火墙设置
- 确认腾讯云数据库是否启动

### 问题3：权限不足

**解决方案**：
- 确认使用root用户
- 检查用户是否有CREATE DATABASE权限

## 完成检查

数据库初始化完成后，请确认：

- [ ] 数据库 `lifekline` 已创建
- [ ] 所有5个表已创建（users, user_free_quota, usage_records, share_records, kline_records）
- [ ] 表之间建立了正确的关联关系（FOREIGN KEY）
- [ ] 字符集设置为 utf8mb4
- [ ] 后端 `.env` 配置文件已创建
- [ ] 后端服务可以启动
- [ ] 健康检查接口可以访问

## 需要帮助？

如果遇到问题：

1. 检查腾讯云数据库控制台的连接信息
2. 查看后端启动日志
3. 确认网络连接正常

---

**下一步**：数据库初始化完成后，启动前后端服务即可开始使用！
