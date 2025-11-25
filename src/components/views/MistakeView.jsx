/**
 * MistakeView Component - 错题复习视图
 * Displays vocabulary cards from the user's mistake list
 */

import React, { useState, useMemo } from 'react';
import { ChevronRight, RotateCcw, Volume2, X, Sparkles, CheckCircle, Lightbulb } from 'lucide-react';
import { GlassCard } from '../ui';
import { speak } from '../../utils/helpers';

const MistakeView = ({ t, isZh, vocabList, userMistakes, removeMistake, onFinish, aiConfig, targetLang }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [memoryTip, setMemoryTip] = useState(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const mistakeList = useMemo(() => vocabList.filter(v => userMistakes.includes(v.id)), [vocabList, userMistakes]);
  const currentCard = mistakeList[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setAiExplanation(null);
    setMemoryTip(null);
    setTimeout(() => {
      if (currentIndex < mistakeList.length - 1) setCurrentIndex(p => p + 1);
      else onFinish();
    }, 200);
  };

  const handleMastered = () => {
    removeMistake(currentCard.id);
    setAiExplanation(null);
    setMemoryTip(null);
    if (mistakeList.length === 1) {
      onFinish();
    } else if (currentIndex >= mistakeList.length - 1) {
      setCurrentIndex(0);
    }
  };

  const getMemoryTip = async () => {
    if (!aiConfig?.enabled || !aiConfig?.apiKey || !currentCard) return;
    setIsLoadingTip(true);
    const langName = targetLang === 'ja' ? 'Japanese' : 'Korean';
    const userLang = isZh ? 'Chinese' : 'English';
    const prompt = `Create a fun mnemonic for this ${langName} word. Reply in ${userLang}.
Word: ${currentCard.ja} (${currentCard.ro}) - ${isZh ? currentCard.zh : currentCard.en}
Create ONE creative memory trick (2-3 sentences). Add an emoji. No markdown.`;
    try {
      let text = '';
      if (aiConfig.provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model || 'gemini-2.0-flash'}:generateContent?key=${aiConfig.apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
        const data = await res.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        let endpoint = aiConfig.endpoint || 'https://api.openai.com/v1';
        if (!endpoint.includes('/chat/completions')) endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
        const res = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.apiKey}` },
          body: JSON.stringify({ model: aiConfig.model || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] })
        });
        const data = await res.json();
        text = data.choices?.[0]?.message?.content || '';
      }
      setMemoryTip(text);
    } catch (e) { setMemoryTip(isZh ? '生成失败' : 'Failed'); }
    setIsLoadingTip(false);
  };


  const getAIExplanation = async () => {
    if (!aiConfig?.enabled || !aiConfig?.apiKey || !currentCard) return;
    setIsExplaining(true);
    const langName = targetLang === 'ja' ? 'Japanese' : 'Korean';
    const userLang = isZh ? 'Chinese' : 'English';
    const prompt = `Explain this ${langName} word briefly in ${userLang}.
Word: ${currentCard.ja} (${currentCard.ro}) - ${isZh ? currentCard.zh : currentCard.en}
Include: 1 example sentence, usage tip, 1-2 related words. No markdown.`;
    try {
      let text = '';
      if (aiConfig.provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model || 'gemini-2.0-flash'}:generateContent?key=${aiConfig.apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
        const data = await res.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        let endpoint = aiConfig.endpoint || 'https://api.openai.com/v1';
        if (!endpoint.includes('/chat/completions')) endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
        const res = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.apiKey}` },
          body: JSON.stringify({ model: aiConfig.model || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] })
        });
        const data = await res.json();
        text = data.choices?.[0]?.message?.content || '';
      }
      setAiExplanation(text);
    } catch (e) { setAiExplanation(isZh ? '获取失败' : 'Failed'); }
    setIsExplaining(false);
  };

  if (!currentCard) return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center p-8">
      <Sparkles size={64} className="text-yellow-400 mb-4 animate-bounce" />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t.mistakeEmpty}</h2>
      <button onClick={onFinish} className="mt-8 px-8 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors">{t.close}</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center h-[85vh] pb-20 animate-fade-in relative px-2">
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onFinish} className="p-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors"><X size={24} className="text-gray-600 dark:text-gray-300" /></button>
        <div className="text-sm font-bold bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full text-red-600 dark:text-red-300 shadow-sm">{mistakeList.length} {t.mistakeTitle}</div>
        <div className="w-10"></div>
      </div>
      
      <div className="relative w-full max-w-sm flex-1 max-h-[500px] perspective-1000 group z-10">
        <div onClick={() => setIsFlipped(!isFlipped)} className={`w-full h-full relative preserve-3d transition-transform duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
          <GlassCard className="absolute inset-0 backface-hidden flex flex-col !rounded-[2.5rem] !bg-white/80 dark:!bg-gray-800/80 border-red-200 dark:border-red-900/50" shine={true}>
            <div className="flex justify-between items-start mb-4" onClick={e => e.stopPropagation()}>
              <span className="px-3 py-1 bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full text-xs font-bold uppercase tracking-wider">Mistake</span>
              <div className="flex space-x-2">
                <button onClick={() => speak(currentCard.kana || currentCard.ja)} className="p-2.5 bg-white/50 dark:bg-gray-700/50 rounded-full text-blue-500 dark:text-blue-300 hover:scale-110 transition-transform shadow-sm"><Volume2 size={20} /></button>
                {aiConfig?.enabled && aiConfig?.apiKey && (
                  <>
                    <button onClick={() => memoryTip ? setMemoryTip(null) : getMemoryTip()} disabled={isLoadingTip} className={`p-2.5 rounded-full hover:scale-110 transition-transform shadow-sm disabled:opacity-50 ${memoryTip ? 'bg-yellow-100 text-yellow-600 ring-2 ring-yellow-400' : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'}`} title={t.aiMemoryTip}>
                      <Lightbulb size={20} className={isLoadingTip ? 'animate-pulse' : ''} />
                    </button>
                    <button onClick={() => aiExplanation ? setAiExplanation(null) : getAIExplanation()} disabled={isExplaining} className={`p-2.5 rounded-full hover:scale-110 transition-transform shadow-sm disabled:opacity-50 ${aiExplanation ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-400' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'}`}>
                      <Sparkles size={20} className={isExplaining ? 'animate-spin' : ''} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {aiExplanation || memoryTip ? (
              <div className="flex-1 flex flex-col overflow-y-auto px-2" onClick={e => e.stopPropagation()}>
                <div className="text-center mb-3">
                  <h2 className="text-3xl font-medium text-gray-800 dark:text-white">{currentCard.ja}</h2>
                  <p className="text-sm text-gray-400">{currentCard.ro} · {isZh ? currentCard.zh : currentCard.en}</p>
                </div>
                {memoryTip && (
                  <div className="flex-1 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-2xl p-4 text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap overflow-y-auto border border-yellow-200 dark:border-yellow-800/30 mb-2">
                    <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-400 font-bold text-xs"><Lightbulb size={14} /> {t.aiMemoryTip}</div>
                    {memoryTip}
                  </div>
                )}
                {aiExplanation && (
                  <div className="flex-1 bg-purple-50/50 dark:bg-purple-900/20 rounded-2xl p-4 text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap overflow-y-auto">
                    {aiExplanation}
                  </div>
                )}
                <button onClick={() => { setAiExplanation(null); setMemoryTip(null); }} className="mt-3 text-xs text-purple-500 font-bold">{t.close}</button>
              </div>
            ) : (
              <>
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <h2 className="text-5xl sm:text-6xl font-medium text-gray-800 dark:text-white text-center break-keep leading-tight px-2">{currentCard.ja}</h2>
                  <p className="text-xl text-gray-400 dark:text-gray-500 font-medium tracking-wide">{currentCard.ro}</p>
                </div>
                <div className="mt-4 text-blue-400 text-sm font-bold flex items-center justify-center animate-bounce-slow opacity-80"><RotateCcw size={14} className="mr-1.5" /> {t.flip}</div>
              </>
            )}
          </GlassCard>
          <GlassCard className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center !rounded-[2.5rem] !bg-gradient-to-br from-red-50/90 to-orange-50/90 dark:from-red-900/80 dark:to-orange-900/80 border border-red-100 dark:border-red-800">
            <span className="text-xs font-black text-red-400 dark:text-red-200 bg-white/60 dark:bg-black/20 px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest shadow-sm">{t.meaning}</span>
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white text-center px-4 leading-relaxed">{isZh ? currentCard.zh : currentCard.en}</h2>
          </GlassCard>
        </div>
      </div>
      
      <div className="mt-8 w-full max-w-xs flex gap-4">
        <button onClick={handleMastered} className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center">
          <CheckCircle size={20} className="mr-2" /> {t.mastered}
        </button>
        <button onClick={handleNext} className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold text-lg shadow-xl shadow-gray-900/20 dark:shadow-white/10 active:scale-95 transition-all flex items-center justify-center">
          {t.keepPracticing} <ChevronRight size={20} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default MistakeView;
