interface VerificationCode {
  code: string;
  phone: string;
  expiresAt: number;
}

const CODE_STORAGE_KEY = 'lifekline_verification_codes';
const CODE_EXPIRY_TIME = 300000; // 5分钟

class TencentSmsService {
  private getStoredCodes(): Map<string, VerificationCode> {
    try {
      const stored = localStorage.getItem(CODE_STORAGE_KEY);
      return stored ? new Map(JSON.parse(stored)) : new Map();
    } catch {
      return new Map();
    }
  }

  private saveCodes(codes: Map<string, VerificationCode>): void {
    try {
      const data = Array.from(codes.entries());
      localStorage.setItem(CODE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save verification codes:', error);
    }
  }

  private cleanExpiredCodes(codes: Map<string, VerificationCode>): void {
    const now = Date.now();
    const cleanedCodes = new Map<string, VerificationCode>();

    codes.forEach((value, key) => {
      if (value.expiresAt > now) {
        cleanedCodes.set(key, value);
      }
    });

    this.saveCodes(cleanedCodes);
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendSms(phone: string): Promise<{ success: boolean; message: string; code?: string }> {
    const secretId = import.meta.env.VITE_TENCENT_SECRET_ID;
    const secretKey = import.meta.env.VITE_TENCENT_SECRET_KEY;
    const appId = import.meta.env.VITE_TENCENT_SMS_APP_ID;
    const signName = import.meta.env.VITE_TENCENT_SMS_SIGN_NAME;
    const templateId = import.meta.env.VITE_TENCENT_SMS_TEMPLATE_ID;

    if (!secretId || !secretKey || !appId || !signName || !templateId) {
      return {
        success: false,
        message: '短信服务未配置，请检查环境变量',
      };
    }

    const code = this.generateCode();

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = Math.floor(Math.random() * 1000000);

      const params = {
        Action: 'SendSms',
        SecretId: secretId,
        Timestamp: timestamp.toString(),
        Nonce: nonce.toString(),
        Version: '2021-01-11',
        Region: 'ap-guangzhou',
        PhoneNumbers: `+86${phone}`,
        SmsSdkAppId: appId,
        SignName: signName,
        TemplateId: templateId,
        TemplateParamSet: [code],
      };

      const sortedParams = Object.entries(params)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      const signStr = `GETsms.tencentcloudapi.com/?${sortedParams}`;

      const signature = await this.hmacSha256(signStr, secretKey);

      const response = await fetch(
        `https://sms.tencentcloudapi.com/?${sortedParams}&Signature=${encodeURIComponent(signature)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const result = await response.json();

      if (result.Response && result.Response.Error) {
        console.error('Tencent SMS Error:', result.Response.Error);
        return {
          success: false,
          message: result.Response.Error.Message || '发送验证码失败',
        };
      }

      return {
        success: true,
        message: '验证码已发送',
        code,
      };
    } catch (error: any) {
      console.error('Failed to send SMS:', error);

      if (error.message?.includes('CORS')) {
        return {
          success: false,
          message: '由于浏览器CORS限制，请使用后端API发送短信',
        };
      }

      return {
        success: false,
        message: error.message || '发送验证码失败',
      };
    }
  }

  private async hmacSha256(message: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );

    return this.base64Encode(signature);
  }

  private base64Encode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }

  generateAndStoreCode(phone: string): string {
    const code = this.generateCode();
    const expiresAt = Date.now() + CODE_EXPIRY_TIME;

    const codes = this.getStoredCodes();
    this.cleanExpiredCodes(codes);

    codes.set(phone, {
      code,
      phone,
      expiresAt,
    });

    this.saveCodes(codes);
    return code;
  }

  verifyCode(phone: string, inputCode: string): boolean {
    const codes = this.getStoredCodes();
    this.cleanExpiredCodes(codes);

    const storedCode = codes.get(phone);

    if (!storedCode) {
      return false;
    }

    if (Date.now() > storedCode.expiresAt) {
      codes.delete(phone);
      this.saveCodes(codes);
      return false;
    }

    if (storedCode.code === inputCode) {
      codes.delete(phone);
      this.saveCodes(codes);
      return true;
    }

    return false;
  }

  async sendVerificationCode(phone: string): Promise<{ success: boolean; message: string }> {
    const code = this.generateAndStoreCode(phone);

    const secretId = import.meta.env.VITE_TENCENT_SECRET_ID;
    const secretKey = import.meta.env.VITE_TENCENT_SECRET_KEY;

    if (!secretId || !secretKey) {
      console.log(`[Mock Mode] 验证码已生成: ${code} (5分钟内有效)`);
      return {
        success: true,
        message: '验证码已生成（开发模式）',
      };
    }

    const result = await this.sendSms(phone);

    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    console.log(`[SMS Sent] 验证码已发送到 ${phone}: ${code}`);
    return {
      success: true,
      message: '验证码已发送',
    };
  }
}

export const tencentSmsService = new TencentSmsService();