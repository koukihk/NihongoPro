/**
 * VersionService Unit Tests
 * 
 * Tests for version management functionality including UUID generation,
 * version number monotonicity, and version label formatting.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VersionService, generateUUID } from './VersionService.js';

// Mock storage service for testing
const createMockStorage = (versions = []) => ({
  getBackupMetadata: vi.fn(() => ({
    versions,
    lastBackupDate: null,
    reminderDismissedAt: null,
  })),
});

describe('generateUUID', () => {
  it('should generate a valid UUID v4 format', () => {
    const uuid = generateUUID();
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });

  it('should generate unique UUIDs', () => {
    const uuids = new Set();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUID());
    }
    expect(uuids.size).toBe(100);
  });
});

describe('VersionService', () => {
  describe('generateVersionId', () => {
    it('should generate a valid UUID', () => {
      const mockStorage = createMockStorage();
      const service = new VersionService(mockStorage);
      
      const id = service.generateVersionId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });
  });

  describe('getNextVersionNumber', () => {
    it('should return 1 when no versions exist', () => {
      const mockStorage = createMockStorage([]);
      const service = new VersionService(mockStorage);
      
      expect(service.getNextVersionNumber()).toBe(1);
    });

    it('should return max + 1 when versions exist', () => {
      const mockStorage = createMockStorage([
        { id: '1', versionNumber: 1 },
        { id: '2', versionNumber: 3 },
        { id: '3', versionNumber: 2 },
      ]);
      const service = new VersionService(mockStorage);
      
      expect(service.getNextVersionNumber()).toBe(4);
    });

    it('should handle versions with missing versionNumber', () => {
      const mockStorage = createMockStorage([
        { id: '1' },
        { id: '2', versionNumber: 5 },
      ]);
      const service = new VersionService(mockStorage);
      
      expect(service.getNextVersionNumber()).toBe(6);
    });
  });

  describe('formatVersionLabel', () => {
    it('should format version label correctly', () => {
      const mockStorage = createMockStorage();
      const service = new VersionService(mockStorage);
      
      const version = {
        id: 'test-id',
        versionNumber: 5,
        timestamp: '2024-03-15T14:30:00.000Z',
      };
      
      const label = service.formatVersionLabel(version);
      expect(label).toMatch(/^v5 - \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });

    it('should return empty string for null version', () => {
      const mockStorage = createMockStorage();
      const service = new VersionService(mockStorage);
      
      expect(service.formatVersionLabel(null)).toBe('');
    });

    it('should use default values for missing properties', () => {
      const mockStorage = createMockStorage();
      const service = new VersionService(mockStorage);
      
      const version = { id: 'test-id' };
      const label = service.formatVersionLabel(version);
      expect(label).toMatch(/^v1 - \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });
  });

  describe('generateBackupFilename', () => {
    it('should generate filename in correct format', () => {
      const mockStorage = createMockStorage();
      const service = new VersionService(mockStorage);
      
      const version = {
        id: 'test-id',
        versionNumber: 3,
        timestamp: '2024-03-15T14:30:45.000Z',
      };
      
      const filename = service.generateBackupFilename(version);
      // Format: nihongopro_backup_v{version}_{timestamp}.zip
      expect(filename).toMatch(/^nihongopro_backup_v3_\d{8}_\d{6}\.zip$/);
    });

    it('should return default filename for null version', () => {
      const mockStorage = createMockStorage();
      const service = new VersionService(mockStorage);
      
      expect(service.generateBackupFilename(null)).toBe('nihongopro_backup.zip');
    });
  });
});
