/**
 * OpenAITTSProvider - OpenAI TTS API Provider
 * 
 * Implements the OpenAI /audio/speech API for text-to-speech.
 * Supports custom endpoints for compatible APIs (e.g., Azure OpenAI).
 * 
 */

import { OPENAI_TTS_VOICES } from '../types.js';

/**
 * @typedef {import('../types.js').TTSVoice} TTSVoice
 * @typedef {import('../types.js').TTSTestResult} TTSTestResult
 */

export class OpenAITTSProvider {
  /**
   * Create an OpenAITTSProvider instance
   * @param {Object} config - Provider configuration
   * @param {string} config.apiKey - OpenAI API key
   * @param {string} [config.voice] - Voice ID (default: 'alloy')
   * @param {string} [config.endpoint] - API endpoint (default: 'https://api.openai.com/v1')
   * @param {string} [config.model] - TTS model (default: 'tts-1')
   */
  constructor(config) {
    /** @type {string} */
    this.name = 'openai-tts';
    
    /** @type {string} */
    this.apiKey = config.apiKey || '';
    
    /** @type {string} */
    this.voice = config.voice || 'alloy';
    
    /** @type {string} */
    this.endpoint = config.endpoint || 'https://api.openai.com/v1';
    
    /** @type {string} */
    this.model = config.model || 'tts-1';
  }

  /**
   * Generate speech audio using OpenAI TTS API
   * 
   * @param {string} text - Text to speak
   * @param {'ja'|'ko'} lang - Language code (OpenAI auto-detects language)
   * @param {string} [voiceId] - Optional voice override
   * @returns {Promise<Blob|null>} - Audio blob or null on failure
   */
  async speak(text, lang, voiceId) {
    if (!this.apiKey) {
      console.warn('OpenAI TTS: Missing API key');
      return null;
    }


    const voice = voiceId || this.voice;
    const url = `${this.endpoint.replace(/\/$/, '')}/audio/speech`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
          voice: voice,
          response_format: 'mp3',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI TTS API error:', response.status, errorData);
        return null;
      }

      // Response is directly the audio blob
      const blob = await response.blob();
      
      if (blob.size === 0) {
        console.error('OpenAI TTS: Empty audio response');
        return null;
      }

      return blob;
    } catch (error) {
      console.error('OpenAI TTS speak error:', error);
      return null;
    }
  }

  /**
   * Test the OpenAI TTS API connection
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
      const blob = await this.speak('Test', 'ja');
      
      if (blob && blob.size > 0) {
        return {
          success: true,
          message: 'OpenAI TTS connection successful',
        };
      } else {
        return {
          success: false,
          message: 'OpenAI TTS API returned no audio data',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `OpenAI TTS connection failed: ${error.message}`,
      };
    }
  }


  /**
   * Get available OpenAI TTS voices
   * 
   * @returns {TTSVoice[]} - Available voices
   */
  getAvailableVoices() {
    return OPENAI_TTS_VOICES.map(v => ({
      ...v,
      lang: 'multi', // OpenAI voices support multiple languages
    }));
  }

  /**
   * Update provider configuration
   * @param {Object} config - New configuration
   */
  updateConfig(config) {
    if (config.apiKey !== undefined) this.apiKey = config.apiKey;
    if (config.voice !== undefined) this.voice = config.voice;
    if (config.endpoint !== undefined) this.endpoint = config.endpoint;
    if (config.model !== undefined) this.model = config.model;
  }
}
