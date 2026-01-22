
import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LifeKLineChart from './components/LifeKLineChart';
import AnalysisResult from './components/AnalysisResult';
import ConfirmDataMode from './components/ConfirmDataMode';
import Login from './components/Login';
import WeChatCallback from './components/WeChatCallback';
import ShareModal from './components/ShareModal';
import { authService } from './services/authService';
import { databaseService } from './services/databaseService';
import { LifeDestinyResult } from './types';
import { Sparkles, AlertCircle, Download, Printer, Trophy, FileDown, LogOut, User, LogIn, Share2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<LifeDestinyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [remainingQuota, setRemainingQuota] = useState<number>(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    const fetchQuota = async () => {
      if (currentUser) {
        const quota = await databaseService.getRemainingQuota(currentUser.id);
        setRemainingQuota(quota);
      }
    };
    fetchQuota();
  }, [currentUser]);

  const handleDataImport = (data: LifeDestinyResult) => {
    setResult(data);
    setUserName('');
    setError(null);
  };

  const handleExportJson = () => {
    if (!result) return;

    const exportData = {
      userId: currentUser?.id,
      userName: currentUser?.nickname,
      bazi: result.analysis.bazi,
      summary: result.analysis.summary,
      summaryScore: result.analysis.summaryScore,
      personality: result.analysis.personality,
      personalityScore: result.analysis.personalityScore,
      industry: result.analysis.industry,
      industryScore: result.analysis.industryScore,
      fengShui: result.analysis.fengShui,
      fengShuiScore: result.analysis.fengShuiScore,
      wealth: result.analysis.wealth,
      wealthScore: result.analysis.wealthScore,
      marriage: result.analysis.marriage,
      marriageScore: result.analysis.marriageScore,
      health: result.analysis.health,
      healthScore: result.analysis.healthScore,
      family: result.analysis.family,
      familyScore: result.analysis.familyScore,
      crypto: result.analysis.crypto,
      cryptoScore: result.analysis.cryptoScore,
      cryptoYear: result.analysis.cryptoYear,
      cryptoStyle: result.analysis.cryptoStyle,
      chartPoints: result.chartData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `命理分析_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveHtml = () => {
    if (!result) return;

    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const chartContainer = document.querySelector('.recharts-surface');
    const chartSvg = chartContainer ? chartContainer.outerHTML : '<div style="padding:20px;text-align:center;">图表导出失败，请截图保存</div>';

    const analysisContainer = document.getElementById('analysis-result-container');
    const analysisHtml = analysisContainer ? analysisContainer.innerHTML : '';

    const tableRows = result.chartData.map(item => {
      const scoreColor = item.close >= item.open ? 'text-green-600' : 'text-red-600';
      const trendIcon = item.close >= item.open ? '▲' : '▼';
      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td class="p-3 border-r border-gray-100 text-center font-mono">${item.age}岁</td>
          <td class="p-3 border-r border-gray-100 text-center font-bold">${item.year} ${item.ganZhi}</td>
          <td class="p-3 border-r border-gray-100 text-center text-sm">${item.daYun || '-'}</td>
          <td class="p-3 border-r border-gray-100 text-center font-bold ${scoreColor}">
            ${item.score} <span class="text-xs">${trendIcon}</span>
          </td>
          <td class="p-3 text-sm text-gray-700 text-justify leading-relaxed">${item.reason}</td>
        </tr>
      `;
    }).join('');

    const detailedTableHtml = `
      <div class="mt-12 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
           <div class="w-1 h-5 bg-indigo-600 rounded-full"></div>
           <h3 class="text-xl font-bold text-gray-800 font-serif-sc">流年详批全表</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-100 text-gray-600 text-sm font-bold uppercase tracking-wider">
                <th class="p-3 border-r border-gray-200 text-center w-20">年龄</th>
                <th class="p-3 border-r border-gray-200 text-center w-28">流年</th>
                <th class="p-3 border-r border-gray-200 text-center w-28">大运</th>
                <th class="p-3 border-r border-gray-200 text-center w-20">评分</th>
                <th class="p-3">运势批断与建议</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const fullHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentUser?.nickname || userName || '用户'} - 人生K线命理报告</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Inter:wght@400;600&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #f8f9fa; }
    .font-serif-sc { font-family: 'Noto Serif SC', serif; }
    svg { width: 100% !important; height: auto !important; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen p-4 md:p-12">
  <div class="max-w-6xl mx-auto space-y-10">

    <div class="text-center border-b border-gray-200 pb-8">
      <h1 class="text-4xl font-bold font-serif-sc text-gray-900 mb-2">${userName ? userName + '的' : ''}人生K线命理报告</h1>
      <p class="text-gray-500 text-sm">生成时间：${timeString}</p>
    </div>

    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div class="flex items-center gap-2 mb-6">
        <div class="w-1 h-6 bg-indigo-600 rounded-full"></div>
        <h3 class="text-xl font-bold text-gray-800 font-serif-sc">流年大运走势图</h3>
      </div>
      <div class="w-full overflow-hidden flex justify-center py-4">
        ${chartSvg}
      </div>
      <p class="text-center text-xs text-gray-400 mt-2">注：图表K线颜色根据运势涨跌绘制，数值越高代表运势越强。</p>
    </div>

    <div class="space-y-8">
       ${analysisHtml}
    </div>

    ${detailedTableHtml}

    <div class="text-center text-gray-400 text-sm py-12 border-t border-gray-200 mt-12">
      <p>&copy; ${now.getFullYear()} 人生K线项目 | 仅供娱乐与文化研究，请勿迷信</p>
    </div>

  </div>
</body>
</html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentUser?.nickname || userName || 'User'}_Life_Kline_Report_${now.getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const peakYearItem = useMemo(() => {
    if (!result || !result.chartData.length) return null;
    return result.chartData.reduce((prev, current) => (prev.high > current.high) ? prev : current);
  }, [result]);

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      authService.logout();
      window.location.reload();
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <header className="w-full bg-white border-b border-gray-200 py-6 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif-sc font-bold text-gray-900 tracking-wide">人生K线</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Life Destiny K-Line</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4 text-amber-500" />
              基于 AI 大模型驱动
            </div>
            {currentUser ? (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700">{currentUser.nickname}</span>
                  <button
                    onClick={handleLogout}
                    className="ml-1 text-indigo-400 hover:text-indigo-600 transition-colors"
                    title="退出登录"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 md:gap-2 bg-green-500 text-white px-2 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium hover:bg-green-600 transition-colors"
                  title="分享获取免费次数"
                >
                  <Share2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">分享</span>
                  <span className="font-bold">{remainingQuota}</span>
                  <span className="hidden sm:inline">次</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-1.5 md:gap-2 bg-indigo-600 text-white px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">登录</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-12">
        {!result && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-fade-in">
            <div className="text-center max-w-2xl flex flex-col items-center">
              <h2 className="text-4xl md:text-5xl font-serif-sc font-bold text-gray-900 mb-6">
                洞悉命运起伏 <br />
                <span className="text-indigo-600">预见人生轨迹</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                结合<strong>传统八字命理</strong>与<strong>金融可视化技术</strong>，
                将您的一生运势绘制成类似股票行情的K线图。
              </p>
            </div>

            <ConfirmDataMode onDataImport={handleDataImport} />

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100 max-w-md w-full animate-bounce-short">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className="animate-fade-in space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center border-b border-gray-200 pb-4 gap-4">
              <h2 className="text-2xl font-bold font-serif-sc text-gray-800">
                {currentUser?.nickname || userName}的命盘分析报告
              </h2>

              <div className="flex flex-wrap gap-3 no-print">
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white border border-emerald-600 rounded-lg hover:bg-emerald-700 transition-all font-medium text-sm shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  导出JSON
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  保存PDF
                </button>
                <button
                  onClick={handleSaveHtml}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  保存网页
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
                >
                  ← 重新排盘
                </button>
              </div>
            </div>

            <section className="space-y-4 break-inside-avoid">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                  <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                  流年大运走势图 (100年)
                </h3>
                {peakYearItem && (
                  <p className="text-sm font-bold text-indigo-800 bg-indigo-50 border border-indigo-100 rounded px-2 py-1 inline-flex items-center gap-2 self-start mt-1">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    人生巅峰年份：{peakYearItem.year}年 ({peakYearItem.ganZhi}) - {peakYearItem.age}岁，评分 <span className="text-amber-600 text-lg">{peakYearItem.high}</span>
                  </p>
                )}
              </div>

              <p className="text-sm text-gray-500 mb-2 no-print">
                <span className="text-green-600 font-bold">绿色K线</span> 代表运势上涨（吉），
                <span className="text-red-600 font-bold">红色K线</span> 代表运势下跌（凶）。
                <span className="text-red-500 font-bold">★</span> 标记为全盘最高运势点。
              </p>
              <LifeKLineChart data={result.chartData} />
            </section>

            <section id="analysis-result-container">
              <AnalysisResult analysis={result.analysis} />
            </section>

            <div className="hidden print:block mt-8 break-before-page">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-800 font-serif-sc">流年详批全表</h3>
              </div>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wider">
                    <th className="p-2 border border-gray-200 text-center w-16">年龄</th>
                    <th className="p-2 border border-gray-200 text-center w-24">流年</th>
                    <th className="p-2 border border-gray-200 text-center w-24">大运</th>
                    <th className="p-2 border border-gray-200 text-center w-16">评分</th>
                    <th className="p-2 border border-gray-200">运势批断</th>
                  </tr>
                </thead>
                <tbody>
                  {result.chartData.map((item) => (
                    <tr key={item.age} className="border-b border-gray-100 break-inside-avoid">
                      <td className="p-2 border border-gray-100 text-center font-mono">{item.age}</td>
                      <td className="p-2 border border-gray-100 text-center font-bold">{item.year} {item.ganZhi}</td>
                      <td className="p-2 border border-gray-100 text-center">{item.daYun || '-'}</td>
                      <td className={`p-2 border border-gray-100 text-center font-bold ${item.close >= item.open ? 'text-green-600' : 'text-red-600'}`}>
                        {item.score}
                      </td>
                      <td className="p-2 border border-gray-100 text-gray-700 text-justify text-xs leading-relaxed">
                        {item.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 pt-4 border-t border-gray-200 flex justify-center items-center text-xs text-gray-500">
                <span>生成时间：{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </main>

       <footer className="w-full bg-gray-900 text-gray-400 py-8 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} 人生K线 | 仅供娱乐与文化研究，请勿迷信</p>
        </div>
      </footer>

      {currentUser && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          userId={currentUser.id}
          onShareSuccess={async () => {
            const quota = await databaseService.getRemainingQuota(currentUser.id);
            setRemainingQuota(quota);
          }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/login" element={<Login onLoginSuccess={() => navigate('/')} />} />
      <Route path="/wechat-callback" element={<WeChatCallback />} />
      <Route path="/*" element={<MainContent />} />
    </Routes>
  );
};

export default App;