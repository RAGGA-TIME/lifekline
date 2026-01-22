import { User } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const WECHAT_APP_ID = import.meta.env.VITE_WECHAT_APP_ID || 'wx89b6c639648af584';
const WECHAT_APP_SECRET = import.meta.env.VITE_WECHAT_APP_SECRET || '';

class ApiService {
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`API请求错误 [${endpoint}]:`, error);
      throw error;
    }
  }

  async createUser(user: User): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/users', {
      method: 'POST',
      body: JSON.stringify({
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        openid: user.openid,
        login_type: user.login_type,
      }),
    });
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      return await this.request<User>(`/users/${userId}`);
    } catch {
      return null;
    }
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    try {
      return await this.request<User>(`/users/phone/${phone}`);
    } catch {
      return null;
    }
  }

  async getRemainingQuota(userId: string): Promise<number> {
    try {
      const response = await this.request<{ remaining: number }>(`/quota/${userId}`);
      return response.remaining || 0;
    } catch {
      return 0;
    }
  }

  async useFreeQuota(userId: string): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>(`/quota/use`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      return response.success || false;
    } catch {
      return false;
    }
  }

  async canShareForQuota(userId: string): Promise<boolean> {
    try {
      const response = await this.request<{ canShare: boolean }>(`/quota/can-share/${userId}`);
      return response.canShare || false;
    } catch {
      return false;
    }
  }

  async shareForQuota(userId: string, platform?: string): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean; message: string }>(`/quota/share`, {
        method: 'POST',
        body: JSON.stringify({ userId, platform }),
      });
      return response.success || false;
    } catch {
      return false;
    }
  }

  async getTodayShareStatus(userId: string): Promise<{
    canShare: boolean;
    lastShareDate: Date | null;
  }> {
    try {
      const response = await this.request<{
        canShare: boolean;
        lastShareDate: string | null;
      }>(`/api/quota/share-status/${userId}`);
      return {
        canShare: response.canShare || false,
        lastShareDate: response.lastShareDate ? new Date(response.lastShareDate) : null,
      };
    } catch {
      return { canShare: false, lastShareDate: null };
    }
  }

  async wechatLogin(code: string): Promise<{
    success: boolean;
    user: User | null;
    token: string;
    message: string;
  }> {
    try {
      return await this.request<{
        success: boolean;
        user: User | null;
        token: string;
        message: string;
      }>(`/api/wechat/login`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
    } catch (error: any) {
      console.error('微信登录失败:', error);
      return {
        success: false,
        user: null,
        token: '',
        message: error.message || '微信登录失败',
      };
    }
  }
}
  }

  async recordUsage(userId: string, usageType: 'free' | 'share' | 'paid', count: number, remark?: string): Promise<void> {
    try {
      await this.request(`/usage`, {
        method: 'POST',
        body: JSON.stringify({ userId, usageType, count, remark }),
      });
    } catch (error) {
      console.error('记录使用失败:', error);
    }
  }

  async recordShare(userId: string, shareDate: Date, platform?: string): Promise<void> {
    try {
      await this.request(`/share`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          shareDate: shareDate.toISOString().split('T')[0],
          platform,
        }),
      });
    } catch (error) {
      console.error('记录分享失败:', error);
    }
  }
}

export const apiService = new ApiService();
