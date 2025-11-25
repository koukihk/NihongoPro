/**
 * FlashcardView Component - 闪卡学习视图
 * Displays vocabulary flashcards with AI-powered explanations
 */

import React, { useState, useMemo } from 'react';
import { ChevronRight, RotateCcw, Volume2, Heart, Sparkles, Lightbulb } from 'lucide-react';
import { GlassCard } from '../ui';
import { speak, shuffleArray } from '../../utils/helpers';

const FlashcardView = ({ t, isZh, vocabList, userFavorites, toggleFavorite, onFinish, updateGoal, aiConfig, targetLang }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [memoryTip, setMemoryTip] = useState(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const shuffledList = useMemo(() => shuffleArray(vocabList), [vocabList]);
  const currentCard = shuffledList[currentIndex];
  const isFav = userFavorites.includes(currentCard?.id);

  const handleNext = () => {
    setIsFlipped(false);
    setAiExplanation(null);
    setMemoryTip(null);
    updateGoal('words', 1);
    setTimeout(() => { if (currentIndex < shuffledList.length - 1) setCurrentIndex(p => p + 1); else onFinish(); }, 200);
  };

  const getMemoryTip = async () => {
    if (!aiConfig?.enabled || !aiConfig?.apiKey || !currentCard) return;
    setIsLoadingTip(true);
    setMemoryTip(null);

    const langName = targetLang === 'ja' ? 'Japanese' : 'Korean';
    const userLang = isZh ? 'Chinese' : 'English';
    const prompt = `Create a fun and memorable mnemonic for this ${langName} word. Reply in ${userLang}.
Word: ${currentCard.ja} (${currentCard.ro})
Meaning: ${isZh ? currentCard.zh : currentCard.en}

Create ONE creative memory trick using:
- Sound association (the pronunciation sounds like...)
- Visual imagery (imagine...)
- Story or scene

Keep it short (2-3 sentences), fun and easy to remember. Add an emoji. No markdown.`;

    try {
      let response, data, text;
      if (aiConfig.provider === 'gemini') {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model || 'gemini-2.0-flash'}:generateContent?key=${aiConfig.apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
        );
        data = await response.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        let endpoint = aiConfig.endpoint || 'https://api.openai.com/v1';
        if (!endpoint.includes('/chat/completions')) endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.apiKey}` },
          body: JSON.stringify({ model: aiConfig.model || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] })
        });
        data = await response.json();
        text = data.choices?.[0]?.message?.content || '';
      }
      setMemoryTip(text);
    } catch (e) {
      setMemoryTip(isZh ? '生成失败，请重试' : 'Failed, please retry');
    }
    setIsLoadingTip(false);
  };


  const getAIExplanation = async () => {
    if (!aiConfig?.enabled || !aiConfig?.apiKey || !currentCard) return;
    setIsExplaining(true);
    setAiExplanation(null);

    const langName = targetLang === 'ja' ? 'Japanese' : 'Korean';
    const userLang = isZh ? 'Chinese' : 'English';
    const prompt = `Explain this ${langName} word for a language learner. Reply in ${userLang}.
Word: ${currentCard.ja} (${currentCard.ro})
Meaning: ${isZh ? currentCard.zh : currentCard.en}

Provide a brief response with:
1. One simple example sentence using this word (with translation)
2. A short usage tip or note
3. 1-2 related words

Keep it concise and helpful. No markdown formatting.`;

    try {
      let response, data, text;
      if (aiConfig.provider === 'gemini') {
        const model = aiConfig.model || 'gemini-2.0-flash';
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
        );
        data = await response.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        let endpoint = aiConfig.endpoint || 'https://api.openai.com/v1';
        if (!endpoint.includes('/chat/completions')) endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.apiKey}` },
          body: JSON.stringify({ model: aiConfig.model || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }] })
        });
        data = await response.json();
        text = data.choices?.[0]?.message?.content || '';
      }
      setAiExplanation(text);
    } catch (e) {
      console.error('AI explanation failed:', e);
      setAiExplanation(isZh ? '获取解释失败，请重试' : 'Failed to get explanation');
    }
    setIsExplaining(false);
  };

  if (!currentCard) return null;
  
  return (
    <div className="flex flex-col items-center h-[85vh] pb-20 animate-fade-in relative px-2">
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onFinish} className="p-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors">
          <ChevronRight size={24} className="rotate-180 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="text-sm font-bold bg-white/30 dark:bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-gray-600 dark:text-gray-300 shadow-sm border border-white/20 dark:border-white/10">
          {currentIndex + 1} / {shuffledList.length}
        </div>
        <div className="w-10"></div>
      </div>
      
      <div className="relative w-full max-w-sm flex-1 max-h-[500px] perspective-1000 group z-10">
        <div onClick={() => !aiExplanation && setIsFlipped(!isFlipped)} className={`w-full h-full relative preserve-3d transition-transform duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
          <GlassCard className="absolute inset-0 backface-hidden flex flex-col !rounded-[2.5rem] !bg-white/80 dark:!bg-gray-800/80" shine={true}>
            <div className="flex justify-between items-start mb-4" onClick={e => e.stopPropagation()}>
              <span className="px-3 py-1 bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider">JP</span>
              <div className="flex space-x-2">
                <button onClick={() => speak(currentCard.kana || currentCard.ja)} className="p-2.5 bg-white/50 dark:bg-gray-700/50 rounded-full text-blue-500 dark:text-blue-300 hover:scale-110 transition-transform shadow-sm"><Volume2 size={20} /></button>
                <button onClick={() => toggleFavorite(currentCard.id)} className={`p-2.5 rounded-full transition-all hover:scale-110 shadow-sm ${isFav ? 'bg-pink-100 text-pink-500' : 'bg-white/50 dark:bg-gray-700/50 text-gray-400'}`}><Heart size={20} fill={isFav ? "currentColor" : "none"} /></button>
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
                <div className="mt-4 text-blue-400 text-sm font-bold flex items-center justify-center animate-bounce-slow opacity-80">
                  <RotateCcw size={14} className="mr-1.5" /> {t.flip}
                </div>
              </>
            )}
          </GlassCard>
          <GlassCard className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center !rounded-[2.5rem] !bg-gradient-to-br from-blue-50/90 to-purple-50/90 dark:from-blue-900/80 dark:to-purple-900/80 border border-purple-100 dark:border-purple-800">
            <span className="text-xs font-black text-purple-400 dark:text-purple-200 bg-white/60 dark:bg-black/20 px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest shadow-sm">{t.meaning}</span>
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white text-center px-4 leading-relaxed">{isZh ? currentCard.zh : currentCard.en}</h2>
          </GlassCard>
        </div>
      </div>
      
      <button onClick={handleNext} className="mt-8 w-full max-w-xs bg-gray-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold text-lg shadow-xl shadow-gray-900/20 dark:shadow-white/10 active:scale-95 transition-all flex items-center justify-center backdrop-blur-sm group overflow-hidden relative">
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <span className="relative flex items-center">{t.next} <ChevronRight size={20} className="ml-1" /></span>
      </button>
    </div>
  );
};

export default FlashcardView;
