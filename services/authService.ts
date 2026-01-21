import { LoginResponse, SendCodeResponse, AuthState, User, LoginType } from '../types';
import { tencentSmsService } from './tencentSmsService';
import { databaseService } from './databaseService';

const AUTH_STORAGE_KEY = 'lifekline_auth';

class AuthService {
  private authState: AuthState | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        this.authState = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    }
  }

  private saveToStorage(): void {
    if (this.authState) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.authState));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  getAuthState(): AuthState {
    return this.authState || { isAuthenticated: false, user: null, token: null };
  }

  isAuthenticated(): boolean {
    return this.getAuthState().isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.getAuthState().user;
  }

  getToken(): string | null {
    return this.getAuthState().token;
  }

  async sendVerificationCode(phone: string): Promise<SendCodeResponse> {
    if (!this.validatePhone(phone)) {
      return {
        success: false,
        message: '手机号格式不正确',
      };
    }

    const result = await tencentSmsService.sendVerificationCode(phone);

    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    return {
      success: true,
      message: result.message,
      countdown: 60,
    };
  }

  private validatePhone(phone: string): boolean {
    const phoneReg = /^1[3-9]\d{9}$/;
    return phoneReg.test(phone);
  }

  async loginWithPhone(phone: string, code: string): Promise<LoginResponse> {
    if (!this.validatePhone(phone)) {
      return {
        success: false,
        user: {} as User,
        token: '',
        message: '手机号格式不正确',
      };
    }

    const isValid = tencentSmsService.verifyCode(phone, code);

    if (!isValid) {
      return {
        success: false,
        user: {} as User,
        token: '',
        message: '验证码错误或已过期',
      };
    }

    let existingUser = await databaseService.getUserByPhone(phone);

    if (!existingUser) {
      const newUser: User = {
        id: `user_${Date.now()}`,
        phone,
        nickname: `用户${phone.slice(-4)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${phone}`,
        loginType: LoginType.PHONE,
        createdAt: new Date().toISOString(),
        login_type: 'phone',
      };

      await databaseService.createUser(newUser);
      existingUser = newUser;
    }

    const token = `sms_token_${Date.now()}_${Math.random().toString(36).substr(2)}`;

    this.authState = {
      isAuthenticated: true,
      user: existingUser,
      token,
    };

    this.saveToStorage();

    return {
      success: true,
      user: existingUser,
      token,
      message: '登录成功',
    };
  }

  async initWeChatH5Login(): Promise<void> {
    const appId = import.meta.env.VITE_WECHAT_APP_ID || '';
    const redirectUri = encodeURIComponent(window.location.origin + '/wechat-callback');
    const scope = 'snsapi_userinfo';
    const state = Date.now().toString();

    if (!appId) {
      console.warn('未配置微信App ID，请检查环境变量 VITE_WECHAT_APP_ID');
      await this.mockWeChatLogin();
      return;
    }

    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`;
    window.location.href = authUrl;
  }

  private async mockWeChatLogin(): Promise<void> {
    const user: User = {
      id: `wechat_user_${Date.now()}`,
      openid: `mock_openid_${Date.now()}`,
      nickname: '微信用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat',
      loginType: LoginType.WECHAT,
      createdAt: new Date().toISOString(),
      login_type: 'wechat',
    };

    const existingUser = await databaseService.getUserById(user.id);
    if (!existingUser) {
      await databaseService.createUser(user);
    }

    const token = `mock_wechat_token_${Date.now()}_${Math.random().toString(36).substr(2)}`;

    this.authState = {
      isAuthenticated: true,
      user,
      token,
    };

    this.saveToStorage();
  }

  async handleWeChatCallback(code: string, _state: string): Promise<LoginResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user: User = {
      id: `wechat_user_${Date.now()}`,
      openid: `openid_${code.substring(0, 8)}`,
      nickname: '微信用户',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat',
      loginType: LoginType.WECHAT,
      createdAt: new Date().toISOString(),
      login_type: 'wechat',
    };

    const existingUser = await databaseService.getUserById(user.id);
    if (!existingUser) {
      await databaseService.createUser(user);
    }

    const token = `wechat_token_${Date.now()}_${Math.random().toString(36).substr(2)}`;

    this.authState = {
      isAuthenticated: true,
      user,
      token,
    };

    this.saveToStorage();

    return {
      success: true,
      user,
      token,
      message: '微信登录成功',
    };
  }

  logout(): void {
    this.authState = null;
    this.saveToStorage();
    window.location.href = '/';
  }
}

export const authService = new AuthService();