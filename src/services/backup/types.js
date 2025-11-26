/**
 * Backup Data Types and Interfaces
 * 
 * This module defines the data models for the backup management system,
 * including BackupVersion, BackupData, BackupMetadata, and AppSettings.
 * 
 */

/**
 * @typedef {'local' | 'imported'} BackupSource
 */

/**
 * @typedef {Object} BackupVersion
 * @property {string} id - Unique identifier (UUID)
 * @property {number} versionNumber - Incremental version number
 * @property {string} timestamp - ISO 8601 format timestamp
 * @property {number} dataSize - Data size in bytes
 * @property {string} checksum - Data checksum for integrity verification
 * @property {BackupSource} source - Backup source ('local' or 'imported')
 * @property {string} [description] - Optional description
 */

/**
 * @typedef {Object} User
 * @property {string} name - User display name
 * @property {string} avatarId - Selected avatar ID
 * @property {number} xp - Experience points
 * @property {number} streak - Consecutive login days
 * @property {string} lastLogin - Last login date string
 * @property {string[]} favorites - Favorite word IDs
 * @property {string[]} mistakes - Mistake word IDs
 * @property {Object} dailyGoals - Daily goals data
 */

/**
 * @typedef {Object} StudyLog
 * @property {string} type - Log type (quiz, matching, etc.)
 * @property {string} content - Log content
 * @property {number|null} score - Score if applicable
 * @property {string} date - ISO 8601 date string
 */

/**
 * @typedef {Object} AIConfig
 * @property {boolean} enabled - Whether AI is enabled
 * @property {string} provider - AI provider name
 * @property {string} [apiKey] - API key
 * @property {string} [model] - Model name
 * @property {string} [endpoint] - API endpoint
 */

/**
 * @typedef {Object} TTSConfig
 * @property {boolean} enabled - Whether TTS is enabled
 * @property {'native' | 'minimax' | 'openai-tts'} provider - TTS provider
 * @property {string} [minimaxApiKey] - MiniMax API key
 * @property {string} [minimaxVoiceId] - MiniMax voice ID
 * @property {string} [openaiTTSApiKey] - OpenAI TTS API key
 * @property {string} [openaiTTSVoice] - OpenAI TTS voice
 */


/**
 * @typedef {Object} AppSettings
 * @property {'zh' | 'en'} lang - UI language
 * @property {'ja' | 'ko'} targetLang - Target learning language
 * @property {'light' | 'dark'} theme - UI theme
 * @property {boolean} onlineMode - Online mode enabled
 * @property {AIConfig} aiConfig - AI configuration
 * @property {TTSConfig} ttsConfig - TTS configuration
 */

/**
 * @typedef {Object} BackupData
 * @property {string} version - Backup format version
 * @property {BackupVersion} backupVersion - Backup version info
 * @property {User} user - User data
 * @property {StudyLog[]} logs - Study logs
 * @property {AppSettings} settings - Application settings
 * @property {string} exportDate - Export timestamp (ISO 8601)
 */

/**
 * @typedef {Object} BackupMetadata
 * @property {BackupVersion[]} versions - All backup versions
 * @property {string|null} lastBackupDate - Last backup timestamp
 * @property {string|null} reminderDismissedAt - Reminder dismissed timestamp
 */

// Current backup format version
export const BACKUP_FORMAT_VERSION = '2.0';

// Default backup metadata
export const DEFAULT_BACKUP_METADATA = {
  versions: [],
  lastBackupDate: null,
  reminderDismissedAt: null,
};

/**
 * Validate a BackupVersion object
 * @param {any} obj - Object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateBackupVersion = (obj) => {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['BackupVersion must be an object'] };
  }

  if (typeof obj.id !== 'string' || obj.id.length === 0) {
    errors.push('id must be a non-empty string');
  }

  if (typeof obj.versionNumber !== 'number' || obj.versionNumber < 1 || !Number.isInteger(obj.versionNumber)) {
    errors.push('versionNumber must be a positive integer');
  }

  if (typeof obj.timestamp !== 'string' || !isValidISODate(obj.timestamp)) {
    errors.push('timestamp must be a valid ISO 8601 date string');
  }

  if (typeof obj.dataSize !== 'number' || obj.dataSize < 0) {
    errors.push('dataSize must be a non-negative number');
  }

  if (typeof obj.checksum !== 'string' || obj.checksum.length === 0) {
    errors.push('checksum must be a non-empty string');
  }

  if (obj.source !== 'local' && obj.source !== 'imported') {
    errors.push('source must be "local" or "imported"');
  }

  if (obj.description !== undefined && typeof obj.description !== 'string') {
    errors.push('description must be a string if provided');
  }

  return { valid: errors.length === 0, errors };
};


/**
 * Validate a User object
 * @param {any} obj - Object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateUser = (obj) => {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['User must be an object'] };
  }

  if (typeof obj.name !== 'string') {
    errors.push('name must be a string');
  }

  if (typeof obj.avatarId !== 'string') {
    errors.push('avatarId must be a string');
  }

  if (typeof obj.xp !== 'number' || obj.xp < 0) {
    errors.push('xp must be a non-negative number');
  }

  if (typeof obj.streak !== 'number' || obj.streak < 0) {
    errors.push('streak must be a non-negative number');
  }

  if (typeof obj.lastLogin !== 'string') {
    errors.push('lastLogin must be a string');
  }

  if (!Array.isArray(obj.favorites)) {
    errors.push('favorites must be an array');
  }

  if (!Array.isArray(obj.mistakes)) {
    errors.push('mistakes must be an array');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate AppSettings object
 * @param {any} obj - Object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateAppSettings = (obj) => {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['AppSettings must be an object'] };
  }

  if (obj.lang !== 'zh' && obj.lang !== 'en') {
    errors.push('lang must be "zh" or "en"');
  }

  if (obj.targetLang !== 'ja' && obj.targetLang !== 'ko') {
    errors.push('targetLang must be "ja" or "ko"');
  }

  if (obj.theme !== 'light' && obj.theme !== 'dark') {
    errors.push('theme must be "light" or "dark"');
  }

  if (typeof obj.onlineMode !== 'boolean') {
    errors.push('onlineMode must be a boolean');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate a StudyLog object
 * @param {any} obj - Object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateStudyLog = (obj) => {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['StudyLog must be an object'] };
  }

  if (typeof obj.type !== 'string') {
    errors.push('type must be a string');
  }

  if (typeof obj.content !== 'string') {
    errors.push('content must be a string');
  }

  if (obj.score !== null && typeof obj.score !== 'number') {
    errors.push('score must be a number or null');
  }

  if (typeof obj.date !== 'string' || !isValidISODate(obj.date)) {
    errors.push('date must be a valid ISO 8601 date string');
  }

  return { valid: errors.length === 0, errors };
};


/**
 * Validate a BackupData object
 * @param {any} obj - Object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateBackupData = (obj) => {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['BackupData must be an object'] };
  }

  if (typeof obj.version !== 'string') {
    errors.push('version must be a string');
  }

  // Validate backupVersion
  const backupVersionResult = validateBackupVersion(obj.backupVersion);
  if (!backupVersionResult.valid) {
    errors.push(...backupVersionResult.errors.map(e => `backupVersion.${e}`));
  }

  // Validate user
  const userResult = validateUser(obj.user);
  if (!userResult.valid) {
    errors.push(...userResult.errors.map(e => `user.${e}`));
  }

  // Validate logs array
  if (!Array.isArray(obj.logs)) {
    errors.push('logs must be an array');
  } else {
    obj.logs.forEach((log, index) => {
      const logResult = validateStudyLog(log);
      if (!logResult.valid) {
        errors.push(...logResult.errors.map(e => `logs[${index}].${e}`));
      }
    });
  }

  // Validate settings
  const settingsResult = validateAppSettings(obj.settings);
  if (!settingsResult.valid) {
    errors.push(...settingsResult.errors.map(e => `settings.${e}`));
  }

  if (typeof obj.exportDate !== 'string' || !isValidISODate(obj.exportDate)) {
    errors.push('exportDate must be a valid ISO 8601 date string');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate a BackupMetadata object
 * @param {any} obj - Object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateBackupMetadata = (obj) => {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['BackupMetadata must be an object'] };
  }

  if (!Array.isArray(obj.versions)) {
    errors.push('versions must be an array');
  } else {
    obj.versions.forEach((version, index) => {
      const versionResult = validateBackupVersion(version);
      if (!versionResult.valid) {
        errors.push(...versionResult.errors.map(e => `versions[${index}].${e}`));
      }
    });
  }

  if (obj.lastBackupDate !== null && (typeof obj.lastBackupDate !== 'string' || !isValidISODate(obj.lastBackupDate))) {
    errors.push('lastBackupDate must be a valid ISO 8601 date string or null');
  }

  if (obj.reminderDismissedAt !== null && (typeof obj.reminderDismissedAt !== 'string' || !isValidISODate(obj.reminderDismissedAt))) {
    errors.push('reminderDismissedAt must be a valid ISO 8601 date string or null');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Check if a string is a valid ISO 8601 date
 * @param {string} str - String to check
 * @returns {boolean}
 */
export const isValidISODate = (str) => {
  if (typeof str !== 'string') return false;
  const date = new Date(str);
  return !isNaN(date.getTime());
};

/**
 * Generate a simple checksum for data integrity verification
 * @param {string} data - Data string to checksum
 * @returns {string} - Hex checksum string
 */
export const generateChecksum = (data) => {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

/**
 * Create a default BackupVersion object
 * @param {Partial<BackupVersion>} overrides - Optional overrides
 * @returns {BackupVersion}
 */
export const createBackupVersion = (overrides = {}) => ({
  id: '',
  versionNumber: 1,
  timestamp: new Date().toISOString(),
  dataSize: 0,
  checksum: '',
  source: 'local',
  ...overrides,
});

/**
 * Create a default BackupData object
 * @param {Partial<BackupData>} overrides - Optional overrides
 * @returns {BackupData}
 */
export const createBackupData = (overrides = {}) => ({
  version: BACKUP_FORMAT_VERSION,
  backupVersion: createBackupVersion(),
  user: null,
  logs: [],
  settings: null,
  exportDate: new Date().toISOString(),
  ...overrides,
});

/**
 * Create a default BackupMetadata object
 * @returns {BackupMetadata}
 */
export const createBackupMetadata = () => ({
  ...DEFAULT_BACKUP_METADATA,
});
