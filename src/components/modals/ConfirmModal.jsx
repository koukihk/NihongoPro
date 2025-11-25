import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * ConfirmModal - 确认对话框
 * A confirmation dialog with customizable title, description, and action buttons
 */
const ConfirmModal = ({ title, description, confirmLabel, cancelLabel, onConfirm, onCancel }) => {
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsEntering(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-400 ${isEntering ? 'opacity-100' : 'opacity-0'}`}
        onClick={onCancel}
      ></div>
      <div className={`relative w-full max-w-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/60 dark:border-white/10 ring-1 ring-white/40 dark:ring-white/5 transition-all duration-500 ${isEntering ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/60 dark:hover:bg-gray-800 transition-colors"><X size={20} className="text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-300 leading-relaxed">{description}</p>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl font-bold text-gray-500 dark:text-gray-300 bg-white/70 dark:bg-gray-800/50 border border-white/60 dark:border-white/10 backdrop-blur-xl">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
