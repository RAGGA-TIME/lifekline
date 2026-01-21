// server.js - 后端API服务
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 数据库配置
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'lifekline',
  waitForConnections: true,
  connectionLimit: 10,
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '后端服务正常运行' });
});

// 用户相关API

// 创建或获取用户
app.post('/api/users', async (req, res) => {
  try {
    const { id, phone, nickname, avatar, openid, login_type } = req.body;

    await pool.execute(
      `INSERT INTO users (id, phone, nickname, avatar, openid, login_type) 
       VALUES (?, ?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       phone = VALUES(phone), 
       nickname = VALUES(nickname), 
       avatar = VALUES(avatar), 
       openid = VALUES(openid)`,
      [id, phone, nickname, avatar, openid, login_type]
    );

    // 初始化免费次数
    await pool.execute(
      `INSERT INTO user_free_quota (user_id, remaining_count) 
       VALUES (?, 1) 
       ON DUPLICATE KEY UPDATE 
       user_id = user_id`,
      [id]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('创建用户失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 获取用户信息
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    res.json(rows[0] || null);
  } catch (error: any) {
    console.error('获取用户失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 通过手机号获取用户
app.get('/api/users/phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );
    res.json(rows[0] || null);
  } catch (error: any) {
    console.error('获取用户失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 免费次数相关API

// 获取剩余免费次数
app.get('/api/quota/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute(
      'SELECT remaining_count, last_share_date FROM user_free_quota WHERE user_id = ?',
      [userId]
    );

    if (rows[0]) {
      res.json({ remaining: rows[0].remaining_count });
    } else {
      res.json({ remaining: 0 });
    }
  } catch (error: any) {
    console.error('获取免费次数失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 使用免费次数
app.post('/api/quota/use', async (req, res) => {
  try {
    const { userId } = req.body;

    const [result] = await pool.execute(
      `UPDATE user_free_quota 
       SET remaining_count = remaining_count - 1 
       WHERE user_id = ? AND remaining_count > 0`,
      [userId]
    );

    if ((result as any).affectedRows > 0) {
      // 记录使用
      await pool.execute(
        'INSERT INTO usage_records (user_id, usage_type, usage_count, remark) VALUES (?, "free", 1, "生成K线消耗1次免费次数")',
        [userId]
      );
      res.json({ success: true, message: '使用成功' });
    } else {
      res.json({ success: false, message: '剩余次数不足' });
    }
  } catch (error: any) {
    console.error('使用免费次数失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 检查是否可以分享
app.get('/api/quota/can-share/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const [rows] = await pool.execute(
      'SELECT last_share_date FROM user_free_quota WHERE user_id = ?',
      [userId]
    );

    if (rows[0]) {
      const lastShareDate = rows[0].last_share_date
        ? new Date(rows[0].last_share_date).toISOString().split('T')[0]
        : null;
      const canShare = lastShareDate !== today;
      res.json({ canShare });
    } else {
      res.json({ canShare: true });
    }
  } catch (error: any) {
    console.error('检查分享状态失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 分享获取免费次数
app.post('/api/quota/share', async (req, res) => {
  try {
    const { userId, platform } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const [result] = await pool.execute(
      `UPDATE user_free_quota 
       SET remaining_count = remaining_count + 1, 
           last_share_date = ?
       WHERE user_id = ? AND last_share_date != ?`,
      [today, userId, today]
    );

    if ((result as any).affectedRows > 0) {
      // 记录分享
      await pool.execute(
        'INSERT INTO share_records (user_id, share_date, share_platform) VALUES (?, ?, ?)',
        [userId, today, platform]
      );

      // 记录使用
      await pool.execute(
        'INSERT INTO usage_records (user_id, usage_type, usage_count, remark) VALUES (?, "share", 1, "分享获得1次免费次数")',
        [userId]
      );

      res.json({ success: true, message: '分享成功！已获得1次免费次数' });
    } else {
      res.json({ success: false, message: '今日已分享过，明天再来吧' });
    }
  } catch (error: any) {
    console.error('分享获取次数失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取今日分享状态
app.get('/api/quota/share-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.execute(
      'SELECT last_share_date FROM user_free_quota WHERE user_id = ?',
      [userId]
    );

    if (rows[0]) {
      const lastShareDate = rows[0].last_share_date;
      const today = new Date().toISOString().split('T')[0];
      const canShare = lastShareDate ? new Date(lastShareDate).toISOString().split('T')[0] !== today : true;

      res.json({
        canShare,
        lastShareDate: lastShareDate || null,
      });
    } else {
      res.json({ canShare: true, lastShareDate: null });
    }
  } catch (error: any) {
    console.error('获取分享状态失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 记录使用
app.post('/api/usage', async (req, res) => {
  try {
    const { userId, usageType, count, remark } = req.body;

    await pool.execute(
      'INSERT INTO usage_records (user_id, usage_type, usage_count, remark) VALUES (?, ?, ?, ?)',
      [userId, usageType, count, remark]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('记录使用失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 记录分享
app.post('/api/share', async (req, res) => {
  try {
    const { userId, shareDate, platform } = req.body;

    await pool.execute(
      'INSERT INTO share_records (user_id, share_date, share_platform) VALUES (?, ?, ?)',
      [userId, shareDate, platform]
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('记录分享失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ 后端服务运行在 http://localhost:${PORT}`);
  console.log(`✅ 健康检查: http://localhost:${PORT}/health`);
  console.log('\n可用的API端点:');
  console.log('  POST   /api/users              - 创建用户');
  console.log('  GET    /api/users/:userId       - 获取用户');
  console.log('  GET    /api/users/phone/:phone - 通过手机号获取用户');
  console.log('  GET    /api/quota/:userId       - 获取剩余次数');
  console.log('  POST   /api/quota/use           - 使用免费次数');
  console.log('  GET    /api/quota/can-share/:userId - 检查是否可分享');
  console.log('  POST   /api/quota/share         - 分享获取次数');
  console.log('  POST   /api/usage                - 记录使用');
  console.log('  POST   /api/share                - 记录分享');
  console.log('\n环境变量配置:');
  console.log('  MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  await pool.end();
  process.exit(0);
});
