/**
 * TTS Provider Types and Interfaces
 * 
 * This module defines the common interface for all TTS providers
 * and configuration types for the TTS system.
 * 
 */

/**
 * @typedef {Object} TTSVoice
 * @property {string} id - Voice identifier
 * @property {string} name - Display name for the voice
 * @property {string} [lang] - Language code (optional)
 */

/**
 * @typedef {Object} TTSTestResult
 * @property {boolean} success - Whether the test was successful
 * @property {string} message - Result message
 */

/**
 * @typedef {Object} TTSConfig
 * @property {boolean} enabled - Whether AI TTS is enabled
 * @property {'native' | 'minimax' | 'openai-tts'} provider - Selected TTS provider
 * @property {string} [minimaxApiKey] - MiniMax API key
 * @property {string} [minimaxVoiceId] - MiniMax voice ID
 * @property {string} [openaiTTSApiKey] - OpenAI TTS API key
 * @property {'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'} [openaiTTSVoice] - OpenAI TTS voice
 * @property {string} [openaiTTSEndpoint] - OpenAI TTS endpoint URL
 * @property {string} [openaiTTSModel] - OpenAI TTS model
 */

/**
 * TTS Provider Interface
 * All TTS providers must implement these methods.
 * 
 * @interface TTSProvider
 * @property {string} name - Provider name
 * @property {function(string, 'ja'|'ko', string=): Promise<Blob|null>} speak - Generate speech audio
 * @property {function(): Promise<TTSTestResult>} testConnection - Test provider connection
 * @property {function(): TTSVoice[]} getAvailableVoices - Get available voices
 */

// MiniMax Model Options (with i18n support)
export const MINIMAX_MODELS = [
  { id: 'speech-02-turbo', name: 'Speech 02 Turbo (推荐)', nameEn: 'Speech 02 Turbo (Recommended)' },
  { id: 'speech-02-hd', name: 'Speech 02 HD (高质量)', nameEn: 'Speech 02 HD (High Quality)' },
  { id: 'speech-2.6-turbo', name: 'Speech 2.6 Turbo (极速)', nameEn: 'Speech 2.6 Turbo (Fast)' },
  { id: 'speech-2.6-hd', name: 'Speech 2.6 HD (超低延时)', nameEn: 'Speech 2.6 HD (Low Latency)' },
];

// MiniMax Voice Options (with i18n support)
export const MINIMAX_VOICES = [
  { id: 'male-qn-qingse', name: '青涩青年音色', nameEn: 'Young Male (Fresh)' },
  { id: 'female-shaonv', name: '少女音色', nameEn: 'Young Female' },
  { id: 'female-yujie', name: '御姐音色', nameEn: 'Mature Female' },
  { id: 'male-qn-jingying', name: '精英青年音色', nameEn: 'Young Male (Elite)' },
  { id: 'male-qn-badao', name: '霸道青年音色', nameEn: 'Young Male (Bold)' },
  { id: 'female-tianmei', name: '甜美女声', nameEn: 'Sweet Female' },
  { id: 'presenter_male', name: '男性主持人', nameEn: 'Male Presenter' },
  { id: 'presenter_female', name: '女性主持人', nameEn: 'Female Presenter' },
];

// OpenAI TTS Voice Options
export const OPENAI_TTS_VOICES = [
  { id: 'alloy', name: 'Alloy' },
  { id: 'echo', name: 'Echo' },
  { id: 'fable', name: 'Fable' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'nova', name: 'Nova' },
  { id: 'shimmer', name: 'Shimmer' },
];

// Default configuration values
export const DEFAULT_TTS_CONFIG = {
  enabled: false,
  provider: 'native',
  minimaxVoiceId: 'male-qn-qingse',
  minimaxModel: 'speech-02-turbo',
  openaiTTSVoice: 'alloy',
  openaiTTSEndpoint: 'https://api.openai.com/v1',
  openaiTTSModel: 'tts-1',
};

// Provider names for display (OpenAI TTS temporarily disabled)
export const PROVIDER_NAMES = {
  native: 'Native (Browser)',
  minimax: 'MiniMax',
  // 'openai-tts': 'OpenAI TTS', // TODO: Re-enable when ready
};

/**
 * Create a default TTS configuration
 * @returns {TTSConfig}
 */
export const createDefaultConfig = () => ({
  ...DEFAULT_TTS_CONFIG,
});

/**
 * Validate if a config object has required fields for the selected provider
 * @param {TTSConfig} config - Configuration to validate
 * @returns {boolean} - Whether the config is valid for the selected provider
 */
export const isConfigValid = (config) => {
  if (!config || !config.provider) return false;
  
  switch (config.provider) {
    case 'native':
      return true;
    case 'minimax':
      return !!config.minimaxApiKey;
    case 'openai-tts':
      return !!config.openaiTTSApiKey;
    default:
      return false;
  }
};
