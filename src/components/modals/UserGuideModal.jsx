import { Sparkles, X, Languages, Wifi, Bot, Lightbulb } from 'lucide-react';

/**
 * UserGuideModal - 用户指南弹窗
 * Displays a guide for new users with step-by-step instructions
 */
const UserGuideModal = ({ t, onClose }) => {
  const steps = [
    { title: t.guideStep1Title, desc: t.guideStep1Desc, icon: <Languages size={24} />, color: 'from-blue-500 to-indigo-500' },
    { title: t.guideStep2Title, desc: t.guideStep2Desc, icon: <Wifi size={24} />, color: 'from-green-500 to-teal-500' },
    { title: t.guideStep3Title, desc: t.guideStep3Desc, icon: <Bot size={24} />, color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/60 dark:border-white/10 animate-scale-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center">
            <Sparkles size={24} className="mr-2 text-yellow-500" /> {t.guideTitle}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-white/40 dark:border-white/10">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                {step.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-white mb-1">{step.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl mb-6">
          <p className="text-sm text-amber-700 dark:text-amber-300 font-bold flex items-center">
            <Lightbulb size={16} className="mr-2 shrink-0" /> {t.guideNote}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
        >
          {t.guideStart}
        </button>
      </div>
    </div>
  );
};

export default UserGuideModal;
