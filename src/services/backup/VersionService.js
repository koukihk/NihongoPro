/**
 * VersionService
 * 
 * Manages version numbers and backup metadata for the backup system.
 * Provides methods to generate unique version IDs, get next version numbers,
 * and format version labels for display.
 * 
 */

import { storageService } from './StorageService.js';

/**
 * Generate a UUID v4 string
 * @returns {string} A UUID v4 string
 */
export const generateUUID = () => {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * VersionService class for managing backup versions
 */
export class VersionService {
  /**
   * @param {import('./StorageService.js').StorageService} [storage] - Optional storage service instance
   */
  constructor(storage = storageService) {
    this._storage = storage;
  }

  /**
   * Generate a unique version ID using UUID
   * @returns {string} A UUID v4 string
   */
  generateVersionId() {
    return generateUUID();
  }

  /**
   * Get the next version number with monotonic increment
   * Ensures each new backup has a version number strictly greater than all previous backups.
   * @returns {number} The next version number (starting from 1)
   */
  getNextVersionNumber() {
    const metadata = this._storage.getBackupMetadata();
    const versions = metadata.versions || [];

    if (versions.length === 0) {
      return 1;
    }

    // Find the maximum version number among all existing versions
    const maxVersion = versions.reduce((max, version) => {
      return Math.max(max, version.versionNumber || 0);
    }, 0);

    return maxVersion + 1;
  }

  /**
   * Format a version label for display
   * @param {import('./types.js').BackupVersion} version - The backup version to format
   * @returns {string} Formatted version label (e.g., "v1 - 2024-01-15 14:30")
   */
  formatVersionLabel(version) {
    if (!version) {
      return '';
    }

    const versionNum = version.versionNumber || 1;
    const timestamp = version.timestamp ? new Date(version.timestamp) : new Date();

    // Format date as YYYY-MM-DD HH:mm
    const dateStr = this._formatDate(timestamp);

    return `v${versionNum} - ${dateStr}`;
  }

  /**
   * Generate a backup filename according to the naming convention
   * Format: nihongopro_backup_v{version}_{timestamp}.zip
   * @param {import('./types.js').BackupVersion} version - The backup version
   * @returns {string} The formatted filename
   */
  generateBackupFilename(version) {
    if (!version) {
      return 'nihongopro_backup.zip';
    }

    const versionNum = version.versionNumber || 1;
    const timestamp = version.timestamp ? new Date(version.timestamp) : new Date();

    // Format timestamp as YYYYMMDD_HHmmss for filename
    const timestampStr = this._formatTimestampForFilename(timestamp);

    return `nihongopro_backup_v${versionNum}_${timestampStr}.zip`;
  }

  /**
   * Format a date for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string (YYYY-MM-DD HH:mm)
   * @private
   */
  _formatDate(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  /**
   * Format a timestamp for use in filenames
   * @param {Date} date - Date to format
   * @returns {string} Formatted timestamp string (YYYYMMDD_HHmmss)
   * @private
   */
  _formatTimestampForFilename(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'invalid';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }
}

// Export singleton instance for convenience
export const versionService = new VersionService();
