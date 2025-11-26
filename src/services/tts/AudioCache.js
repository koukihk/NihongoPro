/**
 * AudioCache - LRU Cache for TTS Audio
 * 
 * Caches generated audio blobs to reduce API calls and improve performance.
 * Uses a Least Recently Used (LRU) eviction strategy.
 * 
 */

/**
 * @typedef {Object} CacheEntry
 * @property {Blob} blob - The cached audio blob
 * @property {number} timestamp - When the entry was last accessed
 */

export class AudioCache {
  /**
   * Create an AudioCache instance
   * @param {number} maxSize - Maximum number of entries (default: 50)
   */
  constructor(maxSize = 50) {
    /** @type {number} */
    this.maxSize = maxSize;
    
    /** @type {Map<string, CacheEntry>} */
    this.cache = new Map();
  }

  /**
   * Generate a unique cache key based on text, provider, and voice
   * Property 8: Cache Key Uniqueness - Different combinations produce different keys
   * 
   * @param {string} text - The text being spoken
   * @param {string} provider - The TTS provider name
   * @param {string} voiceId - The voice identifier
   * @returns {string} - Unique cache key
   */
  generateKey(text, provider, voiceId) {
    // Use a delimiter that's unlikely to appear in normal text
    // to ensure uniqueness of the key
    return `${provider}|${voiceId}|${text}`;
  }

  /**
   * Get a cached audio blob
   * Property 9: Cache Hit Behavior - Returns cached audio without API calls
   * 
   * @param {string} key - The cache key
   * @returns {Blob|null} - The cached blob or null if not found
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Update timestamp for LRU tracking (mark as recently used)
    entry.timestamp = Date.now();
    
    return entry.blob;
  }

  /**
   * Store an audio blob in the cache
   * Property 10: Cache Size Limit - Ensures cache never exceeds maxSize
   * 
   * @param {string} key - The cache key
   * @param {Blob} blob - The audio blob to cache
   */
  set(key, blob) {
    // If key already exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, {
        blob,
        timestamp: Date.now(),
      });
      return;
    }
    
    // Evict oldest entries if cache is at capacity
    while (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    // Add new entry
    this.cache.set(key, {
      blob,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if a key exists in the cache
   * @param {string} key - The cache key
   * @returns {boolean} - Whether the key exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Get the current number of entries in the cache
   * @returns {number} - Number of cached entries
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Clear all entries from the cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Remove the oldest (least recently used) entry from the cache
   * @private
   */
  evictOldest() {
    if (this.cache.size === 0) {
      return;
    }
    
    let oldestKey = null;
    let oldestTimestamp = Infinity;
    
    // Find the entry with the oldest timestamp
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey !== null) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cache statistics for debugging
   * @returns {{size: number, maxSize: number, keys: string[]}}
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export a singleton instance for app-wide use
export const audioCache = new AudioCache();
