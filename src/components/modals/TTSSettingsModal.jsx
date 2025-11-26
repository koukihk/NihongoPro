import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Volume2, X, Eye, EyeOff, ChevronDown, Check, WifiOff } from 'lucide-react';
import { ttsService } from '../../services/tts/index.js';
import { MINIMAX_VOICES, MINIMAX_MODELS } from '../../services/tts/types.js';

/**
 * IOSSelect - iOS 风格下拉选择器（使用 Portal 渲染下拉菜单以溢出模态框）
 */
const IOSSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.id === value);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      // 检查点击是否在按钮或下拉菜单外部
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(e.target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(e.target);
      
      if (isOutsideButton && isOutsideDropdown) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 计算下拉菜单位置并切换开关
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsOpen(!isOpen);
  };

  // 下拉菜单内容
  const dropdownContent = isOpen && (
    <div
      ref={dropdownRef}
      style={{ top: position.top, left: position.left, width: position.width }}
      className="fixed z-[100] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden animate-fade-in"
    >
      <div className="max-h-48 overflow-y-auto ios-scrollbar py-1">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => { onChange(option.id); setIsOpen(false); }}
            className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
              value === option.id 
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/50'
            }`}
          >
            <span>{option.name}</span>
            {value === option.id && <Check size={16} className="text-blue-500" />}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative z-10">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`relative z-[101] w-full px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 border-2 text-gray-800 dark:text-white text-sm text-left flex items-center justify-between focus:outline-none transition-all ${
          isOpen 
            ? 'border-blue-400 ring-2 ring-blue-400/30' 
            : 'border-white/40 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
        }`}
      >
        <span className={selectedOption ? '' : 'text-gray-400'}>{selectedOption?.name || placeholder}</span>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {createPortal(dropdownContent, document.body)}
    </div>
  );
};

/**
 * TTSSettingsModal - TTS 语音设置弹窗
 * Modal for configuring TTS provider settings (Native, MiniMax, OpenAI TTS)
 * 
 */
const TTSSettingsModal = ({ t, ttsConfig, onSave, onClose, onlineMode, lang = 'zh' }) => {
  // Get localized options based on current language
  const localizedVoices = useMemo(() => 
    MINIMAX_VOICES.map(v => ({ ...v, name: lang === 'en' ? v.nameEn : v.name })), 
    [lang]
  );
  const localizedModels = useMemo(() => 
    MINIMAX_MODELS.map(m => ({ ...m, name: lang === 'en' ? m.nameEn : m.name })), 
    [lang]
  );
  const [config, setConfig] = useState(() => ({
    enabled: ttsConfig?.enabled || false,
    provider: ttsConfig?.enabled ? (ttsConfig?.provider || 'minimax') : 'native',
    // MiniMax config
    minimaxApiKey: ttsConfig?.minimaxApiKey || '',
    minimaxVoiceId: ttsConfig?.minimaxVoiceId || 'male-qn-qingse',
    minimaxModel: ttsConfig?.minimaxModel || 'speech-02-turbo',
    // OpenAI TTS config (preserved for future use)
    openaiTTSApiKey: ttsConfig?.openaiTTSApiKey || '',
    openaiTTSVoice: ttsConfig?.openaiTTSVoice || 'alloy',
    openaiTTSEndpoint: ttsConfig?.openaiTTSEndpoint || 'https://api.openai.com/v1',
    openaiTTSModel: ttsConfig?.openaiTTSModel || 'tts-1',
  }));
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Check if MiniMax is configured
  const isMiniMaxConfigured = !!config.minimaxApiKey;


  // Test connection handler (Requirement 2.1, 2.2, 2.3)
  const testConnection = async () => {
    if (!isMiniMaxConfigured) {
      setTestResult({ success: false, message: t.ttsTestFail });
      return;
    }
    
    setTesting(true);
    setTestResult(null);
    
    try {
      // Temporarily update the service config for testing
      const testConfig = { ...config, provider: 'minimax', enabled: true };
      ttsService.setConfig(testConfig);
      const result = await ttsService.testConnection();
      setTestResult({
        success: result.success,
        message: result.success ? t.ttsTestSuccess : t.ttsTestFail,
      });
    } catch {
      setTestResult({ success: false, message: t.ttsTestFail });
    }
    
    setTesting(false);
  };

  const handleSave = () => {
    const finalConfig = {
      ...config,
      provider: config.enabled ? 'minimax' : 'native',
      enabled: config.enabled && isMiniMaxConfigured,
    };
    ttsService.setConfig(finalConfig);
    onSave(finalConfig);
    onClose();
  };

  const handleToggleEnabled = async () => {
    const newEnabled = !config.enabled;
    
    if (newEnabled && isMiniMaxConfigured) {
      // 开启时自动验证
      setTesting(true);
      setTestResult(null);
      
      try {
        const testConfig = { ...config, provider: 'minimax', enabled: true };
        ttsService.setConfig(testConfig);
        const result = await ttsService.testConnection();
        
        if (result.success) {
          const newConfig = { ...config, enabled: true, provider: 'minimax' };
          setConfig(newConfig);
          setTestResult({ success: true, message: t.ttsTestSuccess });
          // 验证成功后立即保存，触发在线模式切换
          onSave(newConfig);
        } else {
          // 验证失败，回退到禁用状态
          setConfig({ ...config, enabled: false, provider: 'native' });
          setTestResult({ success: false, message: t.ttsTestFail });
        }
      } catch {
        setConfig({ ...config, enabled: false, provider: 'native' });
        setTestResult({ success: false, message: t.ttsTestFail });
      }
      
      setTesting(false);
    } else if (newEnabled && !isMiniMaxConfigured) {
      // 没有配置 API Key，只更新本地状态
      setConfig({ ...config, enabled: newEnabled, provider: 'minimax' });
      setTestResult(null);
    } else {
      // 关闭时直接更新并保存
      const newConfig = { ...config, enabled: false, provider: 'native' };
      setConfig(newConfig);
      setTestResult(null);
      onSave(newConfig);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/60 dark:border-white/10 animate-scale-up max-h-[85vh] overflow-hidden flex flex-col">
        {/* 固定头部 */}
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center">
            <Volume2 size={24} className="mr-2 text-blue-500" /> {t.ttsSettings}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto px-6 ios-scrollbar">
        <div className="space-y-4">
          {/* Online mode warning */}
          {!onlineMode && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 font-bold flex items-center">
                <WifiOff size={16} className="mr-2" /> {t.ttsNeedsOnline}
              </p>
            </div>
          )}

          {/* TTS Enable Toggle - only show when API Key is configured */}
          {isMiniMaxConfigured && (
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/40 dark:border-white/10">
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {t.ttsEnabled}
              </span>
              <button
                onClick={handleToggleEnabled}
                className={`relative w-14 h-8 rounded-full transition-all ${config.enabled ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${config.enabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          )}

          {/* MiniMax fields - always show */}
          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">{t.ttsApiKey}</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={config.minimaxApiKey}
                onChange={(e) => setConfig({ ...config, minimaxApiKey: e.target.value })}
                placeholder="eyJ..."
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-white/40 dark:border-white/10 text-gray-800 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">{t.ttsModel}</label>
            <IOSSelect
              value={config.minimaxModel}
              onChange={(value) => setConfig({ ...config, minimaxModel: value })}
              options={localizedModels}
              placeholder={t.ttsModel}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">{t.ttsVoice}</label>
            <IOSSelect
              value={config.minimaxVoiceId}
              onChange={(value) => setConfig({ ...config, minimaxVoiceId: value })}
              options={localizedVoices}
              placeholder={t.ttsVoice}
            />
          </div>




          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-xl ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'} font-bold text-sm`}>
              {testResult.message}
            </div>
          )}

        </div>
        </div>

        {/* 固定底部按钮 */}
        <div className="p-6 pt-4 shrink-0">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-3">Powered by MiniMax</p>
          <div className="flex gap-3">
            <button
              onClick={testConnection}
              disabled={testing || !isMiniMaxConfigured}
              className="flex-1 py-3 rounded-xl font-bold bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 border border-white/40 dark:border-white/10 hover:bg-white dark:hover:bg-gray-700 transition-all disabled:opacity-50"
            >
              {testing ? '...' : t.ttsTest}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all"
            >
              {t.ttsSave}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TTSSettingsModal;
