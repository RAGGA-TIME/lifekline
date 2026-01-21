#!/bin/bash

# MySQL数据库初始化脚本
# 使用腾讯云MySQL配置

MYSQL_HOST="gz-cdb-blinrztt.sql.tencentcdb.com"
MYSQL_PORT="20615"
MYSQL_USER="root"
MYSQL_PASSWORD="shuhuiAI@mysql-cshj-0427"
MYSQL_DATABASE="lifekline"

echo "=========================================="
echo "人生K线数据库初始化脚本"
echo "=========================================="
echo ""
echo "数据库配置："
echo "  主机: $MYSQL_HOST"
echo "  端口: $MYSQL_PORT"
echo "  用户: $MYSQL_USER"
echo "  数据库: $MYSQL_DATABASE"
echo ""

# 检查数据库是否已存在
echo "1. 检查数据库..."
DB_EXISTS=$(mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD -e "SHOW DATABASES LIKE '$MYSQL_DATABASE';" 2>/dev/null | grep -c $MYSQL_DATABASE || echo "0")

if [ "$DB_EXISTS" -eq "1" ]; then
    echo "  ✅ 数据库 $MYSQL_DATABASE 已存在"
else
    echo "  ⚠️  数据库 $MYSQL_DATABASE 不存在"
    read -p "  是否创建数据库？(y/n): " CREATE_DB
    if [ "$CREATE_DB" = "y" ] || [ "$CREATE_DB" = "Y" ]; then
        echo ""
        echo "2. 创建数据库..."
        mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD <<EOF
CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\`
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
EOF
        if [ $? -eq 0 ]; then
            echo "  ✅ 数据库创建成功"
        else
            echo "  ❌ 数据库创建失败"
            exit 1
        fi
    else
        echo "  ⏭️  跳过数据库创建"
    fi
fi

echo ""
echo "3. 创建数据库表结构..."

# 执行数据库表结构
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE <<'EOF'

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

EOF

if [ $? -eq 0 ]; then
    echo "  ✅ 数据库表结构创建成功"
else
    echo "  ❌ 数据库表结构创建失败"
    exit 1
fi

echo ""
echo "=========================================="
echo "4. 验证表结构..."
echo "=========================================="

# 检查表是否创建成功
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e "SHOW TABLES;" 2>/dev/null | grep -q "users" && echo "  ✅ users 表已创建" || echo "  ❌ users 表未创建"
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e "SHOW TABLES;" 2>/dev/null | grep -q "user_free_quota" && echo "  ✅ user_free_quota 表已创建" || echo "  ❌ user_free_quota 表未创建"
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e "SHOW TABLES;" 2>/dev/null | grep -q "usage_records" && echo "  ✅ usage_records 表已创建" || echo "  ❌ usage_records 表未创建"
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e "SHOW TABLES;" 2>/dev/null | grep -q "share_records" && echo "  ✅ share_records 表已创建" || echo "  ❌ share_records 表未创建"
mysql -h $MYSQL_HOST -P $MYSQL_PORT -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE -e "SHOW TABLES;" 2>/dev/null | grep -q "kline_records" && echo "  ✅ kline_records 表已创建" || echo "  ❌ kline_records 表未创建"

echo ""
echo "=========================================="
echo "✅ 数据库初始化完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "  1. 启动后端服务: cd backend && npm start"
echo "  2. 启动前端服务: npm run dev"
echo "  3. 访问: http://localhost:5173"
echo ""
