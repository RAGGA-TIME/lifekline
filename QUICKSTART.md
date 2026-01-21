# 快速开始指南

## 功能概览

✅ **已完成的功能：**
1. 用户登录（手机号+验证码、微信H5）
2. 免费次数管理（登录赠送1次，每天分享+1次）
3. MySQL数据库存储
4. LocalStorage后备存储
5. 分享弹窗和分享功能

## 快速开始

### 1. 配置MySQL数据库

```bash
# 连接MySQL
mysql -u root -p

# 执行数据库创建脚本
source database/schema.sql

# 退出
exit;
```

### 2. 启动后端服务

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写MySQL配置

# 启动服务
npm start
```

启动成功后，访问 http://localhost:3000/health 验证服务正常运行。

### 3. 启动前端服务

```bash
# 返回项目根目录
cd ..

# 配置环境变量
# 编辑 .env 文件，添加：
# VITE_API_BASE_URL=http://localhost:3000/api

# 启动前端
npm run dev
```

### 4. 测试功能

1. 访问 http://localhost:5173
2. 点击"登录"按钮
3. 使用手机号登录（验证码在控制台输出）
4. 查看右上角显示剩余次数（应该是1次）
5. 点击右上角"分享"按钮
6. 选择分享平台（微信/微博/QQ等）
7. 查看剩余次数+1（变成2次）
8. 填写出生信息
9. 点击"生成人生K线"
10. 查看剩余次数-1（变成1次）

## 功能验证清单

- [ ] 用户可以登录（手机号或微信）
- [ ] 登录后显示用户昵称
- [ ] 右上角显示剩余次数
- [ ] 可以点击"分享"按钮
- [ ] 分享成功后次数+1
- [ ] 每天只能分享1次
- [ ] 生成K线时检查并扣减次数
- [ ] 次数不足时提示分享
- [ ] 数据存储在MySQL数据库

## 文件结构

```
lifekline/
├── backend/                    # 后端API服务
│   ├── server.js              # Express服务器
│   ├── package.json           # 后端依赖
│   ├── README.md              # 后端文档
│   └── .env                   # 后端环境变量（需要创建）
├── database/                   # 数据库相关
│   └── schema.sql             # MySQL表结构
├── services/                   # 服务层
│   ├── apiService.ts          # HTTP API服务
│   ├── authService.ts          # 认证服务
│   ├── tencentSmsService.ts   # 腾讯云短信服务
│   └── databaseService.ts      # 数据库服务
├── components/                 # React组件
│   ├── Login.tsx              # 登录页面
│   ├── WeChatCallback.tsx      # 微信回调
│   ├── ShareModal.tsx         # 分享弹窗
│   ├── ConfirmDataMode.tsx     # K线生成表单
│   ├── LifeKLineChart.tsx     # K线图表
│   └── AnalysisResult.tsx      # 分析结果展示
├── App.tsx                    # 主应用
├── types.ts                    # 类型定义
├── .env.example                # 环境变量示例
├── database/schema.sql          # 数据库表结构
└── QUICKSTART.md              # 本文档
```

## 环境变量配置

### 前端 .env

```env
# API Keys
VITE_GLM_API_KEY=your_glm_api_key_here
GLM_API_KEY=your_glm_api_key_here

# WeChat App ID
VITE_WECHAT_APP_ID=your_wechat_app_id_here

# Tencent Cloud SMS
VITE_TENCENT_SECRET_ID=your_secret_id_here
VITE_TENCENT_SECRET_KEY=your_secret_key_here
VITE_TENCENT_SMS_APP_ID=your_sms_app_id_here
VITE_TENCENT_SMS_SIGN_NAME=your_sms_signature_here
VITE_TENCENT_SMS_TEMPLATE_ID=your_template_id_here

# Backend API (重要)
VITE_API_BASE_URL=http://localhost:3000/api
```

### 后端 .env

```env
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=lifekline

# Server Port
PORT=3000
```

## 常见问题

### Q1: 后端连接MySQL失败？

**错误信息：**
```
Error: connect ECONNREFUSED
```

**解决方法：**
1. 检查MySQL服务是否启动
2. 检查backend/.env配置
3. 检查MySQL用户权限

### Q2: 前端无法调用后端API？

**检查项：**
1. 后端服务是否启动？（访问 http://localhost:3000/health）
2. 前端VITE_API_BASE_URL配置是否正确？
3. 是否有CORS错误？

### Q3: LocalStorage缓存问题？

**解决方法：**
清除浏览器LocalStorage缓存后刷新页面。

## 详细文档

- [后端API文档](./backend/README.md)
- [用户使用次数功能说明](./USER_QUOTA_GUIDE.md)
- [腾讯云短信配置指南](./TENCENT_SMS_GUIDE.md)
- [登录功能使用说明](./LOGIN_GUIDE.md)

## 支持

如有问题，请查看相关文档或提交Issue。

---

**最后更新**: 2026-01-21
