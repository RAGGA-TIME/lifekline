
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export interface UserInput {
  name?: string;
  gender: Gender;
  birthYear: string;   // 出生年份 (如 1990)
  birthMonth: string;  // 出生月份 (如 05)
  birthDay: string;    // 出生日期 (如 21)
  birthHour: string;   // 出生小时 (如 14)
  birthMinute: string;  // 出生分钟 (如 30)
  calendarType: 'solar' | 'lunar'; // 阳历/阴历
  birthPlace?: string; // 出生地 (可选)
  yearPillar: string;  // 年柱 (由AI计算)
  monthPillar: string; // 月柱 (由AI计算)
  dayPillar: string;   // 日柱 (由AI计算)
  hourPillar: string;  // 时柱 (由AI计算)
  startAge: string;    // 起运年龄 (虚岁) (由AI计算)
  firstDaYun: string;  // 第一步大运干支 (由AI计算)
  
  // New API Configuration Fields
  modelName: string;   // 使用的模型名称
  apiBaseUrl: string;
  apiKey: string;
}

export interface KLinePoint {
  age: number;
  year: number;
  ganZhi: string; // 当年的流年干支 (如：甲辰)
  daYun?: string; // 当前所在的大运（如：甲子大运），用于图表标记
  open: number;
  close: number;
  high: number;
  low: number;
  score: number;
  reason: string; // 这里现在需要存储详细的流年描述
}

export interface AnalysisData {
  bazi: string[]; // [Year, Month, Day, Hour] pillars
  summary: string;
  summaryScore: number; // 0-10
  
  personality: string;      // 性格分析
  personalityScore: number; // 0-10
  
  industry: string;
  industryScore: number; // 0-10

  fengShui: string;       // 发展风水 (New)
  fengShuiScore: number;  // 0-10 (New)
  
  wealth: string;
  wealthScore: number; // 0-10
  
  marriage: string;
  marriageScore: number; // 0-10
  
  health: string;
  healthScore: number; // 0-10
  
  family: string;
  familyScore: number; // 0-10

  // Crypto / Web3 Specifics
  crypto: string;       // 币圈交易分析
  cryptoScore: number;  // 投机运势评分
  cryptoYear: string;   // 暴富流年 (e.g., 2025 乙巳)
  cryptoStyle: string;  // 适合流派 (现货/合约/链上Alpha)
}

export interface LifeDestinyResult {
  chartData: KLinePoint[];
  analysis: AnalysisData;
}

export enum LoginType {
  PHONE = 'phone',
  WECHAT = 'wechat',
}

export interface User {
  id: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  openid?: string;
  loginType: LoginType;
  createdAt: string;
  login_type?: 'phone' | 'wechat';
  created_at?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface LoginCredentials {
  type: LoginType;
  phone?: string;
  code?: string;
  openid?: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

export interface SendCodeResponse {
  success: boolean;
  message: string;
  countdown?: number;
}
