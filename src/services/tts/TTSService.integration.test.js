/**
 * TTSService Integration Tests
 * 
 * Tests for end-to-end speak flow and fallback behavior.
 * 
 * **Feature: ai-tts-integration**
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TTSService } from './TTSService.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

// Mock speechSynthesis with proper event handling
const createMockSpeechSynthesis = () => {
  let currentUtterance = null;
  return {
    cancel: vi.fn(),
    speak: vi.fn((utterance) => {
      currentUtterance = utterance;
      // Immediately trigger onend to simulate completion
      setTimeout(() => {
        if (utterance.onend) utterance.onend();
      }, 0);
    }),
    getVoices: vi.fn(() => []),
    _getCurrentUtterance: () => currentUtterance,
  };
};

let mockSpeechSynthesis;

// Mock SpeechSynthesisUtterance
class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.lang = '';
    this.rate = 1;
    this.voice = null;
    this.onend = null;
    this.onerror = null;
  }
}

vi.stubGlobal('SpeechSynthesisUtterance', MockSpeechSynthesisUtterance);

describe('TTSService Integration Tests', () => {
  let ttsService;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorageMock.clear();
    vi.clearAllMocks();
    
    // Create fresh mock for each test
    mockSpeechSynthesis = createMockSpeechSynthesis();
    vi.stubGlobal('speechSynthesis', mockSpeechSynthesis);
    
    ttsService = new TTSService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * End-to-end speak flow tests
   * 
   * Tests complete flow from speak() call to audio playback.
   * 
   */
  describe('End-to-end speak flow', () => {
    it('should use native TTS when AI TTS is disabled', async () => {
      // Configure with AI TTS disabled
      ttsService.setConfig({
        enabled: false,
        provider: 'native',
      });

      // Call speak and advance timers
      const speakPromise = ttsService.speak('テスト', 'ja');
      await vi.advanceTimersByTimeAsync(50);
      await speakPromise;

      // Verify native TTS was called
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should use native TTS when provider is set to native', async () => {
      ttsService.setConfig({
        enabled: true,
        provider: 'native',
      });

      const speakPromise = ttsService.speak('テスト', 'ja');
      await vi.advanceTimersByTimeAsync(50);
      await speakPromise;

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });

    it('should fall back to native TTS when AI provider is not configured', async () => {
      // Enable AI TTS but don't provide API keys
      ttsService.setConfig({
        enabled: true,
        provider: 'minimax',
        // No API key or group ID
      });

      const speakPromise = ttsService.speak('テスト', 'ja');
      await vi.advanceTimersByTimeAsync(50);
      await speakPromise;

      // Should fall back to native TTS
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should check cache before making API calls', async () => {
      const mockBlob = new Blob(['test audio'], { type: 'audio/mpeg' });
      
      // Pre-populate cache
      const cacheKey = ttsService.cache.generateKey('テスト', 'minimax', 'male-qn-qingse');
      ttsService.cache.set(cacheKey, mockBlob);

      // Configure with MiniMax
      ttsService.setConfig({
        enabled: true,
        provider: 'minimax',
        minimaxApiKey: 'test-key',
        minimaxGroupId: 'test-group',
        minimaxVoiceId: 'male-qn-qingse',
      });

      // Mock playAudioBlob to track if cache was used
      const playAudioBlobSpy = vi.spyOn(ttsService, 'playAudioBlob').mockResolvedValue();

      await ttsService.speak('テスト', 'ja');

      // Should have used cached audio
      expect(playAudioBlobSpy).toHaveBeenCalledWith(mockBlob);
    });

    it('should persist configuration across service instances', () => {
      const config = {
        enabled: true,
        provider: 'openai-tts',
        openaiTTSApiKey: 'test-api-key',
        openaiTTSVoice: 'nova',
        openaiTTSEndpoint: 'https://api.openai.com/v1',
        openaiTTSModel: 'tts-1',
      };

      ttsService.setConfig(config);

      // Create new instance (simulating app restart)
      const newService = new TTSService();
      const loadedConfig = newService.getConfig();

      expect(loadedConfig.enabled).toBe(config.enabled);
      expect(loadedConfig.provider).toBe(config.provider);
      expect(loadedConfig.openaiTTSApiKey).toBe(config.openaiTTSApiKey);
      expect(loadedConfig.openaiTTSVoice).toBe(config.openaiTTSVoice);
    });
  });

  /**
   * Fallback behavior tests with mocked API failures
   * 
   * Tests that the system gracefully falls back to native TTS on failure.
   * 
   */
  describe('Fallback behavior on API failure', () => {
    it('should fall back to native TTS when MiniMax provider fails', async () => {
      // Configure with MiniMax
      ttsService.setConfig({
        enabled: true,
        provider: 'minimax',
        minimaxApiKey: 'test-key',
        minimaxGroupId: 'test-group',
      });

      // Mock the provider to fail
      const provider = ttsService.providers.get('minimax');
      if (provider) {
        vi.spyOn(provider, 'speak').mockRejectedValue(new Error('API Error'));
      }

      // Should not throw, should fall back to native
      const speakPromise = ttsService.speak('テスト', 'ja');
      await vi.advanceTimersByTimeAsync(50);
      await expect(speakPromise).resolves.not.toThrow();
      
      // Native TTS should have been called as fallback
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should fall back to native TTS when OpenAI provider fails', async () => {
      ttsService.setConfig({
        enabled: true,
        provider: 'openai-tts',
        openaiTTSApiKey: 'test-key',
      });

      const provider = ttsService.providers.get('openai-tts');
      if (provider) {
        vi.spyOn(provider, 'speak').mockRejectedValue(new Error('API Error'));
      }

      const speakPromise = ttsService.speak('テスト', 'ja');
      await vi.advanceTimersByTimeAsync(50);
      await expect(speakPromise).resolves.not.toThrow();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should fall back to native TTS when provider returns null', async () => {
      ttsService.setConfig({
        enabled: true,
        provider: 'minimax',
        minimaxApiKey: 'test-key',
        minimaxGroupId: 'test-group',
      });

      const provider = ttsService.providers.get('minimax');
      if (provider) {
        vi.spyOn(provider, 'speak').mockResolvedValue(null);
      }

      const speakPromise = ttsService.speak('テスト', 'ja');
      await vi.advanceTimersByTimeAsync(50);
      await speakPromise;
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('should handle missing provider gracefully', async () => {
      ttsService.setConfig({
        enabled: true,
        provider: 'minimax',
        // No API credentials, so provider won't be initialized
      });

      // Remove the provider to simulate it not being available
      ttsService.providers.delete('minimax');

      const speakPromise = ttsService.speak('テスト', 'ja');
      await vi.advanceTimersByTimeAsync(50);
      await expect(speakPromise).resolves.not.toThrow();
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  /**
   * Cache integration tests
   * 
   * Tests that caching works correctly with the speak flow.
   */
  describe('Cache integration', () => {
    it('should cache audio after successful AI TTS call', async () => {
      const mockBlob = new Blob(['test audio'], { type: 'audio/mpeg' });

      ttsService.setConfig({
        enabled: true,
        provider: 'minimax',
        minimaxApiKey: 'test-key',
        minimaxGroupId: 'test-group',
        minimaxVoiceId: 'male-qn-qingse',
      });

      const provider = ttsService.providers.get('minimax');
      if (provider) {
        vi.spyOn(provider, 'speak').mockResolvedValue(mockBlob);
      }

      // Mock playAudioBlob
      vi.spyOn(ttsService, 'playAudioBlob').mockResolvedValue();

      await ttsService.speak('テスト', 'ja');

      // Verify audio was cached
      const cacheKey = ttsService.cache.generateKey('テスト', 'minimax', 'male-qn-qingse');
      expect(ttsService.cache.has(cacheKey)).toBe(true);
    });

    it('should not cache when falling back to native TTS', async () => {
      ttsService.setConfig({
        enabled: true,
        provider: 'minimax',
        minimaxApiKey: 'test-key',
        minimaxGroupId: 'test-group',
      });

      const provider = ttsService.providers.get('minimax');
      if (provider) {
        vi.spyOn(provider, 'speak').mockResolvedValue(null);
      }

      const speakPromise = ttsService.speak('テスト', 'ja');
      await vi.advanceTimersByTimeAsync(50);
      await speakPromise;

      // Cache should be empty since we fell back to native
      expect(ttsService.cache.size).toBe(0);
    });
  });

  /**
   * Language support tests
   * 
   * Tests that language codes are correctly passed to providers.
   */
  describe('Language support', () => {
    it('should pass Japanese language code correctly', async () => {
      ttsService.setConfig({
        enabled: false,
        provider: 'native',
      });

      const speakPromise = ttsService.speak('こんにちは', 'ja');
      await vi.advanceTimersByTimeAsync(50);
      await speakPromise;

      // Native TTS should have been called
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      
      // Check the utterance language
      const utterance = mockSpeechSynthesis._getCurrentUtterance();
      expect(utterance.lang).toBe('ja-JP');
    });

    it('should pass Korean language code correctly', async () => {
      ttsService.setConfig({
        enabled: false,
        provider: 'native',
      });

      const speakPromise = ttsService.speak('안녕하세요', 'ko');
      await vi.advanceTimersByTimeAsync(50);
      await speakPromise;

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      
      // Check the utterance language
      const utterance = mockSpeechSynthesis._getCurrentUtterance();
      expect(utterance.lang).toBe('ko-KR');
    });
  });
});
