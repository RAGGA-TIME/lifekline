import React, { useState, useEffect, useRef } from 'react';
import { LifeDestinyResult, Gender } from '../types';
import { CheckCircle, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { generateLifeAnalysisWithGLM } from '../services/glmService';
import { getBaziDetail } from 'bazi-mcp';

interface ConfirmDataModeProps {
    onDataImport: (data: LifeDestinyResult) => void;
}

const ConfirmDataMode: React.FC<ConfirmDataModeProps> = ({ onDataImport }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [baziInfo, setBaziInfo] = useState({
        name: '',
        gender: 'Male' as 'Male' | 'Female',
        birthYear: '',
        birthMonth: '',
        birthDay: '',
        birthHour: '',
        birthMinute: '',
        calendarType: 'solar' as 'solar' | 'lunar',
        birthPlace: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string>('');
    const [streamingText, setStreamingText] = useState<string>('');
    const streamingRef = useRef<HTMLDivElement>(null);
    
    // 八字计算相关状态
    const [baziResult, setBaziResult] = useState<any>(null);
    const [isCalculatingBazi, setIsCalculatingBazi] = useState(false);
    const [baziError, setBaziError] = useState<string | null>(null);

    // Load API Key from environment variable on mount
    useEffect(() => {
        // Vite exposes VITE_* variables via import.meta.env, and we also define GLM_API_KEY via vite.config.ts
        const envApiKey = (import.meta.env.VITE_GLM_API_KEY || import.meta.env.GLM_API_KEY || '').trim();
        if (envApiKey) {
            setApiKey(envApiKey);
        } else {
            setError('请在 .env 文件中配置 VITE_GLM_API_KEY 或 GLM_API_KEY');
        }
    }, []);

    // Auto-scroll to bottom when streaming text updates
    useEffect(() => {
        if (streamingRef.current) {
            streamingRef.current.scrollTop = streamingRef.current.scrollHeight;
        }
    }, [streamingText]);

    // 当进入步骤2时自动计算八字
    useEffect(() => {
        if (step === 2 && !baziResult && !isCalculatingBazi) {
            calculateBazi();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    // 计算八字函数
    const calculateBazi = async () => {
        setIsCalculatingBazi(true);
        setBaziError(null);

        try {
            console.log('🔍 开始计算八字，当前输入数据:', baziInfo);

            // 首先检查原始字符串是否为空
            if (!baziInfo.birthYear || !baziInfo.birthMonth || !baziInfo.birthDay || 
                !baziInfo.birthHour || !baziInfo.birthMinute) {
                throw new Error('请确保所有出生日期和时间字段都已填写');
            }

            // 验证所有必填字段是否为有效数字
            const year = parseInt(baziInfo.birthYear);
            const month = parseInt(baziInfo.birthMonth);
            const day = parseInt(baziInfo.birthDay);
            const hour = parseInt(baziInfo.birthHour);
            const minute = parseInt(baziInfo.birthMinute);

            console.log('🔍 解析后的数值:', { year, month, day, hour, minute });

            if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
                throw new Error('出生日期或时间格式不正确，请检查输入');
            }

            // 格式化日期时间字符串为 ISO 格式
            // bazi-mcp 要求使用 ISO 字符串格式，如 "2000-05-15T12:00:00+08:00"
            const dateTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+08:00`;

            // 准备参数对象
            // gender: 0 = 女性, 1 = 男性
            const params = baziInfo.calendarType === 'solar' 
                ? {
                    solarDatetime: dateTimeStr,
                    gender: baziInfo.gender === 'Male' ? 1 : 0
                }
                : {
                    lunarDatetime: dateTimeStr,
                    gender: baziInfo.gender === 'Male' ? 1 : 0
                };

            console.log('🔍 准备调用 getBaziDetail，参数:', params);

            // 调用bazi-mcp计算八字
            const result = await getBaziDetail(params);

            console.log('✅ 八字计算成功，完整数据结构:', JSON.stringify(result, null, 2));
            console.log('✅ 大运信息:', result.大运);
            setBaziResult(result);
        } catch (err: any) {
            console.error('❌ 八字计算失败:', err);
            setBaziError(err.message || '八字计算失败,请检查输入信息');
        } finally {
            setIsCalculatingBazi(false);
        }
    };

    // Call GLM API to generate life analysis
    const handleGenerate = async () => {
        if (!apiKey) {
            setError('请在 .env 文件中配置 VITE_GLM_API_KEY 或 GLM_API_KEY');
            return;
        }

        // 确保八字已经计算完成
        if (!baziResult) {
            setError('八字信息尚未计算完成,请稍候');
            return;
        }

        setError(null);
        setIsLoading(true);
        setStreamingText(''); // Reset streaming text

        try {
            const result = await generateLifeAnalysisWithGLM({
                name: baziInfo.name,
                gender: baziInfo.gender === 'Male' ? Gender.MALE : Gender.FEMALE,
                birthYear: baziInfo.birthYear,
                birthMonth: baziInfo.birthMonth,
                birthDay: baziInfo.birthDay,
                birthHour: baziInfo.birthHour,
                birthMinute: baziInfo.birthMinute,
                calendarType: baziInfo.calendarType,
                birthPlace: baziInfo.birthPlace,
                apiKey: apiKey,
                modelName: 'glm-4.6',
                baziResult: baziResult, // 传递预计算的八字结果
                onStream: (text: string) => {
                    setStreamingText(text);
                },
            });

            // Clear streaming text and import result
            setStreamingText('');
            onDataImport(result);
        } catch (err: any) {
            setError(err.message || '生成失败，请检查API配置和网络连接');
            setStreamingText('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBaziChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setBaziInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const isStep1Valid = baziInfo.birthYear && baziInfo.birthMonth && baziInfo.birthDay && 
        baziInfo.birthHour && baziInfo.birthMinute && apiKey.trim();

    return (
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2].map((s) => (
                    <React.Fragment key={s}>
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === s
                                ? 'bg-indigo-600 text-white scale-110'
                                : step > s
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                        >
                            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                        </div>
                        {s < 2 && <div className={`w-16 h-1 rounded ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* 步骤 1: 输入八字信息 */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第一步：输入出生信息</h2>
                        <p className="text-gray-500 text-sm">填写您的出生信息，AI将自动计算四柱与大运</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">姓名 (可选)</label>
                            <input
                                type="text"
                                name="name"
                                value={baziInfo.name}
                                onChange={handleBaziChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="姓名"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">性别</label>
                            <select
                                name="gender"
                                value={baziInfo.gender}
                                onChange={handleBaziChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="Male">乾造 (男)</option>
                                <option value="Female">坤造 (女)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2 mb-3 text-amber-800 text-sm font-bold">
                            <Sparkles className="w-4 h-4" />
                            <span>出生信息</span>
                        </div>

                        <div className="mb-4 space-y-3">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-bold text-gray-600">出生日期</label>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        type="button"
                                        onClick={() => setBaziInfo({ ...baziInfo, calendarType: 'solar' })}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition ${baziInfo.calendarType === 'solar'
                                            ? 'bg-white text-indigo-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        阳历
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBaziInfo({ ...baziInfo, calendarType: 'lunar' })}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition ${baziInfo.calendarType === 'lunar'
                                            ? 'bg-white text-indigo-700 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        阴历
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">年</label>
                                    <input
                                        type="number"
                                        name="birthYear"
                                        value={baziInfo.birthYear}
                                        onChange={handleBaziChange}
                                        placeholder="2003"
                                        min="1900"
                                        max="2100"
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900 placeholder:text-gray-400 text-center font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">月</label>
                                    <input
                                        type="number"
                                        name="birthMonth"
                                        value={baziInfo.birthMonth}
                                        onChange={handleBaziChange}
                                        placeholder="05"
                                        min="1"
                                        max="12"
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900 placeholder:text-gray-400 text-center font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">日</label>
                                    <input
                                        type="number"
                                        name="birthDay"
                                        value={baziInfo.birthDay}
                                        onChange={handleBaziChange}
                                        placeholder="21"
                                        min="1"
                                        max="31"
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900 placeholder:text-gray-400 text-center font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Birth Time Input */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-600 mb-1">出生时间</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">时</label>
                                    <input
                                        type="number"
                                        name="birthHour"
                                        value={baziInfo.birthHour}
                                        onChange={handleBaziChange}
                                        placeholder="14"
                                        min="0"
                                        max="23"
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900 placeholder:text-gray-400 text-center font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">分</label>
                                    <input
                                        type="number"
                                        name="birthMinute"
                                        value={baziInfo.birthMinute}
                                        onChange={handleBaziChange}
                                        placeholder="30"
                                        min="0"
                                        max="59"
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900 placeholder:text-gray-400 text-center font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">出生地 (可选)</label>
                            <input
                                type="text"
                                name="birthPlace"
                                value={baziInfo.birthPlace}
                                onChange={handleBaziChange}
                                placeholder="如: 北京市"
                                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={() => setStep(2)}
                        disabled={!isStep1Valid}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        下一步：确认数据 <Sparkles className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* 步骤 2: 确认数据 */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第二步：确认数据</h2>
                        <p className="text-gray-500 text-sm">请确认您的出生信息，确认无误后点击生成</p>
                    </div>

                    {/* 显示输入信息摘要 */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                        <h3 className="font-bold text-gray-800 mb-3">出生信息确认</h3>
                        <div className="space-y-2 text-sm text-gray-700">
                            <p><span className="font-bold">姓名：</span>{baziInfo.name || "未提供"}</p>
                            <p><span className="font-bold">性别：</span>{baziInfo.gender === 'Male' ? '男 (乾造)' : '女 (坤造)'}</p>
                            <p><span className="font-bold">出生日期：</span>
                                {baziInfo.birthYear}年 {baziInfo.birthMonth}月 {baziInfo.birthDay}日 
                                {baziInfo.birthHour}:{baziInfo.birthMinute.padStart(2, '0')} 
                                ({baziInfo.calendarType === 'solar' ? '阳历' : '阴历'})
                            </p>
                            {baziInfo.birthPlace && (
                                <p><span className="font-bold">出生地：</span>{baziInfo.birthPlace}</p>
                            )}
                        </div>
                    </div>

                    {/* 八字计算结果显示 */}
                    {isCalculatingBazi && (
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                            <p className="text-sm text-amber-800">正在计算八字信息...</p>
                        </div>
                    )}

                    {baziError && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{baziError}</p>
                        </div>
                    )}

                    {baziResult && !isCalculatingBazi && (
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-200">
                            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-600" />
                                八字排盘结果
                            </h3>
                            <div className="space-y-3">
                                {/* 四柱显示 */}
                                <div className="bg-white p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-2">四柱干支</p>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div className="bg-gradient-to-b from-red-50 to-red-100 p-2 rounded">
                                            <p className="text-xs text-gray-600">年柱</p>
                                            <p className="font-bold text-lg text-red-800">{baziResult.年柱?.天干?.天干}{baziResult.年柱?.地支?.地支}</p>
                                        </div>
                                        <div className="bg-gradient-to-b from-green-50 to-green-100 p-2 rounded">
                                            <p className="text-xs text-gray-600">月柱</p>
                                            <p className="font-bold text-lg text-green-800">{baziResult.月柱?.天干?.天干}{baziResult.月柱?.地支?.地支}</p>
                                        </div>
                                        <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-2 rounded">
                                            <p className="text-xs text-gray-600">日柱</p>
                                            <p className="font-bold text-lg text-blue-800">{baziResult.日柱?.天干?.天干}{baziResult.日柱?.地支?.地支}</p>
                                        </div>
                                        <div className="bg-gradient-to-b from-purple-50 to-purple-100 p-2 rounded">
                                            <p className="text-xs text-gray-600">时柱</p>
                                            <p className="font-bold text-lg text-purple-800">{baziResult.时柱?.天干?.天干}{baziResult.时柱?.地支?.地支}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 大运信息 */}
                                {baziResult.大运 && (
                                    <div className="bg-white p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-2">大运信息</p>
                                        <div className="space-y-1 text-sm">
                                            <p><span className="font-bold">起运年龄：</span>{baziResult.大运.起运年龄}岁</p>
                                            <p><span className="font-bold">大运序列：</span>
                                                <span className="ml-2 font-mono">
                                                    {baziResult.大运.大运?.slice(0, 5).map((item: any) => 
                                                        item.干支
                                                    ).join(' → ')}
                                                    {baziResult.大运.大运?.length > 5 ? ' ...' : ''}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(1)}
                            disabled={isLoading}
                            className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← 上一步
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    大师推演中(3-5分钟)...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    生成人生K线
                                </>
                            )}
                        </button>
                    </div>

                    {isLoading && (
                        <>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                                <p className="text-sm text-indigo-800 text-center">
                                    ⏳ 正在调用智谱GLM API生成命理分析，这可能需要3-5分钟，请耐心等待...
                                </p>
                            </div>
                            
                            {/* Streaming output display */}
                            {streamingText && (
                                <div 
                                    ref={streamingRef}
                                    className="bg-slate-900 text-slate-400 p-3 rounded-lg border border-slate-800 min-h-[3rem] max-h-[4rem] overflow-y-auto text-xs font-mono leading-relaxed shadow-inner"
                                    style={{ scrollBehavior: 'smooth' }}
                                >
                                    <div className="whitespace-pre-wrap break-words">
                                        {streamingText}
                                        <span className="inline-block w-2 h-4 bg-slate-500 ml-1 animate-pulse">|</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ConfirmDataMode;

