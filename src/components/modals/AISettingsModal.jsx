import { useState } from 'react';
import { Bot, X, WifiOff, Eye, EyeOff } from 'lucide-react';

/**
 * AISettingsModal - AI 设置弹窗
 * Modal for configuring AI provider settings (Gemini/OpenAI)
 */
const AISettingsModal = ({ t, aiConfig, onSave, onClose, onlineMode }) => {
  const [config, setConfig] = useState(() => ({
    enabled: aiConfig?.enabled || false,
    provider: aiConfig?.provider || 'gemini',
    apiKey: aiConfig?.apiKey || '',
    model: aiConfig?.model || '',
    endpoint: aiConfig?.endpoint || '',
    // 分别存储两个 provider 的配置
    geminiApiKey: aiConfig?.provider === 'gemini' ? (aiConfig?.apiKey || '') : (aiConfig?.geminiApiKey || ''),
    geminiModel: aiConfig?.provider === 'gemini' ? (aiConfig?.model || '') : (aiConfig?.geminiModel || ''),
    openaiApiKey: aiConfig?.provider === 'openai' ? (aiConfig?.apiKey || '') : (aiConfig?.openaiApiKey || ''),
    openaiModel: aiConfig?.provider === 'openai' ? (aiConfig?.model || '') : (aiConfig?.openaiModel || ''),
    openaiEndpoint: aiConfig?.provider === 'openai' ? (aiConfig?.endpoint || '') : (aiConfig?.openaiEndpoint || '')
  }));
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const defaultModels = {
    gemini: 'gemini-2.0-flash',
    openai: 'gpt-4o-mini'
  };

  // 获取当前 provider 的配置
  const currentApiKey = config.provider === 'gemini' ? config.geminiApiKey : config.openaiApiKey;
  const currentModel = config.provider === 'gemini' ? config.geminiModel : config.openaiModel;
  const currentEndpoint = config.openaiEndpoint;

  // 执行 API 连接测试，返回是否成功
  // 可选参数 provider 用于测试指定的供应商
  const doTestConnection = async (testProvider = null) => {
    const provider = testProvider || config.provider;
    const apiKey = provider === 'gemini' ? config.geminiApiKey : config.openaiApiKey;
    const model = provider === 'gemini' ? (config.geminiModel || defaultModels.gemini) : (config.openaiModel || defaultModels.openai);
    const endpoint = config.openaiEndpoint;
    
    if (!apiKey) return false;
    
    try {
      let response;
      if (provider === 'gemini') {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Say "OK" only.' }] }]
            })
          }
        );
      } else {
        let apiEndpoint = endpoint || 'https://api.openai.com/v1';
        if (!apiEndpoint.includes('/chat/completions')) {
          apiEndpoint = apiEndpoint.replace(/\/$/, '') + '/chat/completions';
        }
        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'Say "OK" only.' }],
            max_tokens: 10
          })
        });
      }
      return response.ok;
    } catch {
      return false;
    }
  };

  const testConnection = async () => {
    if (!currentApiKey) {
      setTestResult({ success: false, message: t.aiTestFail });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const success = await doTestConnection();
    setTestResult({ success, message: success ? t.aiTestSuccess : t.aiTestFail });
    setTesting(false);
  };

  // 处理供应商切换
  const handleProviderChange = async (newProvider) => {
    if (newProvider === config.provider) return;
    
    const newApiKey = newProvider === 'gemini' ? config.geminiApiKey : config.openaiApiKey;
    
    // 如果当前已启用且新供应商有 API Key，需要重新验证
    if (config.enabled && newApiKey) {
      setTesting(true);
      setTestResult(null);
      setConfig({ ...config, provider: newProvider });
      
      const success = await doTestConnection(newProvider);
      
      if (success) {
        setTestResult({ success: true, message: t.aiTestSuccess });
      } else {
        // 验证失败，关闭开关
        setConfig(prev => ({ ...prev, provider: newProvider, enabled: false }));
        setTestResult({ success: false, message: t.aiTestFail });
        // 保存禁用状态
        const finalConfig = {
          enabled: false,
          provider: newProvider,
          apiKey: newApiKey,
          model: (newProvider === 'gemini' ? config.geminiModel : config.openaiModel) || defaultModels[newProvider],
          endpoint: config.openaiEndpoint,
          geminiApiKey: config.geminiApiKey,
          geminiModel: config.geminiModel,
          openaiApiKey: config.openaiApiKey,
          openaiModel: config.openaiModel,
          openaiEndpoint: config.openaiEndpoint
        };
        onSave(finalConfig);
      }
      
      setTesting(false);
    } else {
      // 未启用或新供应商没有 API Key，直接切换
      setConfig({ ...config, provider: newProvider, enabled: false });
      setTestResult(null);
    }
  };

  const handleSave = () => {
    const finalConfig = {
      enabled: config.enabled && currentApiKey ? true : false,
      provider: config.provider,
      apiKey: currentApiKey,
      model: currentModel || defaultModels[config.provider],
      endpoint: currentEndpoint,
      // 保存两个 provider 的配置
      geminiApiKey: config.geminiApiKey,
      geminiModel: config.geminiModel,
      openaiApiKey: config.openaiApiKey,
      openaiModel: config.openaiModel,
      openaiEndpoint: config.openaiEndpoint
    };
    onSave(finalConfig);
    onClose();
  };

  const handleToggleEnabled = async () => {
    const newEnabled = !config.enabled;
    
    if (newEnabled && currentApiKey) {
      // 开启时自动验证
      setTesting(true);
      setTestResult(null);
      
      const success = await doTestConnection();
      
      if (success) {
        setConfig({ ...config, enabled: true });
        setTestResult({ success: true, message: t.aiTestSuccess });
        // 验证成功后保存
        const finalConfig = {
          enabled: true,
          provider: config.provider,
          apiKey: currentApiKey,
          model: currentModel || defaultModels[config.provider],
          endpoint: currentEndpoint,
          geminiApiKey: config.geminiApiKey,
          geminiModel: config.geminiModel,
          openaiApiKey: config.openaiApiKey,
          openaiModel: config.openaiModel,
          openaiEndpoint: config.openaiEndpoint
        };
        onSave(finalConfig);
      } else {
        // 验证失败，回退
        setConfig({ ...config, enabled: false });
        setTestResult({ success: false, message: t.aiTestFail });
      }
      
      setTesting(false);
    } else if (newEnabled && !currentApiKey) {
      // 没有 API Key，只更新本地状态
      setConfig({ ...config, enabled: newEnabled });
      setTestResult(null);
    } else {
      // 关闭时直接保存
      setConfig({ ...config, enabled: false });
      setTestResult(null);
      const finalConfig = {
        enabled: false,
        provider: config.provider,
        apiKey: currentApiKey,
        model: currentModel || defaultModels[config.provider],
        endpoint: currentEndpoint,
        geminiApiKey: config.geminiApiKey,
        geminiModel: config.geminiModel,
        openaiApiKey: config.openaiApiKey,
        openaiModel: config.openaiModel,
        openaiEndpoint: config.openaiEndpoint
      };
      onSave(finalConfig);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/60 dark:border-white/10 animate-scale-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center">
            <Bot size={24} className="mr-2 text-purple-500" /> {t.aiSettings}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {!onlineMode && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <p className="text-sm text-yellow-700 dark:text-yellow-300 font-bold flex items-center">
              <WifiOff size={16} className="mr-2" /> {t.aiNeedsOnline}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* AI 启用开关 */}
          {currentApiKey && (
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/40 dark:border-white/10">
              <span className="font-bold text-gray-700 dark:text-gray-200">{t.aiMode}</span>
              <button
                onClick={handleToggleEnabled}
                className={`relative w-14 h-8 rounded-full transition-all ${config.enabled ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${config.enabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">{t.aiProvider}</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleProviderChange('gemini')}
                disabled={testing}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50 ${config.provider === 'gemini'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-white/40 dark:border-white/10'
                  }`}
              >
                Gemini
              </button>
              <button
                onClick={() => handleProviderChange('openai')}
                disabled={testing}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all disabled:opacity-50 ${config.provider === 'openai'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border border-white/40 dark:border-white/10'
                  }`}
              >
                OpenAI
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">{t.aiApiKey}</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={currentApiKey}
                onChange={(e) => setConfig({
                  ...config,
                  [config.provider === 'gemini' ? 'geminiApiKey' : 'openaiApiKey']: e.target.value
                })}
                placeholder="sk-... / AIza..."
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/60 dark:bg-gray-800/60 border-2 border-white/40 dark:border-white/10 text-gray-800 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">{t.aiModel}</label>
            <input
              type="text"
              value={currentModel}
              onChange={(e) => setConfig({
                ...config,
                [config.provider === 'gemini' ? 'geminiModel' : 'openaiModel']: e.target.value
              })}
              placeholder={defaultModels[config.provider]}
              className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border-2 border-white/40 dark:border-white/10 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          {config.provider === 'openai' && (
            <div>
              <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">{t.aiEndpoint}</label>
              <input
                type="text"
                value={currentEndpoint}
                onChange={(e) => setConfig({ ...config, openaiEndpoint: e.target.value })}
                placeholder={t.aiEndpointPlaceholder}
                className="w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border-2 border-white/40 dark:border-white/10 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          )}

          {testResult && (
            <div className={`p-3 rounded-xl ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'} font-bold text-sm`}>
              {testResult.message}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={testConnection}
              disabled={testing || !currentApiKey}
              className="flex-1 py-3 rounded-xl font-bold bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 border border-white/40 dark:border-white/10 hover:bg-white dark:hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              {testing ? '...' : t.aiTest}
            </button>
            <button
              onClick={handleSave}
              disabled={!currentApiKey}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-teal-500 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:opacity-50"
            >
              {t.aiSave}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettingsModal;
