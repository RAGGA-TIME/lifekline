import React, { useState } from 'react';
import { authService } from '../services/authService';
import { Loader2, Smartphone, MessageSquare, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'phone' | 'wechat'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (countdown > 0) return;

    setError(null);

    const result = await authService.sendVerificationCode(phone);

    if (!result.success) {
      setError(result.message);
      return;
    }

    let currentCountdown = result.countdown || 60;
    setCountdown(currentCountdown);

    const timer = setInterval(() => {
      currentCountdown--;
      setCountdown(currentCountdown);

      if (currentCountdown <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await authService.loginWithPhone(phone, code);

      if (!result.success) {
        setError(result.message || '发送验证码失败');
        return;
      }

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeChatLogin = () => {
    setIsLoading(true);
    authService.initWeChatH5Login();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold font-serif-sc mb-2">欢迎来到人生K线</h1>
          <p className="text-sm opacity-90">登录后查看您的命理分析</p>
        </div>

        <div className="p-6">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'phone'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              手机号登录
            </button>
            <button
              onClick={() => setActiveTab('wechat')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'wechat'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              微信登录
            </button>
          </div>

          {activeTab === 'phone' && (
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">手机号码</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    maxLength={11}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">验证码</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="验证码"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0 || phone.length !== 11}
                    className={`px-4 py-3 rounded-lg font-medium text-sm transition ${
                      countdown > 0 || phone.length !== 11
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
                {countdown === 0 && phone.length === 11 && (
                  <p className="text-xs text-gray-500 mt-2">
                    未配置短信服务：验证码会在浏览器控制台输出（按F12查看）
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !phone || !code}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>登录中...</span>
                  </>
                ) : (
                  <>
                    <span>登录</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'wechat' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.5 14.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5-2.5 5.5-5.5 5.5-5.5-2.5-5.5-5.5z" />
                    <path d="M12 2C6.5 2 2 5.6 2 10c0 2.4 1.6 4.5 4.1 5.9-.4 1.5-1.4 3-1.5 3-.1.1-.1.4.1.5.1.1.4.2.5.1.6-.3 2.5-1.1 3.6-1.8.7.1 1.4.2 2.2.2 5.5 0 10-3.6 10-8 0-4.4-4.5-8-10-8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">微信一键登录</h3>
                <p className="text-sm text-gray-600 mb-4">安全、快捷的登录方式</p>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-indigo-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">正在跳转微信授权...</span>
                </div>
              )}

              <button
                onClick={handleWeChatLogin}
                disabled={isLoading}
                className="w-full bg-green-500 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg hover:bg-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.5 14.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5-2.5 5.5-5.5 5.5-5.5-2.5-5.5-5.5z" />
                  <path d="M12 2C6.5 2 2 5.6 2 10c0 2.4 1.6 4.5 4.1 5.9-.4 1.5-1.4 3-1.5 3-.1.1-.1.4.1.5.1.1.4.2.5.1.6-.3 2.5-1.1 3.6-1.8.7.1 1.4.2 2.2.2 5.5 0 10-3.6 10-8 0-4.4-4.5-8-10-8z" />
                </svg>
                <span>微信登录</span>
              </button>

              <p className="text-xs text-gray-500 text-center">
                演示模式：点击将使用Mock数据登录
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            登录即表示同意《用户协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;