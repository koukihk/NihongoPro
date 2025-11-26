/**
 * TTSService - Core TTS Service
 * 
 * Routes TTS requests to the appropriate provider and manages caching.
 * Provides graceful fallback to native TTS when AI providers fail.
 * 
 */

import { AudioCache } from './AudioCache.js';
import { NativeProvider, MiniMaxProvider, OpenAITTSProvider } from './providers/index.js';
import { DEFAULT_TTS_CONFIG, isConfigValid } from './types.js';

const TTS_CONFIG_KEY = 'kawaii_tts_config';

export class TTSService {
  /**
   * Create a TTSService instance
   * @param {import('./types.js').TTSConfig} [config] - Initial configuration
   */
  constructor(config) {
    /** @type {import('./types.js').TTSConfig} */
    this.config = config || this.loadConfig();
    
    /** @type {AudioCache} */
    this.cache = new AudioCache();
    
    /** @type {Map<string, Object>} */
    this.providers = new Map();
    
    // Initialize native provider (always available)
    this.providers.set('native', new NativeProvider());
    
    // Initialize AI providers based on config
    this.initializeProviders();
  }

  /**
   * Initialize AI providers based on current config
   * @private
   */
  initializeProviders() {
    // Initialize MiniMax provider if configured
    if (this.config.minimaxApiKey) {
      this.providers.set('minimax', new MiniMaxProvider({
        apiKey: this.config.minimaxApiKey,
        voiceId: this.config.minimaxVoiceId,
        model: this.config.minimaxModel,
      }));
    }
    
    // Initialize OpenAI TTS provider if configured
    if (this.config.openaiTTSApiKey) {
      this.providers.set('openai-tts', new OpenAITTSProvider({
        apiKey: this.config.openaiTTSApiKey,
        voice: this.config.openaiTTSVoice,
        endpoint: this.config.openaiTTSEndpoint,
        model: this.config.openaiTTSModel,
      }));
    }
  }


  /**
   * Load configuration from localStorage
   * Property 1: Configuration Round-Trip Consistency
   * @returns {import('./types.js').TTSConfig}
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem(TTS_CONFIG_KEY);
      if (saved) {
        return { ...DEFAULT_TTS_CONFIG, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load TTS config:', error);
    }
    return { ...DEFAULT_TTS_CONFIG };
  }

  /**
   * Save configuration to localStorage
   * Property 1: Configuration Round-Trip Consistency
   * @param {import('./types.js').TTSConfig} config
   */
  saveConfig(config) {
    try {
      localStorage.setItem(TTS_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save TTS config:', error);
    }
  }

  /**
   * Set the TTS configuration
   * Property 3: Provider Configuration Independence
   * @param {import('./types.js').TTSConfig} config
   */
  setConfig(config) {
    this.config = { ...DEFAULT_TTS_CONFIG, ...config };
    this.saveConfig(this.config);
    this.initializeProviders();
  }

  /**
   * Get the current configuration
   * @returns {import('./types.js').TTSConfig}
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Get the voice ID for the current provider
   * Property 7: Default Voice Selection
   * @private
   * @returns {string}
   */
  getCurrentVoiceId() {
    switch (this.config.provider) {
      case 'minimax':
        return this.config.minimaxVoiceId || 'male-qn-qingse';
      case 'openai-tts':
        return this.config.openaiTTSVoice || 'alloy';
      default:
        return '';
    }
  }

  /**
   * Speak text using the configured TTS provider
   * Property 4: Speak Routing Logic
   * Property 5: Graceful Fallback on Failure
   * Property 6: Language Support
   * 
   * @param {string} text - Text to speak
   * @param {'ja'|'ko'} [lang] - Language code (defaults to app language)
   * @returns {Promise<void>}
   */
  async speak(text, lang) {
    const targetLang = lang || window.__appTargetLang || 'ja';
    
    // If AI TTS is enabled and configured, try to use it
    if (this.config.enabled && isConfigValid(this.config) && this.config.provider !== 'native') {
      const voiceId = this.getCurrentVoiceId();
      const cacheKey = this.cache.generateKey(text, this.config.provider, voiceId);
      
      // Check cache first (Property 9: Cache Hit Behavior)
      const cachedBlob = this.cache.get(cacheKey);
      if (cachedBlob) {
        await this.playAudioBlob(cachedBlob);
        return;
      }
      
      // Try AI provider
      const provider = this.providers.get(this.config.provider);
      if (provider) {
        try {
          const blob = await provider.speak(text, targetLang, voiceId);
          if (blob) {
            // Cache the result
            this.cache.set(cacheKey, blob);
            await this.playAudioBlob(blob);
            return;
          }
        } catch (error) {
          console.warn(`AI TTS failed, falling back to native:`, error);
        }
      }
    }
    
    // Fallback to native TTS (Property 5: Graceful Fallback)
    await this.speakNative(text, targetLang);
  }


  /**
   * Play an audio blob
   * @private
   * @param {Blob} blob - Audio blob to play
   * @returns {Promise<void>}
   */
  async playAudioBlob(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };
      
      audio.play().catch(reject);
    });
  }

  /**
   * Speak using native browser TTS
   * @private
   * @param {string} text - Text to speak
   * @param {'ja'|'ko'} lang - Language code
   * @returns {Promise<void>}
   */
  async speakNative(text, lang) {
    if (!('speechSynthesis' in window)) {
      return;
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'ko' ? 'ko-KR' : 'ja-JP';
        utterance.rate = 0.9;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.lang.startsWith(lang === 'ko' ? 'ko' : 'ja')
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
      }, 10);
    });
  }

  /**
   * Test the current provider connection
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async testConnection() {
    const provider = this.providers.get(this.config.provider);
    if (!provider) {
      return {
        success: false,
        message: 'Provider not found',
      };
    }
    return provider.testConnection();
  }

  /**
   * Get available voices for the current provider
   * @returns {Array<{id: string, name: string, lang?: string}>}
   */
  getAvailableVoices() {
    const provider = this.providers.get(this.config.provider);
    if (!provider) {
      return [];
    }
    return provider.getAvailableVoices();
  }
}

// Export a singleton instance for app-wide use
export const ttsService = new TTSService();
