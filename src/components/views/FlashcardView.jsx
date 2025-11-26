/**
 * FlashcardView Component - 闪卡学习视图
 * Displays vocabulary flashcards with AI-powered explanations
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronRight, RotateCcw, Volume2, Heart, Sparkles, Lightbulb, CloudLightning } from 'lucide-react';
import { GlassCard } from '../ui';
import { speak, shuffleArray } from '../../utils/helpers';

const FlashcardView = ({ t, isZh, vocabList, userFavorites, toggleFavorite, onFinish, updateGoal, aiConfig, targetLang, targetLevel, addCustomVocab, isFavoritesMode }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [memoryTip, setMemoryTip] = useState(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);
  const [cardList, setCardList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  // 主题池，用于 AI 生成
  const themePool = [
    { theme: 'daily life', hint: 'common activities, routines, household' },
    { theme: 'food & cooking', hint: 'ingredients, dishes, flavors, dining' },
    { theme: 'travel & places', hint: 'destinations, transportation, sightseeing' },
    { theme: 'emotions & personality', hint: 'feelings, traits, reactions' },
    { theme: 'nature & weather', hint: 'seasons, animals, plants, climate' },
    { theme: 'work & business', hint: 'office, meetings, careers, economy' },
    { theme: 'hobbies & entertainment', hint: 'sports, music, games, movies' },
    { theme: 'technology & internet', hint: 'devices, apps, social media' },
    { theme: 'health & body', hint: 'fitness, medical, wellness' },
    { theme: 'shopping & fashion', hint: 'clothes, stores, prices, styles' },
  ];

  // AI 生成词汇
  const generateAIVocab = async () => {
    if (!aiConfig?.enabled || !aiConfig?.apiKey) return null;

    const isJapanese = targetLang === 'ja';
    const langName = isJapanese ? 'Japanese' : 'Korean';

    // 随机选择主题
    const selectedTheme = themePool[Math.floor(Math.random() * themePool.length)];

    // 根据用户设置的等级确定难度
    const getLevelDescription = () => {
      if (targetLevel === 'mixed') return 'mixed difficulty (include beginner to advanced words)';
      if (isJapanese) {
        const levelMap = {
          N5: 'JLPT N5 (basic, high-frequency words)',
          N4: 'JLPT N4 (elementary, everyday vocabulary)',
          N3: 'JLPT N3 (intermediate, common expressions)',
          N2: 'JLPT N2 (upper-intermediate, abstract concepts)',
          N1: 'JLPT N1 (advanced, sophisticated vocabulary)'
        };
        return levelMap[targetLevel] || levelMap.N5;
      } else {
        const levelMap = {
          TOPIK1: 'TOPIK 1 (basic vocabulary)',
          TOPIK2: 'TOPIK 2 (elementary expressions)',
          TOPIK3: 'TOPIK 3 (intermediate vocabulary)',
          TOPIK4: 'TOPIK 4 (upper-intermediate)',
          TOPIK5: 'TOPIK 5 (advanced vocabulary)',
          TOPIK6: 'TOPIK 6 (proficient, academic)'
        };
        return levelMap[targetLevel] || levelMap.TOPIK1;
      }
    };

    const levelDesc = getLevelDescription();
    const randomSeed = Math.floor(Math.random() * 10000);

    const prompt = `Generate 10 ${langName} vocabulary words for flashcard study. Seed: ${randomSeed}

THEME: ${selectedTheme.theme} (${selectedTheme.hint})
LEVEL: ${levelDesc}

RULES:
- All words should relate to "${selectedTheme.theme}"
- Match the difficulty level: ${levelDesc}
- Include a mix of nouns, verbs, and adjectives
- AVOID overly common beginner words for higher levels
- Each word must have accurate translations

Return ONLY valid JSON array:
[{"id":"ai1","ja":"word","ro":"romaji","zh":"中文","en":"English"}]

Generate exactly 10 unique words. No markdown.`;

    try {
      let text = '';
      if (aiConfig.provider === 'gemini') {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model || 'gemini-2.0-flash'}:generateContent?key=${aiConfig.apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8 } }) }
        );
        const data = await res.json();
        text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        let endpoint = aiConfig.endpoint || 'https://api.openai.com/v1';
        if (!endpoint.includes('/chat/completions')) endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${aiConfig.apiKey}` },
          body: JSON.stringify({ model: aiConfig.model || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.8 })
        });
        const data = await res.json();
        text = data.choices?.[0]?.message?.content || '';
      }
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];
        // 尝试修复常见的 JSON 格式错误
        // 修复 "id":"ai6":"word" 这种格式错误为 "id":"ai6","ja":"word"
        jsonStr = jsonStr.replace(/"id"\s*:\s*"([^"]+)"\s*:\s*"/g, '"id":"$1","ja":"');

        try {
          const parsed = JSON.parse(jsonStr);
          // 验证数据格式，过滤掉无效的词汇
          const validVocab = parsed.filter(v => v && v.ja && v.ro && (v.zh || v.en));
          if (validVocab.length > 0) {
            return validVocab;
          }
        } catch (parseError) {
          console.error('JSON parse failed after fix attempt:', parseError);
        }
      }
    } catch (e) {
      console.error('AI vocab generation failed:', e);
    }
    return null;
  };

  // 初始化词汇列表
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const loadVocab = async () => {
      setIsLoading(true);

      // 如果是"只复习收藏"模式，直接使用传入的词汇，不调用 AI
      if (isFavoritesMode) {
        setCardList(shuffleArray([...vocabList]));
        setIsLoading(false);
        return;
      }

      // 检查是否是"只复习收藏"模式（传入的词汇都是收藏的） - 兼容旧逻辑
      const isFavoritesOnly = vocabList.length > 0 && vocabList.every(v => userFavorites.includes(v.id));

      // 如果是"只复习收藏"模式，直接使用传入的词汇，不调用 AI
      if (isFavoritesOnly) {
        setCardList(shuffleArray([...vocabList]));
        setIsLoading(false);
        return;
      }

      // 尝试 AI 生成
      if (aiConfig?.enabled && aiConfig?.apiKey) {
        const aiVocab = await generateAIVocab();
        if (aiVocab && aiVocab.length > 0) {
          setCardList(aiVocab);
          setIsLoading(false);
          return;
        }
      }

      // AI 失败或未启用，使用本地词库
      setCardList(shuffleArray([...vocabList]));
      setIsLoading(false);
    };

    loadVocab();
  }, []);

  const currentCard = cardList[currentIndex];
  // 检查当前卡片是否是 AI 生成的（id 以 'ai' 开头且不是 custom_）
  const isAICard = currentCard?.id?.toString().startsWith('ai') && !currentCard?.id?.toString().startsWith('custom_');
  // 检查是否已收藏
  const isFav = currentCard ? userFavorites.includes(currentCard.id) : false;

  // 处理收藏（包括 AI 生成的词汇）
  const handleFavorite = () => {
    if (!currentCard) return;

    if (isAICard && !isFav) {
      // AI 词汇首次收藏：生成持久化 ID，保存到自定义词库
      const customId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const customVocab = {
        id: customId,
        ja: currentCard.ja,
        ro: currentCard.ro,
        zh: currentCard.zh,
        en: currentCard.en,
        kana: currentCard.kana || currentCard.ro,
        source: 'ai',
        lang: targetLang,
        createdAt: new Date().toISOString()
      };

      // 保存到自定义词库并收藏
      if (addCustomVocab) {
        // 使用原子操作同时保存词汇和收藏状态，避免 React 状态更新的竞态问题
        addCustomVocab(customVocab, true);

        // 更新当前卡片的 ID，这样 UI 可以正确显示收藏状态
        setCardList(prev => prev.map((card, idx) =>
          idx === currentIndex ? { ...card, id: customId } : card
        ));
      }
    } else {
      // 普通词汇或已保存的 AI 词汇：直接切换收藏状态
      toggleFavorite(currentCard.id);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setAiExplanation(null);
    setMemoryTip(null);
    updateGoal('words', 1);
    setTimeout(() => { if (currentIndex < cardList.length - 1) setCurrentIndex(p => p + 1); else onFinish(); }, 200);
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

  // 加载状态
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in">
        <CloudLightning size={48} className="text-blue-400 animate-bounce mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-bold">{aiConfig?.enabled ? t.aiGenerating : t.loading}</p>
      </div>
    );
  }

  if (!currentCard) {
    if (isFavoritesMode) {
      return (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in px-6 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <Heart size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            {isZh ? '没有找到收藏的单词' : 'No favorites found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
            {isZh ? '你还没有收藏任何这个语言的单词。在学习时点击爱心图标来收藏单词。' : 'You haven\'t favorited any words in this language yet. Tap the heart icon while learning to save words.'}
          </p>
          <button onClick={onFinish} className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg active:scale-95 transition-transform">
            {t.back}
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col items-center h-[85vh] pb-28 animate-fade-in relative px-2">
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onFinish} className="p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors">
          <ChevronRight size={24} className="rotate-180 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          {aiConfig?.enabled && aiConfig?.apiKey && (isAICard || currentCard?.id?.toString().startsWith('custom_')) && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">AI</span>
          )}
          <div className="text-sm font-bold bg-white/30 dark:bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-gray-600 dark:text-gray-300 shadow-sm border border-white/20 dark:border-white/10">
            {currentIndex + 1} / {cardList.length}
          </div>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="relative w-full max-w-sm flex-1 max-h-[500px] perspective-1000 group z-10">
        <div onClick={() => !aiExplanation && setIsFlipped(!isFlipped)} className={`w-full h-full relative preserve-3d transition-transform duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
          <GlassCard className="absolute inset-0 backface-hidden flex flex-col !rounded-[2.5rem] !bg-white/80 dark:!bg-gray-800/80" shine={true}>
            <div className="flex justify-between items-start mb-4" onClick={e => e.stopPropagation()}>
              <span className="px-3 py-1 bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider">{targetLang === 'ja' ? 'JP' : 'KR'}</span>
              <div className="flex space-x-2">
                <button onClick={() => speak(currentCard.kana || currentCard.ja)} className="p-2.5 bg-white/50 dark:bg-gray-700/50 rounded-full text-blue-500 dark:text-blue-300 hover:scale-110 transition-transform shadow-sm"><Volume2 size={20} /></button>
                <button
                  onClick={handleFavorite}
                  className={`p-2.5 rounded-full transition-all hover:scale-110 shadow-sm ${isFav ? 'bg-pink-100 text-pink-500' : 'bg-white/50 dark:bg-gray-700/50 text-gray-400'}`}
                >
                  <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                </button>
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
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 w-full overflow-hidden">
                  <h2 className={`font-medium text-gray-800 dark:text-white text-center leading-tight px-4 w-full ${currentCard.ja.length > 8 ? 'text-3xl sm:text-4xl' :
                    currentCard.ja.length > 5 ? 'text-4xl sm:text-5xl' :
                      'text-5xl sm:text-6xl'
                    }`}>{currentCard.ja}</h2>
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

      <button onClick={handleNext} className="absolute bottom-6 w-full max-w-xs bg-gray-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold text-lg shadow-xl shadow-gray-900/20 dark:shadow-white/10 active:scale-95 transition-all flex items-center justify-center backdrop-blur-sm group overflow-hidden z-20">
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
        <span className="relative flex items-center">{currentIndex === cardList.length - 1 ? t.finish : t.next} <ChevronRight size={20} className="ml-1" /></span>
      </button>
    </div>
  );
};

export default FlashcardView;
