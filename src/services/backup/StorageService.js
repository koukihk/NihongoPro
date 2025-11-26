/**
 * StorageService
 * 
 * Handles localStorage operations for backup metadata management.
 * Provides methods to save, retrieve, and remove backup metadata,
 * as well as manage last backup date and reminder dismissal state.
 * 
 */

import {
  DEFAULT_BACKUP_METADATA,
  validateBackupMetadata,
  validateBackupVersion
} from './types.js';

// Storage keys
const STORAGE_KEYS = {
  BACKUP_METADATA: 'nihongopro_backup_metadata',
  LAST_BACKUP_DATE: 'nihongopro_last_backup_date',
  REMINDER_DISMISSED_AT: 'nihongopro_reminder_dismissed_at',
};

/**
 * Custom error class for storage-related errors
 */
export class StorageError extends Error {
  /**
   * @param {string} message - Error message
   * @param {'QUOTA_EXCEEDED' | 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN'} code - Error code
   */
  constructor(message, code = 'UNKNOWN') {
    super(message);
    this.name = 'StorageError';
    this.code = code;
  }
}

/**
 * StorageService class for managing backup metadata in localStorage
 */
export class StorageService {
  /**
   * Save backup metadata to localStorage
   * @param {import('./types.js').BackupMetadata} metadata - Metadata to save
   * @throws {StorageError} If validation fails or storage quota is exceeded
   */
  saveBackupMetadata(metadata) {
    // Validate metadata before saving
    const validation = validateBackupMetadata(metadata);
    if (!validation.valid) {
      throw new StorageError(
        `Invalid backup metadata: ${validation.errors.join(', ')}`,
        'VALIDATION_ERROR'
      );
    }

    try {
      const serialized = JSON.stringify(metadata);
      localStorage.setItem(STORAGE_KEYS.BACKUP_METADATA, serialized);
    } catch (error) {
      if (this._isQuotaExceededError(error)) {
        throw new StorageError(
          'Storage quota exceeded. Please delete some old backups to free up space.',
          'QUOTA_EXCEEDED'
        );
      }
      throw new StorageError(`Failed to save backup metadata: ${error.message}`, 'UNKNOWN');
    }
  }

  /**
   * Get backup metadata from localStorage
   * @returns {import('./types.js').BackupMetadata} Backup metadata or default if not found
   */
  getBackupMetadata() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BACKUP_METADATA);

      if (!stored) {
        return { ...DEFAULT_BACKUP_METADATA };
      }

      const parsed = JSON.parse(stored);

      // Validate the parsed data
      const validation = validateBackupMetadata(parsed);
      if (!validation.valid) {
        console.warn('Invalid backup metadata in storage, returning default:', validation.errors);
        return { ...DEFAULT_BACKUP_METADATA };
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse backup metadata:', error);
      return { ...DEFAULT_BACKUP_METADATA };
    }
  }

  /**
   * Remove a specific backup version from metadata
   * @param {string} versionId - The ID of the version to remove
   * @returns {boolean} True if the version was found and removed
   * @throws {StorageError} If saving fails
   */
  removeBackupMetadata(versionId) {
    const metadata = this.getBackupMetadata();
    const initialLength = metadata.versions.length;

    metadata.versions = metadata.versions.filter(v => v.id !== versionId);

    if (metadata.versions.length === initialLength) {
      return false; // Version not found
    }

    this.saveBackupMetadata(metadata);
    return true;
  }

  /**
   * Add a backup version to metadata
   * @param {import('./types.js').BackupVersion} version - Version to add
   * @throws {StorageError} If validation fails or saving fails
   */
  addBackupVersion(version) {
    // Validate the version
    const validation = validateBackupVersion(version);
    if (!validation.valid) {
      throw new StorageError(
        `Invalid backup version: ${validation.errors.join(', ')}`,
        'VALIDATION_ERROR'
      );
    }

    const metadata = this.getBackupMetadata();

    // Check for duplicate ID
    const existingIndex = metadata.versions.findIndex(v => v.id === version.id);
    if (existingIndex >= 0) {
      // Replace existing version
      metadata.versions[existingIndex] = version;
    } else {
      // Add new version
      metadata.versions.push(version);
    }

    // Update last backup date
    metadata.lastBackupDate = version.timestamp;

    this.saveBackupMetadata(metadata);
  }

  /**
   * Get the last backup date
   * @returns {Date | null} Last backup date or null if never backed up
   */
  getLastBackupDate() {
    const metadata = this.getBackupMetadata();

    if (metadata.lastBackupDate) {
      const date = new Date(metadata.lastBackupDate);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  }

  /**
   * Set the last backup date
   * @param {Date} date - The date to set
   * @throws {StorageError} If saving fails
   */
  setLastBackupDate(date) {
    const metadata = this.getBackupMetadata();
    metadata.lastBackupDate = date.toISOString();
    this.saveBackupMetadata(metadata);
  }

  /**
   * Get the reminder dismissed timestamp
   * @returns {Date | null} Reminder dismissed date or null
   */
  getReminderDismissedAt() {
    const metadata = this.getBackupMetadata();

    if (metadata.reminderDismissedAt) {
      const date = new Date(metadata.reminderDismissedAt);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  }

  /**
   * Set the reminder dismissed timestamp
   * @param {Date} date - The date when reminder was dismissed
   * @throws {StorageError} If saving fails
   */
  setReminderDismissedAt(date) {
    const metadata = this.getBackupMetadata();
    metadata.reminderDismissedAt = date.toISOString();
    this.saveBackupMetadata(metadata);
  }

  /**
   * Clear the reminder dismissed timestamp
   * @throws {StorageError} If saving fails
   */
  clearReminderDismissedAt() {
    const metadata = this.getBackupMetadata();
    metadata.reminderDismissedAt = null;
    this.saveBackupMetadata(metadata);
  }

  /**
   * Check if a backup reminder should be shown
   * Based on Requirements 7.1, 7.2, 7.3:
   * - Show reminder if 7 days have passed since last backup
   * - Don't show if dismissed within last 3 days
   * @returns {boolean} True if reminder should be shown
   */
  shouldShowBackupReminder() {
    const lastBackupDate = this.getLastBackupDate();
    const reminderDismissedAt = this.getReminderDismissedAt();
    const now = new Date();

    // If reminder was dismissed within last 3 days, don't show
    if (reminderDismissedAt) {
      const daysSinceDismissal = (now.getTime() - reminderDismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 3) {
        return false;
      }
    }

    // If never backed up, show reminder
    if (!lastBackupDate) {
      return true;
    }

    // Show reminder if 7 days have passed since last backup
    const daysSinceBackup = (now.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceBackup >= 7;
  }

  /**
   * Clear all backup metadata (for testing or reset)
   */
  clearAllMetadata() {
    localStorage.removeItem(STORAGE_KEYS.BACKUP_METADATA);
  }

  /**
   * Check if an error is a quota exceeded error
   * @param {Error} error - Error to check
   * @returns {boolean}
   * @private
   */
  _isQuotaExceededError(error) {
    return (
      error instanceof DOMException &&
      (error.code === 22 || // Legacy code
        error.code === 1014 || // Firefox
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
  }
}

// Export singleton instance for convenience
export const storageService = new StorageService();
