# Bazi MCP API 集成说明

## 问题描述

当前代码虽然定义了 MCP 工具，但实际上并没有真正调用 bazi-mcp 服务器，而是返回了一个模拟的 note，让模型自己计算八字。这导致相同生日多次调用后，返回的八字结果不一致。

## 解决方案

已创建 `/api/bazi` API 端点来真正调用 bazi-mcp 服务器。当前实现是占位符，需要根据实际情况集成真实的 bazi-mcp 调用。

## 集成方案

### 方案1: 如果 bazi-mcp 提供 HTTP API

如果 bazi-mcp 提供 HTTP API 端点，可以直接在 `api/bazi/index.ts` 中调用：

```typescript
const baziResponse = await fetch('https://bazi-mcp-api.example.com/getBaziDetail', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    solarDatetime: '2008-03-01T13:00:00+08:00',
    gender: 1, // 1=男, 0=女
    eightCharProviderSect: 2
  })
});
const baziResult = await baziResponse.json();
```

### 方案2: 通过 MCP 客户端调用（推荐）

如果 bazi-mcp 是 MCP 服务器（通过 stdio 通信），需要集成 MCP 客户端：

1. 安装依赖：
```bash
npm install @modelcontextprotocol/sdk
```

2. 在 `api/bazi/index.ts` 中使用 MCP 客户端：

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@cantian-ai/bazi-mcp']
});

const client = new Client({ 
  name: 'bazi-api', 
  version: '1.0.0' 
}, { 
  capabilities: {} 
});

await client.connect(transport);

const result = await client.callTool({
  name: 'getBaziDetail',
  arguments: {
    solarDatetime: '2008-03-01T13:00:00+08:00',
    gender: 1,
    eightCharProviderSect: 2
  }
});

const baziResult = JSON.parse(result.content[0].text);
```

### 方案3: 使用其他 bazi 计算库

如果无法直接使用 bazi-mcp，可以使用其他 bazi 计算库，如 `@lunar-javascript/core`：

```bash
npm install @lunar-javascript/core
```

```typescript
import { Lunar } from '@lunar-javascript/core';

const lunar = Lunar.fromYmd(year, month, day);
const baziResult = lunar.getEightChar();
```

## 参数说明

根据 bazi-mcp 文档，`getBaziDetail` 工具需要以下参数：

- `solarDatetime`: ISO 8601 格式，例如 `"2008-03-01T13:00:00+08:00"`
- `lunarDatetime` (可选): 农历日期时间，格式为 `"YYYY-M-D HH:mm:ss"`
- `gender`: `0` 表示女性，`1` 表示男性
- `eightCharProviderSect` (可选): 早晚子时配置，`1` 表示 23:00-23:59 日干支为次日，`2` 表示当日（默认值）

## 返回格式

API 应该返回以下格式的数据：

```json
{
  "fourPillars": {
    "year": "甲子",
    "month": "乙丑",
    "day": "丙寅",
    "hour": "丁卯"
  },
  "daYun": {
    "startAge": 5,
    "direction": "顺",
    "sequence": ["甲子", "乙丑", "丙寅", "丁卯"]
  },
  "metadata": {
    "solarDatetime": "2008-03-01T13:00:00+08:00",
    "gender": 1,
    "calendarType": "solar",
    "birthPlace": "北京市"
  }
}
```

## 测试

确保相同生日多次调用返回相同的八字结果：

```bash
# 测试相同参数
curl -X POST http://localhost:3000/api/bazi \
  -H "Content-Type: application/json" \
  -d '{
    "year": 1990,
    "month": 5,
    "day": 15,
    "hour": 12,
    "minute": 0,
    "gender": "male",
    "calendarType": "solar"
  }'
```

多次调用应该返回相同的 `fourPillars` 结果。

## 注意事项

1. **确保结果一致性**：相同输入必须返回相同输出，这是解决八字结果不一致问题的关键
2. **错误处理**：如果 bazi-mcp 调用失败，应该返回明确的错误信息
3. **性能考虑**：MCP 服务器调用可能有延迟，考虑添加缓存机制
4. **日志记录**：记录每次调用的参数和结果，便于调试

