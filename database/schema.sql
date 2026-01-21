-- 人生K线数据库表结构

-- 用户表
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

-- 免费次数表
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

-- 使用记录表
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

-- 分享记录表
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

-- K线生成记录表（可选，用于历史记录）
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
