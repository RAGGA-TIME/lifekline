
import { UserInput, LifeDestinyResult, Gender } from "../types";
import { BAZI_SYSTEM_INSTRUCTION } from "../constants";

export const generateLifeAnalysis = async (input: UserInput): Promise<LifeDestinyResult> => {

  const { apiKey, apiBaseUrl, modelName } = input;

  // FIX: Trim whitespace which causes header errors if copied with newlines
  const cleanApiKey = apiKey ? apiKey.trim() : "";
  const cleanBaseUrl = apiBaseUrl ? apiBaseUrl.trim().replace(/\/+$/, "") : "";
  const targetModel = modelName && modelName.trim() ? modelName.trim() : "gemini-3-pro-preview";

  // 本地演示模式：当 API Key 为 'demo' 时，使用预生成的本地数据
  if (cleanApiKey.toLowerCase() === 'demo') {
    console.log('🎯 使用本地演示模式');
    const mockData = await fetch('/mock-data.json').then(r => r.json());
    return {
      chartData: mockData.chartPoints,
      analysis: {
        bazi: mockData.bazi || [],
        summary: mockData.summary || "无摘要",
        summaryScore: mockData.summaryScore || 5,
        personality: mockData.personality || "无性格分析",
        personalityScore: mockData.personalityScore || 5,
        industry: mockData.industry || "无",
        industryScore: mockData.industryScore || 5,
        fengShui: mockData.fengShui || "建议多亲近自然，保持心境平和。",
        fengShuiScore: mockData.fengShuiScore || 5,
        wealth: mockData.wealth || "无",
        wealthScore: mockData.wealthScore || 5,
        marriage: mockData.marriage || "无",
        marriageScore: mockData.marriageScore || 5,
        health: mockData.health || "无",
        healthScore: mockData.healthScore || 5,
        family: mockData.family || "无",
        familyScore: mockData.familyScore || 5,
        crypto: mockData.crypto || "暂无交易分析",
        cryptoScore: mockData.cryptoScore || 5,
        cryptoYear: mockData.cryptoYear || "待定",
        cryptoStyle: mockData.cryptoStyle || "现货定投",
      },
    };
  }

  if (!cleanApiKey) {
    throw new Error("请在表单中填写有效的 API Key（输入 'demo' 可使用本地演示模式）");
  }

  // Check for non-ASCII characters to prevent obscure 'Failed to construct Request' errors
  // If user accidentally pastes Chinese characters or emojis in the API key field
  if (/[^\x00-\x7F]/.test(cleanApiKey)) {
    throw new Error("API Key 包含非法字符（如中文或全角符号），请检查输入是否正确。");
  }

  if (!cleanBaseUrl) {
    throw new Error("请在表单中填写有效的 API Base URL");
  }

  const genderStr = input.gender === Gender.MALE ? '男 (乾造)' : '女 (坤造)';
  const birthPlaceStr = input.birthPlace ? `\n出生地：${input.birthPlace}` : '';
  const birthTimeStr = `${(input.birthHour || '0').padStart(2, '0')}:${(input.birthMinute || '0').padStart(2, '0')}`;

  const userPrompt = `
    请根据以下**出生信息**进行八字排盘和大运计算，然后生成人生K线分析。
    
    【基本信息】
    性别：${genderStr}
    姓名：${input.name || "未提供"}
    出生日期：${input.birthYear}年 ${input.birthMonth}月 ${input.birthDay}日 ${birthTimeStr} (${input.calendarType === 'solar' ? '阳历' : '阴历'})${birthPlaceStr}
    
    【第一步：八字排盘计算】
    请根据出生日期和时间（${input.calendarType === 'solar' ? '阳历' : '阴历'}）${input.birthYear}年${input.birthMonth}月${input.birthDay}日 ${birthTimeStr}，自动计算并确定：
    1. **年柱**：根据出生年份计算年柱干支
    2. **月柱**：根据出生月份和年份计算月柱干支
    3. **日柱**：根据出生日期计算日柱干支
    4. **时柱**：根据出生时间 ${birthTimeStr} 精确计算时柱干支
    
    【第二步：大运计算】
    请根据以下规则计算大运信息：
    1. **起运年龄**：根据出生日期和性别，计算起运年龄（虚岁）
    2. **第一步大运**：根据年柱天干属性和性别，确定大运排序方向（顺行/逆行），并计算第一步大运干支
       - 阳男/阴女：顺行（从月柱顺排）
       - 阴男/阳女：逆行（从月柱逆排）
    3. **大运序列**：根据第一步大运和排序方向，推算出完整的10步大运序列
    
    【第三步：大运序列生成算法】
    请严格按照以下步骤生成数据：
    
    1. **确定起运年龄**：计算出的起运年龄（虚岁）记为 startAge
    2. **确定第一步大运**：计算出的第一步大运干支记为 firstDaYun
    3. **确定排序方向**：根据年柱天干和性别确定是顺行还是逆行
    4. **计算序列**：根据六十甲子顺序和方向，推算出接下来的 9 步大运
    5. **填充 JSON**：
       - Age 1 到 (startAge - 1): daYun = "童限"
       - Age startAge 到 (startAge + 9): daYun = [第1步大运: firstDaYun]
       - Age (startAge + 10) 到 (startAge + 19): daYun = [第2步大运]
       - ...以此类推直到 100 岁
    
    【特别警告】
    - **daYun 字段**：必须填大运干支（10年一变），**绝对不要**填流年干支。
    - **ganZhi 字段**：填入该年份的**流年干支**（每年一变，例如 2024=甲辰，2025=乙巳）。
    
    任务：
    1. 根据出生信息计算八字四柱和大运信息
    2. 确认格局与喜忌
    3. 生成 **1-100 岁 (虚岁)** 的人生流年K线数据
    4. 在 \`reason\` 字段中提供流年详批
    5. 生成带评分的命理分析报告（包含性格分析、币圈交易分析、发展风水分析）
    
    请严格按照系统指令生成 JSON 数据。
  `;

  try {
    const response = await fetch(`${cleanBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanApiKey}`
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          { role: "system", content: BAZI_SYSTEM_INSTRUCTION + "\n\n请务必只返回纯JSON格式数据，不要包含任何markdown代码块标记。" },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 30000
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API 请求失败: ${response.status} - ${errText}`);
    }

    const jsonResult = await response.json();
    const content = jsonResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("模型未返回任何内容。");
    }

    // 从可能包含 markdown 代码块的内容中提取 JSON
    let jsonContent = content;

    // 尝试提取 ```json ... ``` 中的内容
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    } else {
      // 如果没有代码块，尝试找到 JSON 对象
      const jsonStartIndex = content.indexOf('{');
      const jsonEndIndex = content.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonContent = content.substring(jsonStartIndex, jsonEndIndex + 1);
      }
    }

    // 解析 JSON
    const data = JSON.parse(jsonContent);

    // 简单校验数据完整性
    if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
      throw new Error("模型返回的数据格式不正确（缺失 chartPoints）。");
    }

    return {
      chartData: data.chartPoints,
      analysis: {
        bazi: data.bazi || [],
        summary: data.summary || "无摘要",
        summaryScore: data.summaryScore || 5,
        personality: data.personality || "无性格分析",
        personalityScore: data.personalityScore || 5,
        industry: data.industry || "无",
        industryScore: data.industryScore || 5,
        fengShui: data.fengShui || "建议多亲近自然，保持心境平和。",
        fengShuiScore: data.fengShuiScore || 5,
        wealth: data.wealth || "无",
        wealthScore: data.wealthScore || 5,
        marriage: data.marriage || "无",
        marriageScore: data.marriageScore || 5,
        health: data.health || "无",
        healthScore: data.healthScore || 5,
        family: data.family || "无",
        familyScore: data.familyScore || 5,
        // Crypto Fields
        crypto: data.crypto || "暂无交易分析",
        cryptoScore: data.cryptoScore || 5,
        cryptoYear: data.cryptoYear || "待定",
        cryptoStyle: data.cryptoStyle || "现货定投",
      },
    };
  } catch (error) {
    console.error("Gemini/OpenAI API Error:", error);
    throw error;
  }
};
