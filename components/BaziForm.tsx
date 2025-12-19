
import React, { useState } from 'react';
import { UserInput, Gender } from '../types';
import { Loader2, Sparkles, Settings } from 'lucide-react';

interface BaziFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

const BaziForm: React.FC<BaziFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<UserInput>({
    name: '',
    gender: Gender.MALE,
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    birthHour: '',
    birthMinute: '',
    calendarType: 'solar',
    birthPlace: '',
    yearPillar: '',
    monthPillar: '',
    dayPillar: '',
    hourPillar: '',
    startAge: '',
    firstDaYun: '',
    modelName: 'gemini-3-pro-preview',
    apiBaseUrl: 'https://max.openai365.top/v1',
    apiKey: '',
  });

  const [formErrors, setFormErrors] = useState<{ modelName?: string, apiBaseUrl?: string, apiKey?: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (name === 'apiBaseUrl' || name === 'apiKey' || name === 'modelName') {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate API Config
    const errors: { modelName?: string, apiBaseUrl?: string, apiKey?: string } = {};
    if (!formData.modelName.trim()) {
      errors.modelName = '请输入模型名称';
    }
    if (!formData.apiBaseUrl.trim()) {
      errors.apiBaseUrl = '请输入 API Base URL';
    }
    if (!formData.apiKey.trim()) {
      errors.apiKey = '请输入 API Key';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSubmit(formData);
  };


  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-serif-sc font-bold text-gray-800 mb-2">八字排盘</h2>
        <p className="text-gray-500 text-sm">请输入出生信息，AI将自动计算四柱与大运</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Name & Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 (可选)</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: Gender.MALE })}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${formData.gender === Gender.MALE
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                乾造 (男)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: Gender.FEMALE })}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${formData.gender === Gender.FEMALE
                    ? 'bg-white text-pink-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                坤造 (女)
              </button>
            </div>
          </div>
        </div>

        {/* Birth Information */}
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2 mb-3 text-amber-800 text-sm font-bold">
            <Sparkles className="w-4 h-4" />
            <span>出生信息</span>
          </div>

          {/* Birth Date Input */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-600">出生日期</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, calendarType: 'solar' })}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${formData.calendarType === 'solar'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  阳历
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, calendarType: 'lunar' })}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${formData.calendarType === 'lunar'
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
                  required
                  min="1900"
                  max="2100"
                  value={formData.birthYear}
                  onChange={handleChange}
                  placeholder="1990"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900 placeholder:text-gray-400 text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">月</label>
                <input
                  type="number"
                  name="birthMonth"
                  required
                  min="1"
                  max="12"
                  value={formData.birthMonth}
                  onChange={handleChange}
                  placeholder="05"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900 placeholder:text-gray-400 text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">日</label>
                <input
                  type="number"
                  name="birthDay"
                  required
                  min="1"
                  max="31"
                  value={formData.birthDay}
                  onChange={handleChange}
                  placeholder="21"
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
                  required
                  min="0"
                  max="23"
                  value={formData.birthHour}
                  onChange={handleChange}
                  placeholder="14"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900 placeholder:text-gray-400 text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">分</label>
                <input
                  type="number"
                  name="birthMinute"
                  required
                  min="0"
                  max="59"
                  value={formData.birthMinute}
                  onChange={handleChange}
                  placeholder="30"
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900 placeholder:text-gray-400 text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* Birth Place Input */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">出生地 (可选)</label>
            <input
              type="text"
              name="birthPlace"
              value={formData.birthPlace || ''}
              onChange={handleChange}
              placeholder="如: 北京市"
              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* API Configuration Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-3 text-gray-700 text-sm font-bold">
            <Settings className="w-4 h-4" />
            <span>模型接口设置 (必填)</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">使用模型</label>
              <input
                type="text"
                name="modelName"
                value={formData.modelName}
                onChange={handleChange}
                placeholder="gemini-3-pro-preview"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none bg-white text-gray-900 placeholder:text-gray-400 ${formErrors.modelName ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-gray-400'}`}
              />
              {formErrors.modelName && <p className="text-red-500 text-xs mt-1">{formErrors.modelName}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">API Base URL</label>
              <input
                type="text"
                name="apiBaseUrl"
                value={formData.apiBaseUrl}
                onChange={handleChange}
                placeholder="https://max.openai365.top/v1"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none bg-white text-gray-900 placeholder:text-gray-400 ${formErrors.apiBaseUrl ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-gray-400'}`}
              />
              {formErrors.apiBaseUrl && <p className="text-red-500 text-xs mt-1">{formErrors.apiBaseUrl}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">API Key</label>
              <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                placeholder="sk-..."
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none bg-white text-gray-900 placeholder:text-gray-400 ${formErrors.apiKey ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-gray-400'}`}
              />
              {formErrors.apiKey && <p className="text-red-500 text-xs mt-1">{formErrors.apiKey}</p>}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-900 to-gray-900 hover:from-black hover:to-black text-white font-bold py-3.5 rounded-xl shadow-lg transform transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>大师推演中(3-5分钟)</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-amber-300" />
              <span>生成人生K线</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default BaziForm;
