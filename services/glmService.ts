import { LifeDestinyResult, Gender } from "../types";
import { BAZI_SYSTEM_INSTRUCTION } from "../constants";

interface GLMInput {
  name?: string;
  gender: Gender | string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  birthMinute: string;
  calendarType: 'solar' | 'lunar';
  birthPlace?: string;
  apiKey?: string;
  modelName?: string;
  baziResult?: any; // 前端预计算的八字结果
  onStream?: (text: string) => void;
}

// Helper function to fix common JSON issues
const fixJsonString = (jsonStr: string): string => {
  let fixed = jsonStr;
  
  // Remove BOM and other invisible characters
  fixed = fixed.replace(/^\uFEFF/, '');
  
  // Fix common issues: replace smart quotes with regular quotes
  fixed = fixed.replace(/[""]/g, '"');
  fixed = fixed.replace(/['']/g, "'");
  
  // Remove trailing commas before } or ]
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix unescaped control characters in string values
  let inString = false;
  let escapeNext = false;
  let result = '';
  
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    
    if (inString) {
      // Inside a string, escape problematic characters
      if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else if (char.charCodeAt(0) < 32) {
        // Escape other control characters
        result += `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  
  return result;
};

export const generateLifeAnalysisWithGLM = async (input: GLMInput): Promise<LifeDestinyResult> => {
  // Get API key from input or environment variable
  // Vite exposes VITE_* variables via import.meta.env, and we also define GLM_API_KEY via vite.config.ts
  const apiKey = input.apiKey?.trim() || (import.meta.env.VITE_GLM_API_KEY || import.meta.env.GLM_API_KEY || '').trim();
  const modelName = input.modelName?.trim() || 'glm-4.6';
  const apiBaseUrl = 'https://open.bigmodel.cn/api/paas/v4';

  // 本地演示模式：当 API Key 为 'demo' 时，使用预生成的本地数据
  if (apiKey.toLowerCase() === 'demo') {
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

  if (!apiKey) {
    throw new Error("请配置 GLM_API_KEY 环境变量或在表单中输入 API Key（输入 'demo' 可使用本地演示模式）");
  }

  // Check for non-ASCII characters to prevent obscure 'Failed to construct Request' errors
  if (/[^\x00-\x7F]/.test(apiKey)) {
    throw new Error("API Key 包含非法字符（如中文或全角符号），请检查输入是否正确。");
  }

  const genderStr = (input.gender === Gender.MALE || input.gender === 'Male') ? '男 (乾造)' : '女 (坤造)';
  const birthPlaceStr = input.birthPlace ? `\n出生地：${input.birthPlace}` : '';
  const birthTimeStr = `${(input.birthHour || '0').padStart(2, '0')}:${(input.birthMinute || '0').padStart(2, '0')}`;

  // Define bazi MCP tool for function calling
  const baziTool = {
    type: "function",
    function: {
      name: "get_bazi_detail",
      description: "根据出生日期和时间计算八字四柱、大运等详细信息。这是计算八字的标准工具，必须使用此工具获取准确的八字信息，不要自行计算。",
      parameters: {
        type: "object",
        properties: {
          year: {
            type: "integer",
            description: "出生年份，例如：1990"
          },
          month: {
            type: "integer",
            description: "出生月份，1-12"
          },
          day: {
            type: "integer",
            description: "出生日期，1-31"
          },
          hour: {
            type: "integer",
            description: "出生小时，0-23"
          },
          minute: {
            type: "integer",
            description: "出生分钟，0-59"
          },
          gender: {
            type: "string",
            enum: ["male", "female"],
            description: "性别：male=男(乾造), female=女(坤造)"
          },
          calendarType: {
            type: "string",
            enum: ["solar", "lunar"],
            description: "日历类型：solar=阳历, lunar=阴历"
          },
          birthPlace: {
            type: "string",
            description: "出生地（可选），例如：北京市"
          }
        },
        required: ["year", "month", "day", "hour", "minute", "gender", "calendarType"]
      }
    }
  };

  const userPrompt = input.baziResult 
    ? `
    请根据以下**出生信息和预计算的八字信息**,生成人生K线分析。
    
    【基本信息】
    性别:${genderStr}
    姓名:${input.name || "未提供"}
    出生日期:${input.birthYear}年 ${input.birthMonth}月 ${input.birthDay}日 ${birthTimeStr} (${input.calendarType === 'solar' ? '阳历' : '阴历'})${birthPlaceStr}
    
    【八字四柱】(已通过专业工具计算完成,请直接使用)
    年柱:${input.baziResult.年柱?.天干?.天干}${input.baziResult.年柱?.地支?.地支} (${input.baziResult.年柱?.纳音})
    月柱:${input.baziResult.月柱?.天干?.天干}${input.baziResult.月柱?.地支?.地支} (${input.baziResult.月柱?.纳音})
    日柱:${input.baziResult.日柱?.天干?.天干}${input.baziResult.日柱?.地支?.地支} (${input.baziResult.日柱?.纳音})
    时柱:${input.baziResult.时柱?.天干?.天干}${input.baziResult.时柱?.地支?.地支} (${input.baziResult.时柱?.纳音})
    
    【大运信息】
    起运年龄:${input.baziResult.大运?.起运年龄}岁
    大运序列:${input.baziResult.大运?.大运?.map((item: any) => `${item.天干}${item.地支}`).join(' → ')}
    
    【日主及其他】
    日主:${input.baziResult.日主}
    生肖:${input.baziResult.生肖}
    
    【任务清单】
    1. 基于以上准确的八字四柱和大运信息进行命理分析
    2. 确认格局与喜忌
    3. 生成 **1-100 岁 (虚岁)** 的人生流年K线数据
    4. 在 \`reason\` 字段中提供流年详批(20-30字)
    5. 生成带评分的命理分析报告(包含性格分析、币圈交易分析、发展风水分析)
    
    【大运序列生成算法】
    严格按照以下步骤生成数据:
    1. **确定起运年龄**:${input.baziResult.大运?.起运年龄}岁(虚岁)
    2. **大运序列**:已提供,每步管10年
    3. **填充 JSON**:
       - Age 1 到 (起运年龄 - 1): daYun = "童限"
       - Age ${input.baziResult.大运?.起运年龄} 到 ${input.baziResult.大运?.起运年龄 + 9}: daYun = "${input.baziResult.大运?.大运?.[0]?.天干}${input.baziResult.大运?.大运?.[0]?.地支}"
       - 以此类推,每10年换一步大运
    
    【特别警告】
    - **daYun 字段**:必须填大运干支(10年一变),**绝对不要**填流年干支
    - **ganZhi 字段**:填入该年份的**流年干支**(每年一变)
    
    【⚠️ 输出格式要求】
    - 必须严格按照系统指令中指定的JSON结构输出
    - 只输出纯JSON对象,不要包含任何markdown代码块标记(如 \`\`\`json)
    - 不要添加任何说明文字、注释或其他格式内容
    - 确保JSON语法完全正确:所有字符串用双引号,所有键名用双引号,确保JSON完整可解析
    - 严格按照系统指令中的JSON结构,包含所有必需字段
    
    请严格按照系统指令生成 JSON 数据。
  `
    : `
    请根据以下**出生信息**,先调用 bazi MCP 工具计算八字,然后生成人生K线分析。
    
    【基本信息】
    性别:${genderStr}
    姓名:${input.name || "未提供"}
    出生日期:${input.birthYear}年 ${input.birthMonth}月 ${input.birthDay}日 ${birthTimeStr} (${input.calendarType === 'solar' ? '阳历' : '阴历'})${birthPlaceStr}
    
    【⚠️ 重要:必须先调用工具】
    1. **第一步:调用 bazi MCP 工具**
       - 请立即调用 \`get_bazi_detail\` 工具,传入以下参数:
         - year: ${input.birthYear}
         - month: ${parseInt(input.birthMonth)}
         - day: ${parseInt(input.birthDay)}
         - hour: ${parseInt(input.birthHour)}
         - minute: ${parseInt(input.birthMinute)}
         - gender: ${input.gender === Gender.MALE || input.gender === 'Male' ? 'male' : 'female'}
         - calendarType: ${input.calendarType}
         ${input.birthPlace ? `- birthPlace: ${input.birthPlace}` : ''}
       - **不要自行计算八字**,必须使用工具获取准确结果
    
    2. **第二步:基于工具结果进行分析**
       - 工具会返回准确的八字四柱(年柱、月柱、日柱、时柱)
       - 工具会返回大运信息(起运年龄、大运序列等)
       - 基于工具返回的准确八字和大运信息,进行命理分析
    
    【大运序列生成算法】
    根据工具返回的大运信息,严格按照以下步骤生成数据:
    
    1. **确定起运年龄**:使用工具返回的起运年龄(虚岁)记为 startAge
    2. **确定第一步大运**:使用工具返回的第一步大运干支记为 firstDaYun
    3. **确定排序方向**:根据工具返回的信息确定是顺行还是逆行
    4. **计算序列**:根据六十甲子顺序和方向,推算出接下来的 9 步大运
    5. **填充 JSON**:
       - Age 1 到 (startAge - 1): daYun = "童限"
       - Age startAge 到 (startAge + 9): daYun = [第1步大运: firstDaYun]
       - Age (startAge + 10) 到 (startAge + 19): daYun = [第2步大运]
       - ...以此类推直到 100 岁
    
    【特别警告】
    - **daYun 字段**:必须填大运干支(10年一变),**绝对不要**填流年干支。
    - **ganZhi 字段**:填入该年份的**流年干支**(每年一变,例如 2024=甲辰,2025=乙巳)。
    
    【任务清单】
    1. ✅ 调用 bazi MCP 工具获取准确的八字和大运信息
    2. 确认格局与喜忌(基于工具返回的八字)
    3. 生成 **1-100 岁 (虚岁)** 的人生流年K线数据
    4. 在 \`reason\` 字段中提供流年详批
    5. 生成带评分的命理分析报告(包含性格分析、币圈交易分析、发展风水分析)
    
    【⚠️ 输出格式要求】
    - 必须严格按照系统指令中指定的JSON结构输出
    - 只输出纯JSON对象,不要包含任何markdown代码块标记(如 \`\`\`json)
    - 不要添加任何说明文字、注释或其他格式内容
    - 确保JSON语法完全正确:所有字符串用双引号,所有键名用双引号,确保JSON完整可解析
    - 严格按照系统指令中的JSON结构,包含所有必需字段
    
    请严格按照系统指令生成 JSON 数据。
  `;

  try {
    // 如果提供了预计算的八字结果,直接进行单次API调用
    if (input.baziResult) {
      const messages: any[] = [
        { role: "system", content: BAZI_SYSTEM_INSTRUCTION + "\n\n⚠️ 重要:必须严格按照指定的JSON结构输出,只输出纯JSON对象,不要包含任何markdown代码块标记、说明文字或其他格式内容。确保JSON语法完全正确,所有字符串用双引号,所有键名用双引号。" },
        { role: "user", content: userPrompt }
      ];

      // Use streaming for direct API call
      const response = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          temperature: 0.7,
          max_tokens: 65536,
          stream: true,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API 请求失败: ${response.status} - ${errText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      if (!reader) {
        throw new Error("无法读取流式响应");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.startsWith(':')) continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const chunk = JSON.parse(data);
              const delta = chunk.choices?.[0]?.delta;
              if (delta?.content) {
                fullContent += delta.content;
                if (input.onStream) {
                  input.onStream(fullContent);
                }
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim() && buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data !== '[DONE]') {
          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta;
            if (delta?.content) {
              fullContent += delta.content;
              if (input.onStream) {
                input.onStream(fullContent);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      const message = { content: fullContent };
      const content = message?.content;

      if (!content) {
        throw new Error("模型未返回任何内容。");
      }

      // Extract JSON from response
      let jsonContent = content.trim();
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      } else {
        const jsonStartIndex = content.indexOf('{');
        const jsonEndIndex = content.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          jsonContent = content.substring(jsonStartIndex, jsonEndIndex + 1);
        }
      }

      // Parse and return data (use existing JSON parsing logic)
      let data;
      try {
        data = JSON.parse(jsonContent);
      } catch (parseError: any) {
        // If JSON parsing fails, try to fix common issues
        console.error("JSON解析失败,尝试修复:", parseError);
        let fixedJson = fixJsonString(jsonContent);
        
        try {
          data = JSON.parse(fixedJson);
        } catch (fixError: any) {
          throw new Error(`JSON解析失败: ${parseError.message}。请检查模型返回的数据格式。`);
        }
      }

      // Validate data completeness
      if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
        throw new Error("模型返回的数据格式不正确(缺失 chartPoints)。");
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
          crypto: data.crypto || "暂无交易分析",
          cryptoScore: data.cryptoScore || 5,
          cryptoYear: data.cryptoYear || "待定",
          cryptoStyle: data.cryptoStyle || "现货定投",
        },
      };
    }

    // 如果没有提供八字结果,使用原有的工具调用流程
    // First API call with tool definition
    let messages: any[] = [
      { role: "system", content: BAZI_SYSTEM_INSTRUCTION + "\n\n⚠️ 重要：必须严格按照指定的JSON结构输出，只输出纯JSON对象，不要包含任何markdown代码块标记、说明文字或其他格式内容。确保JSON语法完全正确，所有字符串用双引号，所有键名用双引号。" },
      { role: "user", content: userPrompt }
    ];

    let response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        tools: [baziTool],
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 65536
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API 请求失败: ${response.status} - ${errText}`);
    }

    let jsonResult = await response.json();
    let message = jsonResult.choices?.[0]?.message;
    
    // Handle tool calls if present
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.group?.("✅ MCP 工具调用检测");
      console.log("检测到 MCP 工具调用，数量:", message.tool_calls.length);

      // 这里只处理第一个工具调用，通常只会有一个
      const toolCall = message.tool_calls[0];
      try {
        console.log("工具名称:", toolCall.function?.name);
        console.log("工具调用 ID:", toolCall.id);

        let parsedArgs: any = {};
        if (typeof toolCall.function?.arguments === "string") {
          try {
            parsedArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            console.warn("⚠️ 工具参数 JSON 解析失败，原始参数字符串为:", toolCall.function.arguments);
          }
        } else if (toolCall.function?.arguments) {
          parsedArgs = toolCall.function.arguments;
        }

        console.log("工具调用参数:", parsedArgs);
      } catch (logErr) {
        console.warn("⚠️ 记录 MCP 工具调用日志时出错:", logErr);
      }

      // Add assistant message with tool calls
      messages.push({
        role: "assistant",
        content: message.content || null,
        tool_calls: message.tool_calls
      });

      // Handle tool calls - 真正调用 bazi-mcp API 获取八字结果
      let toolResultContent: string;
      
      try {
        // 解析工具调用参数
        let parsedArgs: any = {};
        if (typeof toolCall.function?.arguments === "string") {
          try {
            parsedArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            console.warn("⚠️ 工具参数 JSON 解析失败:", e);
            parsedArgs = {};
          }
        } else if (toolCall.function?.arguments) {
          parsedArgs = toolCall.function.arguments;
        }

        console.log("正在调用 bazi-mcp API 获取八字结果...");
        
        // 调用后端 API 获取真实的八字计算结果
        // 使用相对路径，在生产环境中会自动解析为正确的 API 端点
        const apiUrl = import.meta.env.DEV 
          ? 'http://localhost:3000/api/bazi'  // 开发环境
          : '/api/bazi';  // 生产环境（Vercel 会自动处理）

        const baziResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            year: parsedArgs.year || input.birthYear,
            month: parsedArgs.month || parseInt(input.birthMonth),
            day: parsedArgs.day || parseInt(input.birthDay),
            hour: parsedArgs.hour !== undefined ? parsedArgs.hour : parseInt(input.birthHour || '0'),
            minute: parsedArgs.minute !== undefined ? parsedArgs.minute : parseInt(input.birthMinute || '0'),
            gender: parsedArgs.gender || (input.gender === Gender.MALE || input.gender === 'Male' ? 'male' : 'female'),
            calendarType: parsedArgs.calendarType || input.calendarType,
            birthPlace: parsedArgs.birthPlace || input.birthPlace
          })
        });

        if (!baziResponse.ok) {
          const errorText = await baziResponse.text();
          throw new Error(`Bazi API 调用失败: ${baziResponse.status} - ${errorText}`);
        }

        const baziResult = await baziResponse.json();
        console.log("✅ bazi-mcp API 调用成功，返回结果:", baziResult);

        // 将真实的八字结果格式化为模型可以理解的格式
        toolResultContent = JSON.stringify({
          success: true,
          fourPillars: baziResult.fourPillars,
          daYun: baziResult.daYun,
          metadata: baziResult.metadata,
          message: "八字计算完成。请基于以下准确的八字四柱和大运信息进行命理分析：\n" +
                   `年柱：${baziResult.fourPillars.year}\n` +
                   `月柱：${baziResult.fourPillars.month}\n` +
                   `日柱：${baziResult.fourPillars.day}\n` +
                   `时柱：${baziResult.fourPillars.hour}\n` +
                   `起运年龄：${baziResult.daYun.startAge}岁\n` +
                   `大运方向：${baziResult.daYun.direction}\n` +
                   `大运序列：${baziResult.daYun.sequence.join(' -> ')}`
        });

      } catch (apiError: any) {
        console.error("❌ bazi-mcp API 调用失败:", apiError);
        // 如果 API 调用失败，返回错误信息，但让模型继续处理
        toolResultContent = JSON.stringify({
          success: false,
          error: apiError.message,
          note: "⚠️ bazi-mcp API 调用失败，请根据工具调用参数（出生日期、时间、性别等），使用专业的八字计算方法，准确计算四柱干支和大运信息，然后基于计算结果进行命理分析。"
        });
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResultContent
      });

      try {
        const parsedResult = JSON.parse(toolResultContent);
        console.log("MCP 工具执行结果:", parsedResult);
        if (parsedResult.success) {
          console.log("✅ 八字计算结果已成功传递给模型");
        } else {
          console.warn("⚠️ 八字计算失败，模型将自行计算");
        }
      } catch {
        console.log("MCP 工具执行结果（原始字符串）:", toolResultContent);
      }
      console.groupEnd?.();

      // Second API call to get final result after tool execution
      messages.push({
        role: "user",
        content: "请基于 bazi MCP 工具的计算结果（或根据工具参数进行准确计算），完成命理分析和人生K线数据生成。必须使用准确的八字四柱和大运信息。"
      });

      // Use streaming for the final API call
      response = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          tools: [baziTool],
          tool_choice: "auto",
          temperature: 0.7,
          max_tokens: 65536,
          stream: true,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API 请求失败: ${response.status} - ${errText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      if (!reader) {
        throw new Error("无法读取流式响应");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.startsWith(':')) continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const chunk = JSON.parse(data);
              const delta = chunk.choices?.[0]?.delta;
              if (delta?.content) {
                fullContent += delta.content;
                // Call stream callback if provided
                if (input.onStream) {
                  input.onStream(fullContent);
                }
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim() && buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data !== '[DONE]') {
          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta;
            if (delta?.content) {
              fullContent += delta.content;
              if (input.onStream) {
                input.onStream(fullContent);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      message = { content: fullContent };
    } else {
      // No tool calls, use streaming for single API call
      console.warn("⚠️ 未检测到 MCP 工具调用，模型可能跳过了 get_bazi_detail 工具。");
      response = await fetch(`${apiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          tools: [baziTool],
          tool_choice: "auto",
          temperature: 0.7,
          max_tokens: 65536,
          stream: true,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API 请求失败: ${response.status} - ${errText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      if (!reader) {
        throw new Error("无法读取流式响应");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.startsWith(':')) continue;
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const chunk = JSON.parse(data);
              const delta = chunk.choices?.[0]?.delta;
              if (delta?.content) {
                fullContent += delta.content;
                // Call stream callback if provided
                if (input.onStream) {
                  input.onStream(fullContent);
                }
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim() && buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data !== '[DONE]') {
          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta;
            if (delta?.content) {
              fullContent += delta.content;
              if (input.onStream) {
                input.onStream(fullContent);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }

      message = { content: fullContent };
    }

    const content = message?.content;

    if (!content) {
      throw new Error("模型未返回任何内容。");
    }

    // Extract JSON from response
    // With response_format: json_object, the response should be pure JSON
    // But we still handle cases where markdown code blocks might be present
    let jsonContent = content.trim();

    // Try to extract content from ```json ... ``` blocks (fallback for edge cases)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    } else {
      // If no code block, try to find JSON object
      const jsonStartIndex = content.indexOf('{');
      const jsonEndIndex = content.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonContent = content.substring(jsonStartIndex, jsonEndIndex + 1);
      }
    }

    // Parse JSON with better error handling
    let data;
    try {
      data = JSON.parse(jsonContent);
    } catch (parseError: any) {
      // If JSON parsing fails, try to fix common issues
      console.error("JSON解析失败，尝试修复:", parseError);
      console.error("出错位置:", parseError.message);
      
      // Try fixing common JSON issues
      let fixedJson = fixJsonString(jsonContent);
      
      try {
        data = JSON.parse(fixedJson);
      } catch (fixError: any) {
        // If fixing didn't work, try to extract and show error context
        const errorPos = parseError.message.match(/position (\d+)/);
        if (errorPos) {
          const pos = parseInt(errorPos[1]);
          const start = Math.max(0, pos - 100);
          const end = Math.min(jsonContent.length, pos + 100);
          const context = jsonContent.substring(start, end);
          console.error("JSON错误上下文:", context);
          console.error("原始JSON长度:", jsonContent.length);
          console.error("原始JSON前500字符:", jsonContent.substring(0, 500));
        }
        
        // Last resort: try to extract the largest valid JSON object
        const jsonStartIndex = fixedJson.indexOf('{');
        const jsonEndIndex = fixedJson.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          try {
            let extractedJson = fixedJson.substring(jsonStartIndex, jsonEndIndex + 1);
            
            // Try to fix common syntax errors
            // Fix missing colons after property names (but be careful not to break valid JSON)
            // Pattern: "key" followed by space/newline but no colon
            extractedJson = extractedJson.replace(/"\s*(\n|\r)\s*"/g, '": null, "');
            extractedJson = extractedJson.replace(/"\s+"/g, '": null, "');
            
            // Try parsing again
            data = JSON.parse(extractedJson);
            console.warn("使用提取和修复的JSON片段成功解析");
          } catch (extractError: any) {
            // Show detailed error information for debugging
            const errorPos = parseError.message.match(/position (\d+)/);
            const pos = errorPos ? parseInt(errorPos[1]) : -1;
            
            let errorContext = '';
            if (pos > 0 && pos < jsonContent.length) {
              const start = Math.max(0, pos - 50);
              const end = Math.min(jsonContent.length, pos + 50);
              errorContext = `\n错误位置附近的内容: ${jsonContent.substring(start, end)}`;
            }
            
            // Final attempt: try to save the problematic JSON for debugging
            console.error("无法修复的JSON内容:", jsonContent.substring(0, 2000));
            
            throw new Error(
              `JSON解析失败: ${parseError.message}。` +
              (errorPos ? `\n错误位置: 第${errorPos[1]}个字符` : '') +
              errorContext +
              `\n\n请检查模型返回的数据格式。` +
              `\n如果问题持续，请尝试重新生成或检查API配置。`
            );
          }
        } else {
          throw new Error(
            `JSON解析失败: ${parseError.message}。` +
            `\n无法找到有效的JSON对象。` +
            `\n请检查模型返回的数据格式。`
          );
        }
      }
    }

    // Validate data completeness
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
        crypto: data.crypto || "暂无交易分析",
        cryptoScore: data.cryptoScore || 5,
        cryptoYear: data.cryptoYear || "待定",
        cryptoStyle: data.cryptoStyle || "现货定投",
      },
    };
  } catch (error) {
    console.error("GLM API Error:", error);
    throw error;
  }
};

