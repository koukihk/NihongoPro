/**
 * NativeProvider - Browser Web Speech API TTS Provider
 * 
 * Wraps the native Web Speech API for text-to-speech functionality.
 * Used as the default/fallback provider when AI TTS is not configured.
 * 
 */

/**
 * @typedef {import('../types.js').TTSVoice} TTSVoice
 * @typedef {import('../types.js').TTSTestResult} TTSTestResult
 */

export class NativeProvider {
  constructor() {
    /** @type {string} */
    this.name = 'native';
  }

  /**
   * Speak text using the Web Speech API
   * Returns null since native TTS plays directly without returning a blob
   * 
   * @param {string} text - Text to speak
   * @param {'ja'|'ko'} lang - Language code
   * @param {string} [_voiceId] - Optional voice identifier (not used for native)
   * @returns {Promise<Blob|null>} - Always returns null for native provider
   */
  async speak(text, lang, _voiceId) {
    if (!('speechSynthesis' in window)) {
      return null;
    }

    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'ko' ? 'ko-KR' : 'ja-JP';
        utterance.rate = 0.9;

        // Try to find a voice that matches the language
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.lang.startsWith(lang === 'ko' ? 'ko' : 'ja')
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onend = () => resolve(null);
        utterance.onerror = () => resolve(null);

        window.speechSynthesis.speak(utterance);
        
        // Resolve immediately since we can't return a blob from native TTS
        // The audio plays directly through the browser
        resolve(null);
      }, 10);
    });
  }


  /**
   * Test the native TTS connection
   * 
   * @returns {Promise<TTSTestResult>} - Test result
   */
  async testConnection() {
    if (!('speechSynthesis' in window)) {
      return {
        success: false,
        message: 'Web Speech API is not supported in this browser',
      };
    }

    try {
      // Try to speak a short test phrase
      const utterance = new SpeechSynthesisUtterance('テスト');
      utterance.lang = 'ja-JP';
      utterance.volume = 0.5;
      utterance.rate = 1.0;

      return new Promise((resolve) => {
        utterance.onend = () => {
          resolve({
            success: true,
            message: 'Native TTS is working correctly',
          });
        };

        utterance.onerror = (event) => {
          resolve({
            success: false,
            message: `Native TTS error: ${event.error || 'Unknown error'}`,
          });
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);

        // Timeout fallback
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Native TTS appears to be available',
          });
        }, 3000);
      });
    } catch (error) {
      return {
        success: false,
        message: `Native TTS error: ${error.message}`,
      };
    }
  }

  /**
   * Get available voices from the browser
   * 
   * @returns {TTSVoice[]} - Available voices
   */
  getAvailableVoices() {
    if (!('speechSynthesis' in window)) {
      return [];
    }

    const voices = window.speechSynthesis.getVoices();
    
    // Filter for Japanese and Korean voices
    return voices
      .filter(v => v.lang.startsWith('ja') || v.lang.startsWith('ko'))
      .map(v => ({
        id: v.voiceURI,
        name: v.name,
        lang: v.lang,
      }));
  }
}
