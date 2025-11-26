/**
 * MatchingGame Component - 配对游戏视图
 * A memory matching game for vocabulary practice
 */

import { useState, useEffect } from 'react';
import { X, CloudLightning, Trophy } from 'lucide-react';
import { GlassCard } from '../ui';
import { speak, shuffleArray } from '../../utils/helpers';

const MatchingGame = ({ t, isZh, vocabList, addXp, onFinish, addLog, addMistake, updateGoal, aiConfig, targetLang, targetLevel }) => {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [matched, setMatched] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // 主题池，每次随机选择不同主题
  const themePool = [
    { theme: 'kitchen & cooking', hint: 'ingredients, utensils, cooking verbs' },
    { theme: 'city life', hint: 'buildings, streets, urban activities' },
    { theme: 'seasons & weather', hint: 'spring, summer, rain, temperature' },
    { theme: 'emotions', hint: 'feelings, moods, reactions' },
    { theme: 'clothing & fashion', hint: 'clothes, accessories, wearing' },
    { theme: 'technology', hint: 'phone, computer, internet terms' },
    { theme: 'sports & fitness', hint: 'exercises, games, body movements' },
    { theme: 'music & art', hint: 'instruments, colors, creative activities' },
    { theme: 'nature & outdoors', hint: 'plants, animals, landscapes' },
    { theme: 'home & furniture', hint: 'rooms, household items, daily routines' },
    { theme: 'school & learning', hint: 'subjects, supplies, study activities' },
    { theme: 'travel & vacation', hint: 'destinations, transportation, tourism' },
    { theme: 'health & body', hint: 'body parts, symptoms, wellness' },
    { theme: 'food & restaurants', hint: 'dishes, flavors, dining' },
    { theme: 'numbers & counting', hint: 'counters, quantities, measurements' },
  ];

  const generateAIVocab = async () => {
    if (!aiConfig?.enabled || !aiConfig?.apiKey) return null;
    const isJapanese = targetLang === 'ja';
    const langName = isJapanese ? 'Japanese' : 'Korean';
    
    // 随机选择一个主题
    const selectedTheme = themePool[Math.floor(Math.random() * themePool.length)];
    
    // 根据用户设置的等级确定难度
    const getLevelDescription = () => {
      if (targetLevel === 'mixed') return 'mixed difficulty levels';
      if (isJapanese) {
        const levelMap = { N5: 'N5 beginner', N4: 'N4 elementary', N3: 'N3 intermediate', N2: 'N2 upper-intermediate', N1: 'N1 advanced' };
        return levelMap[targetLevel] || 'N5 beginner';
      } else {
        const levelMap = { TOPIK1: 'TOPIK 1 beginner', TOPIK2: 'TOPIK 2 elementary', TOPIK3: 'TOPIK 3 intermediate', TOPIK4: 'TOPIK 4 upper-intermediate', TOPIK5: 'TOPIK 5 advanced', TOPIK6: 'TOPIK 6 proficient' };
        return levelMap[targetLevel] || 'TOPIK 1 beginner';
      }
    };
    const level = getLevelDescription();
    
    // 针对不同语言的避免词汇
    const avoidWords = isJapanese
      ? '猫, 犬, 食べる, 飲む, 大きい, 小さい, 見る, 行く'
      : '고양이, 개, 먹다, 마시다, 크다, 작다, 보다, 가다';
    
    // 随机种子
    const seed = Math.floor(Math.random() * 10000);
    
    const prompt = `Generate 6 ${langName} vocabulary words for a matching game. Seed: ${seed}

THEME: ${selectedTheme.theme} (${selectedTheme.hint})
LEVEL: ${level}

RULES:
- All 6 words MUST relate to the theme "${selectedTheme.theme}"
- AVOID overused words like: ${avoidWords}
- Choose INTERESTING vocabulary that fits the theme
- Words should be visually distinct (not too similar)

Return JSON only:
[{"id":"ai1","ja":"word","ro":"romaji","zh":"中文意思","en":"English meaning"}]

Generate exactly 6 unique words. No markdown.`;
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
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          // 尝试修复常见的 JSON 格式错误
          let jsonStr = jsonMatch[0].replace(/"id"\s*:\s*"([^"]+)"\s*:\s*"/g, '"id":"$1","ja":"');
          const parsed = JSON.parse(jsonStr);
          // 验证数据格式
          const validVocab = parsed.filter(v => v && v.ja && v.ro && (v.zh || v.en));
          if (validVocab.length > 0) return validVocab;
        } catch (parseError) {
          console.error('JSON parse failed:', parseError);
        }
      }
    } catch (e) { console.error('AI vocab generation failed:', e); }
    return null;
  };

  useEffect(() => {
    const loadCards = async () => {
      setIsLoading(true);
      let gameVocab = null;
      if (aiConfig?.enabled && aiConfig?.apiKey) {
        gameVocab = await generateAIVocab();
      }
      if (!gameVocab) {
        gameVocab = shuffleArray(vocabList).slice(0, 6);
      }
      const deck = gameVocab.flatMap(v => [
        { id: `${v.id}-ja`, vocabId: v.id, content: v.ja, kana: v.kana || v.ro, type: 'ja' },
        { id: `${v.id}-mean`, vocabId: v.id, content: isZh ? v.zh : v.en, type: 'mean' }
      ]);
      setCards(shuffleArray(deck));
      setIsLoading(false);
    };
    loadCards();
  }, [vocabList, aiConfig?.enabled]);


  const handleCardClick = (card) => {
    if (isChecking || matched.includes(card.vocabId) || selected.find(s => s.id === card.id)) return;
    if (card.type === 'ja') speak(card.kana || card.content);
    const newSelected = [...selected, card];
    setSelected(newSelected);
    if (newSelected.length === 2) {
      setIsChecking(true);
      if (newSelected[0].vocabId === newSelected[1].vocabId) {
        setTimeout(() => {
          const newMatched = [...matched, newSelected[0].vocabId];
          setMatched(newMatched);
          setSelected([]);
          setIsChecking(false);
          setScore(s => s + 15);
          if (newMatched.length === cards.length / 2) {
            // 游戏完成，显示完成界面
            setIsCompleted(true);
            updateGoal('matching');
          }
        }, 400);
      } else {
        setTimeout(() => { setSelected([]); setIsChecking(false); }, 800);
        // 只有非 AI 生成的词汇才添加到错题本（AI 生成的 id 以 'ai' 开头）
        if (!String(newSelected[0].vocabId).startsWith('ai')) {
          addMistake(newSelected[0].vocabId);
        }
        if (!String(newSelected[1].vocabId).startsWith('ai')) {
          addMistake(newSelected[1].vocabId);
        }
      }
    }
  };

  // 处理领取奖励
  const handleClaimReward = () => {
    addXp(score);
    addLog('matching', 'Matching Practice', score);
    onFinish();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in">
        <CloudLightning size={48} className="text-purple-400 animate-bounce mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-bold">{aiConfig?.enabled ? t.aiGenerating : t.loading}</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-scale-up px-4">
        <GlassCard className="!p-8 w-full max-w-sm !bg-white/80 dark:!bg-gray-800/90">
          <div className="flex flex-col items-center text-center">
            <Trophy size={64} className="text-yellow-500 mb-4" fill="currentColor" />
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">{t.matchFinish || t.quizFinish}</h2>
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">{score}</div>
            <button onClick={handleClaimReward} className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl">
              {t.claimReward}
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-6 px-2">
        <button onClick={onFinish} className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors">
          <X size={24} className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xl text-gray-700 dark:text-gray-200">{t.matchTitle}</h3>
          {aiConfig?.enabled && aiConfig?.apiKey && <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">AI</span>}
        </div>
        <div className="w-10"></div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 auto-rows-fr flex-1 max-w-md mx-auto w-full px-2">
        {cards.map(card => {
          const isSel = selected.find(s => s.id === card.id);
          const isMat = matched.includes(card.vocabId);
          return (
            <div 
              key={card.id} 
              onClick={() => handleCardClick(card)} 
              className={`relative flex items-center justify-center p-2 text-center rounded-2xl transition-all duration-300 font-bold shadow-sm cursor-pointer border ${isMat ? 'opacity-0 scale-50' : 'opacity-100'} ${isSel ? 'bg-blue-100/90 dark:bg-blue-900/80 border-blue-400 text-blue-600 dark:text-blue-200 scale-105 shadow-md' : 'bg-white/60 dark:bg-gray-800/60 border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'} ${isSel && isChecking && selected.length === 2 && selected[0].vocabId !== selected[1].vocabId ? 'bg-red-100 dark:bg-red-900/50 border-red-400 animate-shake' : ''} backdrop-blur-md`}
            >
              {card.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchingGame;
