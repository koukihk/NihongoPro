/**
 * Backup Service Module
 * 
 * Exports all backup-related types, constants, and validation functions.
 */

export {
  // Constants
  BACKUP_FORMAT_VERSION,
  DEFAULT_BACKUP_METADATA,
  
  // Validation functions
  validateBackupVersion,
  validateUser,
  validateAppSettings,
  validateStudyLog,
  validateBackupData,
  validateBackupMetadata,
  isValidISODate,
  
  // Utility functions
  generateChecksum,
  createBackupVersion,
  createBackupData,
  createBackupMetadata,
} from './types.js';

// StorageService
export { StorageService, StorageError, storageService } from './StorageService.js';

// VersionService
export { VersionService, versionService, generateUUID } from './VersionService.js';

// BackupManagerService
export { BackupManagerService, BackupError, backupManagerService } from './BackupManagerService.js';
