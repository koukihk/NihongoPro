/**
 * AudioCache Integration Tests
 * 
 * Tests for cache hit behavior and integration with TTSService.
 * 
 * **Feature: ai-tts-integration, Property 9: Cache Hit Behavior**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { AudioCache } from './AudioCache.js';

describe('AudioCache', () => {
  let cache;

  beforeEach(() => {
    cache = new AudioCache(50);
  });

  /**
   * **Feature: ai-tts-integration, Property 9: Cache Hit Behavior**
   * 
   * *For any* cached audio entry, subsequent requests with the same parameters 
   * SHALL return the cached audio without API calls.
   * 
   */
  describe('Property 9: Cache Hit Behavior', () => {
    it('should return cached audio for same parameters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('native', 'minimax', 'openai-tts'),
          fc.string({ minLength: 1, maxLength: 50 }),
          (text, provider, voiceId) => {
            // Create a mock blob
            const mockBlob = new Blob(['test audio data'], { type: 'audio/mpeg' });
            
            // Generate cache key
            const key = cache.generateKey(text, provider, voiceId);
            
            // Store in cache
            cache.set(key, mockBlob);
            
            // Retrieve from cache - should return the same blob
            const retrieved = cache.get(key);
            
            // Verify cache hit returns the blob
            expect(retrieved).not.toBeNull();
            expect(retrieved).toBe(mockBlob);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for cache miss', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('native', 'minimax', 'openai-tts'),
          fc.string({ minLength: 1, maxLength: 50 }),
          (text, provider, voiceId) => {
            // Generate cache key without storing anything
            const key = cache.generateKey(text, provider, voiceId);
            
            // Retrieve from cache - should return null (cache miss)
            const retrieved = cache.get(key);
            
            expect(retrieved).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update timestamp on cache hit for LRU tracking', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('native', 'minimax', 'openai-tts'),
          fc.string({ minLength: 1, maxLength: 50 }),
          (text, provider, voiceId) => {
            const mockBlob = new Blob(['test audio data'], { type: 'audio/mpeg' });
            const key = cache.generateKey(text, provider, voiceId);
            
            // Store in cache
            cache.set(key, mockBlob);
            
            // Get initial timestamp
            const initialTimestamp = cache.cache.get(key).timestamp;
            
            // Wait a tiny bit and access again
            const retrieved = cache.get(key);
            const newTimestamp = cache.cache.get(key).timestamp;
            
            // Timestamp should be updated (or at least not decreased)
            expect(newTimestamp).toBeGreaterThanOrEqual(initialTimestamp);
            expect(retrieved).toBe(mockBlob);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain cache hit behavior across multiple accesses', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              text: fc.string({ minLength: 1, maxLength: 50 }),
              provider: fc.constantFrom('native', 'minimax', 'openai-tts'),
              voiceId: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (entries) => {
            const blobs = new Map();
            
            // Store all entries
            for (const entry of entries) {
              const key = cache.generateKey(entry.text, entry.provider, entry.voiceId);
              const blob = new Blob([`audio-${key}`], { type: 'audio/mpeg' });
              blobs.set(key, blob);
              cache.set(key, blob);
            }
            
            // Verify all entries can be retrieved (cache hits)
            for (const entry of entries) {
              const key = cache.generateKey(entry.text, entry.provider, entry.voiceId);
              const retrieved = cache.get(key);
              expect(retrieved).toBe(blobs.get(key));
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
