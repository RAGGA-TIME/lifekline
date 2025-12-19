# 🔮 人生 K 线 (Life Destiny K-Line)

> **基于 AI 大模型和传统八字命理，将人生运势以 K 线图形式可视化展现。**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/5lin/lifekline)

---

## ✨ 功能特点

1. **可视化运势**: 用股票 K 线图展示 1-100 岁的人生运势起伏，直观呈现人生"牛市"与"熊市"。
2. **AI 深度批断**: 生成性格、事业、财富、婚姻、健康、六亲及发展风水等多维度报告。
3. **发展风水**: 提供方位建议、地理环境选择及开运布局。
4. **Web3 特供**: "币圈交易运势"板块，包含暴富流年预测与交易风格建议。
5. **灵活使用**: 支持直接调用智谱GLM API，也支持复制提示词到任意AI使用。

---

## 📝 使用方法

### 方式一：直接调用智谱GLM API（推荐）

1. **配置API Key** - 在项目根目录创建 `.env` 文件，添加：
   ```env
   VITE_GLM_API_KEY=your_api_key_here
   ```
   或使用 `GLM_API_KEY`（两种方式都支持）

2. **填写出生信息** - 在"导入数据模式"中输入出生信息
3. **生成K线** - 点击"生成人生K线"按钮，AI将自动分析并生成结果

### 方式二：手动导入（无需API）

1. **填写八字信息** - 输入四柱干支和大运信息
2. **复制提示词** - 点击按钮复制完整提示词
3. **发送给 AI** - 粘贴到 ChatGPT、Claude、Gemini 等任意 AI
4. **导入结果** - 将 AI 返回的 JSON 数据粘贴回来
5. **查看 K 线** - 生成完整的人生 K 线图和分析报告

---

## 🚀 一键部署

### Vercel 部署（推荐）

点击下方按钮一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/lifekline)

### 本地运行

```bash
# 安装依赖
npm install

# 配置环境变量（可选，如果使用智谱GLM API）
# 在项目根目录创建 .env 文件，添加：
# VITE_GLM_API_KEY=your_api_key_here
# 获取API Key: https://open.bigmodel.cn/

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

**注意**: 如果使用智谱GLM API，需要在 `.env` 文件中配置 `VITE_GLM_API_KEY` 或 `GLM_API_KEY`。如果不配置，也可以在表单中手动输入API Key。

---

## 🛠️ 技术栈

- **前端框架**: React 19 + Vite
- **UI 样式**: TailwindCSS
- **图表库**: Recharts
- **AI 支持**: ChatGPT、Claude、Gemini 等任意 AI

---

## 📸 项目预览

![人生流年大运K线图](assets/1.png)
*(图1：人生流年大运 K 线走势图)*

![详细分析报告](assets/2.png)
*(图2：命理分析、币圈运势与风水建议)*

---

**免责声明**: 本项目仅供娱乐与文化研究，命运掌握在自己手中。切勿迷信，请理性看待分析结果。
