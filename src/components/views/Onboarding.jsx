/**
 * Onboarding Component - 新用户引导组件
 * Guides new users through initial setup
 */

import React, { useState } from 'react';
import { Languages, Wifi, Bot, Lightbulb, ArrowRight } from 'lucide-react';
import { AVATARS } from '../../utils/constants';

const Onboarding = ({ t, onComplete, lang, onLangChange }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('cat');
  const [step, setStep] = useState(1);

  const handleNext = (userName, avatar) => {
    setStep(2);
    setName(userName);
    setSelectedAvatar(avatar);
  };

  const handleFinish = () => {
    onComplete(name || t.defaultName, selectedAvatar);
  };

  if (step === 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="absolute inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-3xl"></div>
        <div className="relative w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/60 dark:border-white/10 animate-scale-up max-h-[85vh] overflow-y-auto">
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </div>

          <div className="text-center mb-5">
            <h3 className="text-xl font-black text-gray-800 dark:text-white">{t.guideTitle}</h3>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-white/40 dark:border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md shrink-0"><Languages size={20} /></div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 dark:text-white text-sm">{t.guideStep1Title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.guideStep1Desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-white/40 dark:border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white shadow-md shrink-0"><Wifi size={20} /></div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 dark:text-white text-sm">{t.guideStep2Title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.guideStep2Desc}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-white/40 dark:border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shrink-0"><Bot size={20} /></div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 dark:text-white text-sm">{t.guideStep3Title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.guideStep3Desc}</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl mb-5">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-bold flex items-center"><Lightbulb size={14} className="mr-2 shrink-0" /> {t.guideNote}</p>
          </div>

          <button onClick={handleFinish} className="w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-[0.98]">
            {t.guideStart}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="absolute inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-3xl"></div>
      <div className="relative max-w-sm w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 border border-white/60 dark:border-white/10 text-center ring-1 ring-white/50 dark:ring-white/5">
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
            <button
              onClick={() => onLangChange('zh')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === 'zh' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              中文
            </button>
            <button
              onClick={() => onLangChange('en')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${lang === 'en' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              EN
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-4 mt-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">{t.onboardingTitle}</h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold opacity-70">{t.onboardingDesc}</p>
        </div>
        
        <div className="grid grid-cols-4 gap-3 mb-8">
          {AVATARS.map(avatar => (
            <button 
              key={avatar.id} 
              onClick={() => setSelectedAvatar(avatar.id)} 
              className={`aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 ${selectedAvatar === avatar.id ? 'bg-white dark:bg-white/20 ring-4 ring-blue-200 dark:ring-blue-900 scale-110 shadow-xl z-10' : 'bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md scale-100 opacity-70 hover:opacity-100'}`}
            >
              {avatar.icon}
            </button>
          ))}
        </div>
        
        <div className="bg-gray-50/50 dark:bg-gray-800 rounded-2xl p-2 mb-6 border border-gray-200 dark:border-gray-700 focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-gray-900 focus-within:shadow-lg transition-all">
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder={t.namePlaceholder} 
            className="w-full bg-transparent text-center text-xl font-bold p-2 outline-none text-gray-800 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600" 
            maxLength={10} 
          />
        </div>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => name.trim() && handleNext(name, selectedAvatar)} 
            disabled={!name.trim()} 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] text-lg"
          >
            {t.saveName}
          </button>
          <button 
            onClick={() => handleNext(t.defaultName, selectedAvatar)} 
            className="text-gray-400 dark:text-gray-500 font-bold py-2 text-sm hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            {t.skipName} <ArrowRight size={14} className="inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
