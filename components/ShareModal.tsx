import React, { useState, useEffect } from 'react';
import { Share2, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { databaseService } from '../services/databaseService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onShareSuccess: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, userId, onShareSuccess }) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const url = `${window.location.origin}?ref=${userId}`;
      setShareUrl(url);
      setShareResult(null);
      setCopied(false);
    }
  }, [isOpen, userId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleShare = async (platform?: string) => {
    setSharing(true);
    setShareResult(null);

    try {
      const success = await databaseService.shareForQuota(userId, platform);

      if (success) {
        setShareResult({
          success: true,
          message: '分享成功！已获得1次免费使用次数',
        });
        setTimeout(() => {
          onShareSuccess();
          onClose();
        }, 2000);
      } else {
        const status = await databaseService.getTodayShareStatus(userId);
        if (!status.canShare && status.lastShareDate) {
          setShareResult({
            success: false,
            message: `今日已分享过，明天再来吧`,
          });
        } else {
          setShareResult({
            success: false,
            message: '分享失败，请稍后重试',
          });
        }
      }
    } catch (error) {
      console.error('分享失败:', error);
      setShareResult({
        success: false,
        message: '分享失败，请稍后重试',
      });
    } finally {
      setSharing(false);
    }
  };

  const handleWeChatShare = () => {
    handleShare('wechat');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">分享获取免费次数</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-indigo-700">分享福利：</span>
              每天分享一次可获得1次免费生成K线次数
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-sm text-gray-600 mb-2">分享链接</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-600"
              />
              <button
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1 inline" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1 inline" />
                    复制
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-3">快速分享到</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleWeChatShare}
                disabled={sharing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xl">💬</span>
                <span className="font-medium">微信</span>
              </button>
              <button
                onClick={() => handleShare('weibo')}
                disabled={sharing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xl">📱</span>
                <span className="font-medium">微博</span>
              </button>
              <button
                onClick={() => handleShare('qq')}
                disabled={sharing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-xl">🐧</span>
                <span className="font-medium">QQ</span>
              </button>
              <button
                onClick={() => handleShare('other')}
                disabled={sharing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Share2 className="w-4 h-4" />
                <span className="font-medium">其他</span>
              </button>
            </div>
          </div>

          {shareResult && (
            <div
              className={`flex items-center gap-2 p-4 rounded-lg ${
                shareResult.success
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {shareResult.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium">{shareResult.message}</p>
            </div>
          )}

          {sharing && (
            <div className="flex items-center justify-center gap-2 text-indigo-600">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">正在分享...</span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            点击任意分享按钮即可获得免费次数
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;