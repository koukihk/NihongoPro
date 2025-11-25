import { Shield, X } from 'lucide-react';

/**
 * PrivacyModal - 隐私政策弹窗
 * Displays privacy policy information
 */
const PrivacyModal = ({ t, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/60 dark:border-white/10 animate-scale-up max-h-[85vh] overflow-hidden flex flex-col">
        {/* 固定头部 */}
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center">
            <Shield size={24} className="mr-2 text-green-500" /> {t.privacyTitle}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto px-6 ios-scrollbar">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{t.privacyLastUpdate}</p>

          <div className="space-y-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            <p>{t.privacyIntro}</p>

            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-2">{t.privacySection1Title}</h4>
              <p className="whitespace-pre-line">{t.privacySection1Content}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-2">{t.privacySection2Title}</h4>
              <p className="whitespace-pre-line">{t.privacySection2Content}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-2">{t.privacySection3Title}</h4>
              <p className="whitespace-pre-line">{t.privacySection3Content}</p>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 dark:text-white mb-2">{t.privacySection4Title}</h4>
              <p className="whitespace-pre-line">{t.privacySection4Content}</p>
            </div>
          </div>
        </div>

        {/* 固定底部按钮 */}
        <div className="p-6 pt-4 shrink-0">
          <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-teal-500 shadow-lg shadow-green-500/30">
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;
