import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const WeChatCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('正在处理微信登录...');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 text-indigo-600 mx-auto animate-spin" />
            <h2 className="text-xl font-bold text-gray-800">处理中</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">登录成功</h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-800">登录失败</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">3秒后自动返回首页...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeChatCallback;