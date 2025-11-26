import { useState, useEffect, useRef } from 'react';
import { X, Database, Download, Upload, Trash2, RefreshCw, Clock, HardDrive, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { backupManagerService, storageService } from '../../services/backup/index.js';

/**
 * DataManagementModal - 数据管理弹窗
 * Modal for managing backup and restore operations
 * 
 */

/**
 * Format file size to human readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Format timestamp to localized date string
 * @param {string} timestamp - ISO 8601 timestamp
 * @param {boolean} isZh - Whether to use Chinese locale
 * @returns {string} Formatted date string
 */
const formatTimestamp = (timestamp, isZh) => {
  const date = new Date(timestamp);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString(isZh ? 'zh-CN' : 'en-US', options);
};

/**
 * BackupList - 备份列表子组件
 * Displays list of backup versions with pagination
 */
const BackupList = ({
  t,
  isZh,
  backups,
  selectedBackup,
  onSelect,
  onRestore,
  onDelete,
  onExport,
  isLoading
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(backups.length / itemsPerPage);

  // Reset to page 1 when backups change
  useEffect(() => {
    setCurrentPage(1);
  }, [backups.length]);

  // Get current page items
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBackups = backups.slice(startIndex, startIndex + itemsPerPage);

  // Empty state (Requirement 3.3)
  if (backups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <Database size={32} className="text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-bold mb-2">{t.backupEmptyTitle}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">{t.backupEmptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 min-h-[200px]">
      {/* Backup list */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto ios-scrollbar pr-1">
        {currentBackups.map((backup) => (
          <button
            key={backup.id}
            onClick={() => onSelect(backup)}
            disabled={isLoading}
            className={`w-full p-3 rounded-xl text-left transition-all ${selectedBackup?.id === backup.id
              ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-500'
              : 'bg-white/50 dark:bg-gray-800/50 border border-white/40 dark:border-white/10 hover:bg-white/70 dark:hover:bg-gray-700/50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${backup.source === 'imported'
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                  : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  }`}>
                  {backup.source === 'imported' ? <Download size={16} /> : <HardDrive size={16} />}
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white text-sm">
                    v{backup.versionNumber}
                    {backup.source === 'imported' && (
                      <span className="ml-2 text-xs text-purple-500 dark:text-purple-400">
                        ({t.backupImported})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                    <Clock size={10} className="mr-1" />
                    {formatTimestamp(backup.timestamp, isZh)}
                  </p>
                </div>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                {formatFileSize(backup.dataSize)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Pagination (Requirement 3.4) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || isLoading}
            className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-bold">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || isLoading}
            className="p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Action buttons for selected backup */}
      <div className={`flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2 transition-all duration-200 overflow-hidden ${selectedBackup ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 pt-0 mt-0 border-t-0'}`}>
        <button
          onClick={() => selectedBackup && onRestore(selectedBackup)}
          disabled={isLoading || !selectedBackup}
          className="flex-1 py-2 px-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all disabled:opacity-50 flex items-center justify-center"
        >
          <RefreshCw size={14} className="mr-1" /> {t.backupRestore}
        </button>
        <button
          onClick={() => selectedBackup && onExport(selectedBackup)}
          disabled={isLoading || !selectedBackup}
          className="py-2 px-3 rounded-xl font-bold text-sm bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 border border-white/40 dark:border-white/10 hover:bg-white dark:hover:bg-gray-700 transition-all disabled:opacity-50"
        >
          <Upload size={14} />
        </button>
        <button
          onClick={() => onDelete(selectedBackup)}
          disabled={isLoading || !selectedBackup}
          className="py-2 px-3 rounded-xl font-bold text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

/**
 * ConfirmDialog - 确认对话框子组件
 * Inline confirmation dialog for restore/delete actions
 */
const ConfirmDialog = ({ t, title, description, confirmLabel, onConfirm, onCancel, isDestructive = false }) => {
  return (
    <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center p-6 z-10 animate-fade-in">
      <div className={`p-4 rounded-full mb-4 ${isDestructive ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
        <AlertCircle size={32} className={isDestructive ? 'text-red-500' : 'text-blue-500'} />
      </div>
      <h4 className="text-lg font-black text-gray-800 dark:text-white mb-2">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-xs">{description}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="px-5 py-2 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-800/50 border border-white/60 dark:border-white/10"
        >
          {t.cancel}
        </button>
        <button
          onClick={onConfirm}
          className={`px-5 py-2 rounded-xl font-bold text-white shadow-lg ${isDestructive
            ? 'bg-gradient-to-r from-red-500 to-pink-500 shadow-red-500/30'
            : 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/30'
            }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};

/**
 * DataManagementModal - Main modal component
 */
const DataManagementModal = ({
  t,
  isOpen,
  onClose,
  user,
  logs,
  settings,
  onRestore,
  lang = 'zh'
}) => {
  const isZh = lang === 'zh';
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const [confirmDialog, setConfirmDialog] = useState(null); // { type: 'restore' | 'delete', backup: BackupVersion }
  const fileInputRef = useRef(null);

  // Store zip blobs for restoration/export
  const [zipBlobs, setZipBlobs] = useState({});

  // Load backup history on mount
  useEffect(() => {
    if (isOpen) {
      loadBackupHistory();
    }
  }, [isOpen]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadBackupHistory = () => {
    const history = backupManagerService.getBackupHistory();
    setBackups(history);
  };

  // Create backup (Requirement 2.1)
  const handleCreateBackup = async () => {
    setIsCreating(true);
    setMessage(null);
    try {
      const version = await backupManagerService.createBackup({ user, logs, settings });
      // Store the zip blob
      if (version._zipBlob) {
        setZipBlobs(prev => ({ ...prev, [version.id]: version._zipBlob }));
      }
      loadBackupHistory();
      // setMessage({ type: 'success', text: t.backupCreateSuccess });
    } catch (error) {
      console.error('Backup creation failed:', error);
      setMessage({ type: 'error', text: t.backupCreateFail });
    }
    setIsCreating(false);
  };

  // Restore backup (Requirement 4.1)
  const handleRestoreConfirm = async () => {
    if (!confirmDialog?.backup) return;

    setIsLoading(true);
    setConfirmDialog(null);
    try {
      const zipBlob = zipBlobs[confirmDialog.backup.id];
      if (!zipBlob) {
        throw new Error('Backup file not found');
      }
      const backupData = await backupManagerService.restoreBackup(confirmDialog.backup, zipBlob);
      onRestore(backupData);
      setMessage({ type: 'success', text: t.backupRestoreSuccess });
      onClose();
    } catch (error) {
      console.error('Restore failed:', error);
      setMessage({ type: 'error', text: t.backupRestoreFail });
    }
    setIsLoading(false);
  };

  // Delete backup (Requirement 6.1)
  const handleDeleteConfirm = () => {
    if (!confirmDialog?.backup) return;

    setIsLoading(true);
    setConfirmDialog(null);
    try {
      backupManagerService.deleteBackup(confirmDialog.backup.id);
      // Remove from zip blobs
      setZipBlobs(prev => {
        const newBlobs = { ...prev };
        delete newBlobs[confirmDialog.backup.id];
        return newBlobs;
      });
      setSelectedBackup(null);
      loadBackupHistory();
      // setMessage({ type: 'success', text: t.backupDeleteSuccess });
    } catch (error) {
      console.error('Delete failed:', error);
      setMessage({ type: 'error', text: t.backupDeleteFail });
    }
    setIsLoading(false);
  };

  // Export backup file
  const handleExport = async (backup) => {
    try {
      const zipBlob = zipBlobs[backup.id];
      if (!zipBlob) {
        setMessage({ type: 'error', text: t.backupExportFail });
        return;
      }
      await backupManagerService.exportBackupFile(backup, zipBlob);
      setMessage({ type: 'success', text: t.backupExportSuccess });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: t.backupExportFail });
    }
  };

  // Import backup file (Requirement 5.1)
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessage(null);
    try {
      const version = await backupManagerService.importBackup(file);
      // Store the zip blob for potential restoration
      const arrayBuffer = await file.arrayBuffer();
      setZipBlobs(prev => ({
        ...prev,
        [version.id]: new Blob([arrayBuffer], { type: 'application/zip' })
      }));
      loadBackupHistory();
      setSelectedBackup(version);
      setMessage({ type: 'success', text: t.backupImportSuccess });
    } catch (error) {
      console.error('Import failed:', error);
      const errorMessage = error.code === 'DUPLICATE_VERSION'
        ? t.backupImportDuplicate
        : error.code === 'INVALID_FORMAT'
          ? t.backupImportInvalid
          : t.backupImportFail;
      setMessage({ type: 'error', text: errorMessage });
    }
    setIsLoading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with animation */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal container with animation */}
      <div className="relative w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/60 dark:border-white/10 animate-scale-up max-h-[85vh] overflow-hidden flex flex-col">

        {/* Confirm dialog overlay */}
        {confirmDialog && (
          <ConfirmDialog
            t={t}
            title={confirmDialog.type === 'restore' ? t.backupRestoreTitle : t.backupDeleteTitle}
            description={
              confirmDialog.type === 'restore'
                ? t.backupRestoreDesc.replace('{version}', `v${confirmDialog.backup.versionNumber}`)
                : t.backupDeleteDesc.replace('{version}', `v${confirmDialog.backup.versionNumber}`)
            }
            confirmLabel={confirmDialog.type === 'restore' ? t.backupRestore : t.confirm}
            onConfirm={confirmDialog.type === 'restore' ? handleRestoreConfirm : handleDeleteConfirm}
            onCancel={() => setConfirmDialog(null)}
            isDestructive={confirmDialog.type === 'delete'}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center">
            <Database size={24} className="mr-2 text-blue-500" /> {t.dataManagement}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 ios-scrollbar">
          {/* Message toast */}
          {message && (
            <div className={`mb-4 p-3 rounded-xl flex items-center animate-fade-in ${message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
              {message.type === 'success'
                ? <CheckCircle size={16} className="mr-2 shrink-0" />
                : <AlertCircle size={16} className="mr-2 shrink-0" />
              }
              <span className="text-sm font-bold">{message.text}</span>
            </div>
          )}

          {/* Backup Section (Requirement 1.3 - visual separation) */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
              <Upload size={14} className="mr-2" /> {t.backupSection}
            </h4>
            <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-white/40 dark:border-white/10">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t.backupDesc}</p>
              <button
                onClick={handleCreateBackup}
                disabled={isCreating || isLoading}
                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isCreating ? (
                  <>
                    <RefreshCw size={18} className="mr-2 animate-spin" />
                    {t.backupCreating}
                  </>
                ) : (
                  <>
                    <HardDrive size={18} className="mr-2" />
                    {t.backupCreate}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Restore Section (Requirement 1.3 - visual separation) */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center">
              <Download size={14} className="mr-2" /> {t.restoreSection}
            </h4>
            <div className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-white/40 dark:border-white/10">
              <BackupList
                t={t}
                isZh={isZh}
                backups={backups}
                selectedBackup={selectedBackup}
                onSelect={setSelectedBackup}
                onRestore={(backup) => setConfirmDialog({ type: 'restore', backup })}
                onDelete={(backup) => setConfirmDialog({ type: 'delete', backup })}
                onExport={handleExport}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Footer with import button */}
        <div className="p-6 pt-4 shrink-0 border-t border-gray-200/50 dark:border-gray-700/50">
          <label className="w-full py-3 rounded-xl font-bold bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 border border-white/40 dark:border-white/10 hover:bg-white dark:hover:bg-gray-700 transition-all flex items-center justify-center cursor-pointer">
            <Download size={18} className="mr-2" />
            {t.backupImport}
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleImport}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default DataManagementModal;
