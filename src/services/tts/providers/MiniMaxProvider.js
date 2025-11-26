/**
 * MiniMaxProvider - MiniMax T2A API TTS Provider
 * 
 * Implements the MiniMax Text-to-Audio HTTP API for high-quality TTS.
 * API Endpoint: https://api.minimaxi.com/v1/t2a_v2
 * Supports 40+ languages including Japanese and Korean.
 */

import { MINIMAX_VOICES } from '../types.js';

/**
 * @typedef {import('../types.js').TTSVoice} TTSVoice
 * @typedef {import('../types.js').TTSTestResult} TTSTestResult
 */

export class MiniMaxProvider {
  /**
   * Create a MiniMaxProvider instance
   * @param {Object} config - Provider configuration
   * @param {string} config.apiKey - MiniMax API key
   * @param {string} [config.voiceId] - Voice ID (default: 'male-qn-qingse')
   * @param {string} [config.model] - Model version (default: 'speech-02-turbo')
   */
  constructor(config) {
    /** @type {string} */
    this.name = 'minimax';
    
    /** @type {string} */
    this.apiKey = config.apiKey || '';
    
    /** @type {string} */
    this.voiceId = config.voiceId || 'male-qn-qingse';
    
    /** @type {string} */
    this.model = config.model || 'speech-02-turbo';
  }

  /**
   * Convert hex string to Uint8Array
   * @param {string} hexString - Hex encoded string
   * @returns {Uint8Array} - Decoded bytes
   */
  hexToBytes(hexString) {
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
      bytes[i / 2] = parseInt(hexString.slice(i, i + 2), 16);
    }
    return bytes;
  }

  /**
   * Map language code to MiniMax language_boost value
   * @param {'ja'|'ko'} lang - Language code
   * @returns {string|null} - MiniMax language boost value
   */
  getLanguageBoost(lang) {
    const langMap = {
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'en': 'English',
    };
    return langMap[lang] || null;
  }

  /**
   * Generate speech audio using MiniMax T2A HTTP API
   * 
   * @param {string} text - Text to speak (max 10,000 characters)
   * @param {'ja'|'ko'} lang - Language code
   * @param {string} [voiceId] - Optional voice override
   * @returns {Promise<Blob|null>} - Audio blob or null on failure
   */
  async speak(text, lang, voiceId) {
    if (!this.apiKey) {
      console.warn('MiniMax: Missing API key');
      return null;
    }

    const voice = voiceId || this.voiceId;
    const url = 'https://api.minimaxi.com/v1/t2a_v2';

    try {
      const requestBody = {
        model: this.model,
        text: text,
        stream: false,
        voice_setting: {
          voice_id: voice,
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: 'mp3',
          channel: 1,
        },
        output_format: 'hex',
      };

      // Add language boost for better small language recognition
      const languageBoost = this.getLanguageBoost(lang);
      if (languageBoost) {
        requestBody.language_boost = languageBoost;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('MiniMax API error:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      
      if (data.base_resp?.status_code !== 0) {
        console.error('MiniMax API error:', data.base_resp?.status_msg);
        return null;
      }

      // Decode hex audio data (API returns hex encoded audio by default)
      if (data.data?.audio) {
        const bytes = this.hexToBytes(data.data.audio);
        return new Blob([bytes], { type: 'audio/mpeg' });
      }

      return null;
    } catch (error) {
      console.error('MiniMax speak error:', error);
      return null;
    }
  }


  /**
   * Test the MiniMax API connection
   * 
   * @returns {Promise<TTSTestResult>} - Test result
   */
  async testConnection() {
    if (!this.apiKey) {
      return {
        success: false,
        message: 'Missing API key',
      };
    }

    try {
      // Test with a short phrase
      const blob = await this.speak('テスト', 'ja');
      
      if (blob) {
        return {
          success: true,
          message: 'MiniMax connection successful',
        };
      } else {
        return {
          success: false,
          message: 'MiniMax API returned no audio data',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `MiniMax connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Get available MiniMax voices
   * 
   * @returns {TTSVoice[]} - Available voices
   */
  getAvailableVoices() {
    return MINIMAX_VOICES.map(v => ({
      ...v,
      lang: 'multi', // MiniMax voices support multiple languages
    }));
  }

  /**
   * Update provider configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    if (config.apiKey !== undefined) this.apiKey = config.apiKey;
    if (config.voiceId !== undefined) this.voiceId = config.voiceId;
    if (config.model !== undefined) this.model = config.model;
  }
}
