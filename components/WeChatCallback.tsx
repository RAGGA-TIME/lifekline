import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Loader2, CheckCircle2, XCircle, User, LogOut } from 'lucide-react';

const WeChatCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在处理微信登录...');
  const [userData, setUserData] = useState<{ nickname?: string; avatar?: string } | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        setStatus('error');
        setMessage('未获取到授权码，请重新登录');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        const result = await authService.handleWeChatCallback(code, state || '');

        if (result.success) {
          setStatus('success');
          setMessage('登录成功，正在跳转...');

          if (result.user.nickname) {
            setUserData({
              nickname: result.user.nickname,
              avatar: result.user.avatar,
            });
          }

          setTimeout(() => navigate('/'), 1500);
        } else {
          setStatus('error');
          setMessage(result.message || '登录失败');
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || '登录失败，请重试');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      authService.logout();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="space-y-6">
            <Loader2 className="w-16 h-16 text-indigo-600 mx-auto animate-spin" />
            <h2 className="text-2xl font-bold text-gray-800">处理中</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800">登录成功</h2>
            <p className="text-gray-600">{message}</p>
            
            {userData && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100 space-y-3">
                {userData.avatar && (
                  <div className="flex justify-center mb-4">
                    <img
                      src={userData.avatar}
                      alt="头像"
                      className="w-20 h-20 rounded-full border-2 border-green-200"
                    />
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <User className="w-5 h-5 text-indigo-600" />
                  <span className="text-lg font-bold">{userData.nickname || '用户'}</span>
                </div>
                <p className="text-sm text-gray-500">欢迎来到人生K线</p>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800">登录失败</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">3秒后自动返回首页...</p>
            
            <button
              onClick={() => navigate('/')}
              className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              立即返回
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeChatCallback;