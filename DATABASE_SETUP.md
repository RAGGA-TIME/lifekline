# 数据库初始化指南

## 数据库配置信息

您的腾讯云MySQL数据库配置已配置到 `backend/.env`：

```env
MYSQL_HOST=gz-cdb-blinrztt.sql.tencentcdb.com
MYSQL_PORT=20615
MYSQL_USER=root
MYSQL_PASSWORD=shuhuiAI@mysql-cshj-0427
MYSQL_DATABASE=lifekline
```

## 初始化步骤

### 方式一：使用初始化脚本（推荐）

```bash
# 进入项目根目录
cd /Users/edy/code/lifekline

# 执行初始化脚本
./init-db.sh
```

脚本会自动：
1. 检查数据库是否存在
2. 创建数据库（如果不存在）
3. 创建所有数据表
4. 验证表结构

### 方式二：使用MySQL命令行

```bash
# 连接腾讯云MySQL
mysql -h gz-cdb-blinrztt.sql.tencentcdb.com -P 20615 -u root -p'shuhuiAI@mysql-cshj-0427'
```

连接成功后，复制并执行以下SQL：

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

-- 退出
exit;
```

### 方式三：使用MySQL客户端工具

您也可以使用MySQL客户端工具（如Navicat、MySQL Workbench等）：

1. **连接信息**：
   - 主机：`gz-cdb-blinrztt.sql.tencentcdb.com`
   - 端口：`20615`
   - 用户名：`root`
   - 密码：`shuhuiAI@mysql-cshj-0427`

2. **创建数据库**：创建名为 `lifekline` 的数据库

3. **执行脚本**：打开 `database/schema.sql` 文件，复制所有内容并执行

## 启动服务

### 1. 启动后端服务

```bash
cd backend

# 首次运行需要安装依赖
npm install

# 启动后端服务
npm start
```

如果启动成功，您会看到：

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

### 2. 启动前端服务

```bash
# 返回项目根目录
cd ..

# 启动前端开发服务器
npm run dev
```

如果启动成功，访问 http://localhost:5173

### 3. 测试API连接

在浏览器中访问健康检查接口：
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

## 数据库表结构说明

### 1. users（用户表）

存储用户基本信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(100) | 用户ID（主键）|
| phone | VARCHAR(20) | 手机号（唯一）|
| nickname | VARCHAR(50) | 昵称 |
| avatar | VARCHAR(255) | 头像URL |
| openid | VARCHAR(100) | 微信OpenID（唯一）|
| login_type | ENUM | 登录类型（phone/wechat）|
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 2. user_free_quota（免费次数表）

存储用户的免费次数和分享记录

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | VARCHAR(100) | 用户ID（外键）|
| remaining_count | INT | 剩余免费次数 |
| last_share_date | DATE | 最后一次分享日期 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 3. usage_records（使用记录表）

记录用户使用次数的详细记录

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | VARCHAR(100) | 用户ID（外键）|
| usage_type | ENUM | 使用类型（free/share/paid）|
| usage_count | INT | 使用次数 |
| used_at | TIMESTAMP | 使用时间 |
| remark | VARCHAR(255) | 备注 |

### 4. share_records（分享记录表）

记录用户的分享行为

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | VARCHAR(100) | 用户ID（外键）|
| share_date | DATE | 分享日期 |
| share_time | TIMESTAMP | 分享时间 |
| share_platform | VARCHAR(50) | 分享平台 |

### 5. kline_records（K线生成记录表）- 可选

存储用户生成的K线数据（用于历史记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| user_id | VARCHAR(100) | 用户ID（外键）|
| bazi_info | JSON | 八字信息 |
| analysis_result | JSON | 分析结果 |
| chart_data | JSON | K线数据 |
| created_at | TIMESTAMP | 创建时间 |

## 验证数据库初始化

### 方法一：使用MySQL命令行

```bash
mysql -h gz-cdb-blinrztt.sql.tencentcdb.com -P 20615 -u root -p'shuhuiAI@mysql-cshj-0427' lifekline -e "SHOW TABLES;"
```

应该看到所有5个表：
- users
- user_free_quota
- usage_records
- share_records
- kline_records

### 方法二：查询表数量

```bash
mysql -h gz-cdb-blinrztt.sql.tencentcdb.com -P 20615 -u root -p'shuhuiAI@mysql-cshj-0427' lifekline -e "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'lifekline';"
```

应该返回：`5`

## 常见问题

### Q1: 连接MySQL失败？

**错误信息**：
```
Can't connect to MySQL server on 'gz-cdb-blinrztt.sql.tencentcdb.com'
```

**解决方案**：
1. 检查网络连接
2. 检查防火墙设置
3. 确认腾讯云数据库是否启动
4. 确认端口20615是否开放

### Q2: 密码包含特殊字符？

您的密码 `shuhuiAI@mysql-cshj-0427` 包含 `@` 字符。

**在命令行中，使用 `-p` 和密码之间不要有空格，并用引号包裹：**
```bash
-p'shuhuiAI@mysql-cshj-0427'
```

**在脚本中：**
```bash
MYSQL_PASSWORD="shuhuiAI@mysql-cshj-0427"
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD
```

### Q3: 表已存在？

如果表已存在，SQL会自动使用 `IF NOT EXISTS` 跳过创建。

如果您想重建表：
```sql
-- 删除所有表
DROP TABLE IF EXISTS `kline_records`;
DROP TABLE IF EXISTS `share_records`;
DROP TABLE IF EXISTS `usage_records`;
DROP TABLE IF EXISTS `user_free_quota`;
DROP TABLE IF EXISTS `users`;

-- 然后重新创建
```

### Q4: 权限不足？

如果遇到权限问题，确保root用户有足够权限：
```sql
SHOW GRANTS FOR 'root'@'%';
```

## 数据库管理工具

### 推荐工具

1. **MySQL Workbench**（官方客户端）
   - 下载：https://dev.mysql.com/downloads/workbench/
   - 图形化界面，易于使用

2. **Navicat for MySQL**
   - 商业软件，功能强大
   - 支持多种数据库

3. **phpMyAdmin**
   - 基于Web的MySQL管理工具
   - 适合远程管理

4. **DBeaver**
   - 免费开源
   - 支持多种数据库

## 安全建议

### 1. 不要使用root用户

在生产环境中，建议创建专用数据库用户：

```sql
-- 创建专用用户
CREATE USER 'lifekline_user'@'%' IDENTIFIED BY 'your_strong_password';

-- 授予权限
GRANT SELECT, INSERT, UPDATE, DELETE ON lifekline.* TO 'lifekline_user'@'%';

-- 刷新权限
FLUSH PRIVILEGES;
```

### 2. 使用强密码

- 至少12个字符
- 包含大小写字母、数字、特殊字符
- 不要使用常见密码

### 3. 限制远程访问

在腾讯云控制台配置IP白名单，只允许特定IP访问数据库。

### 4. 定期备份

```bash
# 备份数据库
mysqldump -h gz-cdb-blinrztt.sql.tencentcdb.com -P 20615 -u root -p'shuhuiAI@mysql-cshj-0427' lifekline > backup_$(date +%Y%m%d).sql
```

## 下一步

数据库初始化完成后：

1. ✅ 启动后端服务：`cd backend && npm start`
2. ✅ 启动前端服务：`npm run dev`
3. ✅ 访问 http://localhost:5173
4. ✅ 测试登录和免费次数功能

## 参考文档

- [腾讯云MySQL文档](https://cloud.tencent.com/document/product/236)
- [MySQL官方文档](https://dev.mysql.com/doc/)
- [后端API文档](./backend/README.md)
- [用户使用次数功能说明](./USER_QUOTA_GUIDE.md)

---

**最后更新**: 2026-01-21
