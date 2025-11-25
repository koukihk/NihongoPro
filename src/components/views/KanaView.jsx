/**
 * KanaView Component - 假名学习视图
 * Displays hiragana/katakana characters for learning
 */

import React, { useState } from 'react';
import { GlassCard, SectionHeader } from '../ui';
import { speak } from '../../utils/helpers';

const KanaView = ({ t, openCanvas, data, targetLang }) => {
  const [tab, setTab] = useState('hiragana');
  const { ALPHABET_DATA, LABELS } = data;

  return (
    <div className="animate-fade-in pb-24">
      <SectionHeader title={t[data.LABELS.tab1Key]} subtitle={t.appSubtitle} targetLang={targetLang} />

      <div className="flex justify-center mb-6 bg-white/50 dark:bg-gray-800/50 p-1 rounded-2xl backdrop-blur-sm mx-4 border border-white/40 dark:border-white/5">
        <button 
          onClick={() => setTab('hiragana')} 
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'hiragana' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
        >
          {t[data.LABELS.tab1_sub1Key]}
        </button>
        <button 
          onClick={() => setTab('katakana')} 
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'katakana' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
        >
          {t[data.LABELS.tab1_sub2Key]}
        </button>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3 md:gap-4 px-2">
        {ALPHABET_DATA.map((item, index) => {
          const char = tab === 'hiragana' ? item.h : item.k;
          const label = t[data.LABELS[tab === 'hiragana' ? 'tab1_sub1Key' : 'tab1_sub2Key']];
          return (
            <GlassCard 
              key={index} 
              onClick={() => { speak(char); openCanvas({ char, label }); }} 
              className="aspect-square flex flex-col group !p-1 sm:!p-2 !rounded-2xl sm:!rounded-3xl hover:-translate-y-1 hover:border-blue-300/50 dark:hover:border-blue-500/30"
            >
              <div className="flex-1 flex items-center justify-center pt-1">
                <span className="text-2xl sm:text-3xl md:text-4xl font-medium text-gray-800 dark:text-white group-hover:scale-105 transition-transform duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {char}
                </span>
              </div>
              <div className="pb-1 sm:pb-1.5 w-full text-center">
                <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider sm:tracking-widest">
                  {item.r}
                </span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};

export default KanaView;
