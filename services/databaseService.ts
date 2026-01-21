import { apiService } from './apiService';
import { User } from '../types';

interface UserFreeQuota {
  user_id: string;
  remaining_count: number;
  last_share_date?: Date | null;
  created_at?: string;
  updated_at?: string;
}

interface UsageRecord {
  user_id: string;
  usage_type: 'free' | 'share' | 'paid';
  usage_count: number;
  used_at?: string;
  remark?: string;
}

class DatabaseService {
  private localStorageBackupEnabled: boolean = true;

  constructor() {
    this.checkLocalStorageAvailability();
  }

  private checkLocalStorageAvailability(): void {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      this.localStorageBackupEnabled = true;
    } catch {
      this.localStorageBackupEnabled = false;
      console.warn('LocalStorage不可用');
    }
  }

  async createUser(user: User): Promise<boolean> {
    try {
      const result = await apiService.createUser(user);
      if (result.success) {
        if (this.localStorageBackupEnabled) {
          this.saveToLocalStorage('users', user.id, user);
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('创建用户失败:', error);
      return false;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await apiService.getUserById(userId);
      if (user && this.localStorageBackupEnabled) {
        this.saveToLocalStorage('users', userId, user);
      }
      return user;
    } catch (error: any) {
      console.error('获取用户失败:', error);
      if (this.localStorageBackupEnabled) {
        return this.getFromLocalStorage('users', userId);
      }
      return null;
    }
  }

  async getUserByPhone(phone: string): Promise<User | null> {
    try {
      const user = await apiService.getUserByPhone(phone);
      if (user && this.localStorageBackupEnabled) {
        this.saveToLocalStorage('users', phone, user, 'phone');
      }
      return user;
    } catch (error: any) {
      console.error('获取用户失败:', error);
      if (this.localStorageBackupEnabled) {
        return this.getFromLocalStorage('users', phone, 'phone');
      }
      return null;
    }
  }

  async getRemainingQuota(userId: string): Promise<number> {
    try {
      return await apiService.getRemainingQuota(userId);
    } catch (error: any) {
      console.error('获取剩余次数失败:', error);
      if (this.localStorageBackupEnabled) {
        const quota = this.getFromLocalStorage('user_free_quota', userId);
        return quota?.remaining_count || 0;
      }
      return 0;
    }
  }

  async useFreeQuota(userId: string): Promise<boolean> {
    try {
      const success = await apiService.useFreeQuota(userId);
      if (success) {
        await apiService.recordUsage(userId, 'free', 1, '生成K线消耗1次免费次数');

        if (this.localStorageBackupEnabled) {
          const quota = await this.getQuotaFromStorage(userId);
          if (quota && quota.remaining_count > 0) {
            quota.remaining_count -= 1;
            quota.updated_at = new Date().toISOString();
            this.saveToLocalStorage('user_free_quota', userId, quota);
          }
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('使用免费次数失败:', error);
      return false;
    }
  }

  async canShareForQuota(userId: string): Promise<boolean> {
    try {
      return await apiService.canShareForQuota(userId);
    } catch (error: any) {
      console.error('检查分享状态失败:', error);
      return false;
    }
  }

  async shareForQuota(userId: string, platform?: string): Promise<boolean> {
    try {
      const success = await apiService.shareForQuota(userId, platform);

      if (success) {
        await apiService.recordShare(userId, new Date(), platform);
        await apiService.recordUsage(userId, 'share', 1, '分享获得1次免费次数');

        if (this.localStorageBackupEnabled) {
          const quota = await this.getQuotaFromStorage(userId);
          if (quota) {
            quota.remaining_count += 1;
            quota.last_share_date = new Date();
            quota.updated_at = new Date().toISOString();
            this.saveToLocalStorage('user_free_quota', userId, quota);
          }

          const records = this.getFromLocalStorage('share_records', userId, 'array') || [];
          records.push({
            user_id: userId,
            share_date: new Date().toISOString().split('T')[0],
            share_time: new Date().toISOString(),
            share_platform: platform,
          });
          this.saveToLocalStorage('share_records', userId, records);
        }
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('分享获取免费次数失败:', error);
      return false;
    }
  }

  async recordUsage(userId: string, usageType: UsageRecord['usage_type'], count: number, remark?: string): Promise<void> {
    try {
      await apiService.recordUsage(userId, usageType, count, remark);
    } catch (error) {
      console.error('记录使用失败:', error);
    }
  }

  async getTodayShareStatus(userId: string): Promise<{ canShare: boolean; lastShareDate: Date | null }> {
    try {
      const status = await apiService.getTodayShareStatus(userId);
      return status;
    } catch (error: any) {
      console.error('获取今日分享状态失败:', error);
      return { canShare: false, lastShareDate: null };
    }
  }

  private async getQuotaFromStorage(userId: string): Promise<UserFreeQuota | null> {
    if (this.localStorageBackupEnabled) {
      return this.getFromLocalStorage('user_free_quota', userId);
    }
    return null;
  }

  private saveToLocalStorage(tableName: string, key: string, data: any, searchKey?: string): void {
    try {
      const storageKey = `lifekline_db_${tableName}`;
      const stored = localStorage.getItem(storageKey);
      const table: Record<string, any> = stored ? JSON.parse(stored) : {};

      if (searchKey) {
        const index = table[`_index_${searchKey}`] || {};
        index[key] = data;
        table[`_index_${searchKey}`] = index;
      } else {
        table[key] = data;
      }

      localStorage.setItem(storageKey, JSON.stringify(table));
    } catch (error) {
      console.error('保存到LocalStorage失败:', error);
    }
  }

  private getFromLocalStorage(tableName: string, key: string, searchKey?: string, expectedType?: string): any {
    try {
      const storageKey = `lifekline_db_${tableName}`;
      const stored = localStorage.getItem(storageKey);

      if (!stored) return null;

      const table: Record<string, any> = JSON.parse(stored);
      const data = searchKey
        ? table[`_index_${searchKey}`]?.[key]
        : table[key];

      if (expectedType === 'array') {
        return Array.isArray(data) ? data : null;
      }

      return data;
    } catch (error) {
      console.error('从LocalStorage读取失败:', error);
      return null;
    }
  }
}

export const databaseService = new DatabaseService();
