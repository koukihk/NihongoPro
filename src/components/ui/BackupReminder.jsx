/**
 * BackupReminder Component
 * 
 * Displays a non-intrusive reminder to backup data when 7 days have passed
 * since the last backup. Includes dismiss functionality with 3-day cooldown.
 * 
 */

import { useState, useEffect } from 'react';
import { CloudUpload, X } from 'lucide-react';
import { storageService } from '../../services/backup';

/**
 * BackupReminder component props
 * @typedef {Object} BackupReminderProps
 * @property {Object} t - Translations object
 * @property {Function} onBackupClick - Callback when user clicks to create backup
 */

/**
 * BackupReminder - Non-intrusive reminder to backup data
 * @param {BackupReminderProps} props
 */
export function BackupReminder({ t, onBackupClick }) {
  const [showReminder, setShowReminder] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Check if reminder should be shown on mount
  useEffect(() => {
    const shouldShow = storageService.shouldShowBackupReminder();
    if (shouldShow) {
      setShowReminder(true);
      // Delay visibility for animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  // Handle dismiss with 3-day cooldown (Requirement 7.2)
  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setShowReminder(false);
      storageService.setReminderDismissedAt(new Date());
    }, 300);
  };

  // Handle backup click
  const handleBackupClick = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowReminder(false);
      if (onBackupClick) {
        onBackupClick();
      }
    }, 300);
  };

  if (!showReminder) {
    return null;
  }

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md transition-all duration-300 ${isVisible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-4 opacity-0'
        }`}
    >
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 p-4 flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 p-2 bg-white/20 rounded-xl">
          <CloudUpload size={24} className="text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">
            {t.backupReminderTitle || 'Time to backup!'}
          </p>
          <p className="text-white/80 text-xs truncate">
            {t.backupReminderDesc || "It's been a while since your last backup"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleBackupClick}
            className="px-3 py-1.5 bg-white text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors"
          >
            {t.backupReminderAction || 'Backup'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label={t.close || 'Close'}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default BackupReminder;
