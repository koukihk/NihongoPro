/**
 * QuizView Component - 测验视图
 * Vocabulary quiz with visual and audio modes
 */

import { useState, useEffect, useRef } from 'react';
import { X, Volume2, Languages, CloudLightning, Trophy, Zap, Star as StarIcon, Heart } from 'lucide-react';
import { GlassCard } from '../ui';
import { speak, shuffleArray } from '../../utils/helpers';

// 安全解析 JSON，尝试修复常见格式错误
const safeParseJSON = (jsonStr) => {
  try {
    // 尝试修复 "id":"ai6":"word" 这种格式错误
    let fixed = jsonStr.replace(/"id"\s*:\s*"([^"]+)"\s*:\s*"/g, '"id":"$1","ja":"');
    return JSON.parse(fixed);
  } catch (e) {
    console.error('JSON parse failed:', e);
    return null;
  }
};

const QuizView = ({ t, isZh, vocabList, addXp, onFinish, addLog, praisePhrases, addMistake, updateGoal, user, toggleFavorite, aiConfig, targetLang, targetLevel }) => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const scoreRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true); // 统一的加载状态
  const [quizMode, setQuizMode] = useState('visual');
  const hasInitialized = useRef(false); // 防止重复初始化

  // 词汇类别池，用于增加多样性
  const categoryPool = [
    { name: 'food & drinks', examples: 'ramen, sushi, coffee, bread, vegetables' },
    { name: 'emotions & feelings', examples: 'happy, sad, angry, surprised, tired' },
    { name: 'weather & nature', examples: 'rain, snow, mountain, river, flower' },
    { name: 'daily actions', examples: 'wake up, sleep, walk, run, read' },
    { name: 'body parts', examples: 'head, hand, eye, ear, heart' },
    { name: 'colors & shapes', examples: 'red, blue, circle, square, big' },
    { name: 'time expressions', examples: 'today, tomorrow, morning, night, week' },
    { name: 'places & locations', examples: 'station, hospital, park, school, home' },
    { name: 'family & relationships', examples: 'mother, friend, teacher, neighbor, child' },
    { name: 'adjectives', examples: 'beautiful, fast, expensive, difficult, delicious' },
    { name: 'transportation', examples: 'train, bus, bicycle, airplane, walk' },
    { name: 'shopping & money', examples: 'buy, sell, cheap, expensive, receipt' },
    { name: 'hobbies & entertainment', examples: 'music, movie, game, travel, sports' },
    { name: 'work & study', examples: 'meeting, homework, exam, office, company' },
    { name: 'animals & pets', examples: 'cat, dog, bird, fish, rabbit' },
  ];

  const generateAIQuestions = async () => {
    if (!aiConfig?.enabled || !aiConfig?.apiKey) return null;

    const isJapanese = targetLang === 'ja';
    const langName = isJapanese ? 'Japanese' : 'Korean';
    
    // 随机选择2-3个类别，增加多样性
    const shuffledCategories = shuffleArray([...categoryPool]);
    const selectedCategories = shuffledCategories.slice(0, 3);
    const categoryHint = selectedCategories.map(c => `${c.name} (like: ${c.examples})`).join(', ');
    
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
    const difficulty = getLevelDescription();
    
    // 针对不同语言的避免词汇
    const avoidWords = isJapanese
      ? '食べる, 飲む, 見る, 聞く, 行く, 来る, する, ある, いる'
      : '먹다, 마시다, 보다, 가다, 오다, 하다, 있다, 없다, 좋다';
    
    // 随机数种子，让每次请求更独特
    const randomSeed = Math.floor(Math.random() * 10000);
    
    // 字段名根据语言调整
    const wordField = isJapanese ? 'ja' : 'ko';
    const romajiField = isJapanese ? 'romaji' : 'romanization';

    const prompt = `Generate 5 unique ${langName} vocabulary quiz questions. Seed: ${randomSeed}

IMPORTANT RULES:
- Focus on these categories: ${categoryHint}
- Difficulty: ${difficulty}
- AVOID common textbook words like: ${avoidWords}
- Choose INTERESTING and VARIED vocabulary
- Each question's wrong options should be semantically related but clearly different

For each question provide:
- One correct answer: {id, ja (${langName} word), ro (${romajiField}), zh (Chinese), en (English)}
- Three plausible wrong options with same format

Return ONLY valid JSON array:
[{"answer":{"id":"ai1","ja":"word","ro":"${romajiField}","zh":"中文","en":"english"},"options":[...4 options including answer...]}]

No markdown, just JSON.`;

    try {
      let response, data;
      if (aiConfig.provider === 'gemini') {
        const model = aiConfig.model || 'gemini-2.0-flash';
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8 }
            })
          }
        );
        data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = safeParseJSON(jsonMatch[0]);
          if (parsed) return parsed;
        }
      } else {
        let endpoint = aiConfig.endpoint || 'https://api.openai.com/v1';
        if (!endpoint.includes('/chat/completions')) {
          endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
        }
        const model = aiConfig.model || 'gpt-4o-mini';
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8
          })
        });
        data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = safeParseJSON(jsonMatch[0]);
          if (parsed) return parsed;
        }
      }
    } catch (e) {
      console.error('AI generation failed:', e);
    }
    return null;
  };


  useEffect(() => {
    // 防止 StrictMode 或重复渲染导致多次调用
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    const loadQuestions = async () => {
      setIsLoading(true);
      
      // 尝试 AI 生成
      if (aiConfig?.enabled && aiConfig?.apiKey) {
        const aiQuestions = await generateAIQuestions();
        if (aiQuestions && aiQuestions.length > 0) {
          setQuestions(aiQuestions);
          setIsLoading(false);
          return;
        }
      }

      // AI 失败或未启用，使用本地词库
      if (!vocabList || vocabList.length === 0) {
        setIsLoading(false);
        return;
      }
      const qList = [];
      const pool = shuffleArray(vocabList);
      for (let i = 0; i < 5; i++) {
        if (i >= pool.length) break;
        const answer = pool[i];
        const others = pool.filter(p => p.id !== answer.id);
        const distractors = shuffleArray(others).slice(0, 3);
        const options = shuffleArray([answer, ...distractors]);
        qList.push({ answer, options });
      }
      setQuestions(qList);
      setIsLoading(false);
    };

    loadQuestions();
  }, []);

  useEffect(() => {
    if (isCompleted) {
      const phrase = praisePhrases[Math.floor(Math.random() * praisePhrases.length)];
      speak(phrase);
    }
  }, [isCompleted, praisePhrases]);

  useEffect(() => {
    if (quizMode === 'audio' && questions[currentIndex] && !isCompleted) {
      const timer = setTimeout(() => speak(questions[currentIndex].answer.kana || questions[currentIndex].answer.ja), 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, quizMode, questions, isCompleted]);

  const handleSelect = (option) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const correct = option.id === questions[currentIndex].answer.id;
    setIsCorrect(correct);
    let points = 0;
    if (correct) {
      points = 20 + (combo * 5); 
      setScore(s => s + points); 
      scoreRef.current += points; 
      setCombo(c => c + 1); 
      speak(questions[currentIndex].answer.kana || questions[currentIndex].answer.ja);
    } else {
      setCombo(0); 
      if (navigator.vibrate) navigator.vibrate(200);
      // 只有非 AI 生成的词汇才添加到错题本
      const answerId = questions[currentIndex].answer.id;
      if (!String(answerId).startsWith('ai')) {
        addMistake(answerId);
      }
    }
    setTimeout(() => {
      if (currentIndex < questions.length - 1) { 
        setCurrentIndex(c => c + 1); 
        setSelectedOption(null); 
        setIsCorrect(null); 
      } else { 
        setIsCompleted(true); 
        updateGoal('quiz'); 
      }
    }, 1000);
  };

  if (isLoading || questions.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full">
      <CloudLightning className="animate-bounce text-blue-300 mb-4" size={48} />
      <p className="text-gray-500 dark:text-gray-400 font-bold">{aiConfig?.enabled ? t.aiGenerating : t.loading}</p>
    </div>
  );

  if (isCompleted) {
    const isPerfect = scoreRef.current >= 100;
    const stars = isPerfect ? 3 : scoreRef.current > 60 ? 2 : 1;

    return (
      <div className="flex flex-col items-center justify-center h-full animate-scale-up px-4">
        <div className="relative mb-8 w-full max-w-sm">
          <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse"></div>
          <GlassCard className="!p-8 !bg-white/80 dark:!bg-gray-800/90" shine={isPerfect}>
            <div className="flex flex-col items-center text-center">
              <Trophy size={64} className={`mb-4 ${isPerfect ? 'text-yellow-500 animate-bounce' : 'text-blue-500'}`} fill="currentColor" />
              <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">{isPerfect ? t.quizPerfect : t.quizFinish}</h2>
              <div className="text-gray-500 dark:text-gray-400 font-bold mb-6">{isPerfect ? t.quizGood : t.quizKeepGoing}</div>
              <div className="flex space-x-2 mb-6">
                {[1, 2, 3].map(i => (
                  <StarIcon key={i} size={32} className={`${i <= stars ? 'text-yellow-400 fill-current' : 'text-gray-200 dark:text-gray-700'} transition-all duration-500`} style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
              <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">{scoreRef.current}</div>
              <button onClick={() => { addXp(scoreRef.current); addLog('quiz', 'Daily Quiz', scoreRef.current); onFinish(); }} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/30 active:scale-95 transition-all text-lg flex items-center justify-center">
                <Zap size={20} className="mr-2 fill-current" /> {t.claimReward}
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;


  return (
    <div className="flex flex-col h-full animate-fade-in pb-20 pt-4 px-2">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onFinish} className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-full hover:bg-white dark:hover:bg-gray-700">
          <X size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex flex-col items-center">
          <h3 className="font-bold text-gray-600 dark:text-gray-300 mb-2">{t.quizTitle}</h3>
          <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-xl mb-2">
            <button onClick={() => setQuizMode('visual')} className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${quizMode === 'visual' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              <Languages size={14} /> Visual
            </button>
            <button onClick={() => setQuizMode('audio')} className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${quizMode === 'audio' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              <Volume2 size={14} /> Audio
            </button>
          </div>
          <div className="flex space-x-1">
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i === currentIndex ? 'bg-blue-500' : i < currentIndex ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            ))}
          </div>
        </div>
        <div className="font-black text-blue-600 dark:text-blue-400">{score}</div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center">
        {combo > 1 && <div className="text-yellow-500 font-black text-xl animate-bounce mb-4 drop-shadow-sm">🔥 {combo} Combo!</div>}
        <GlassCard className="w-full mb-8 flex flex-col items-center justify-center py-12 !bg-white/80 dark:!bg-gray-800/80">
          {quizMode === 'visual' ? (
            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex items-center justify-center gap-3 mb-2">
                <h2 className="text-6xl font-medium text-gray-800 dark:text-white">{currentQ.answer.ja}</h2>
                <button onClick={(e) => { e.stopPropagation(); speak(currentQ.answer.kana || currentQ.answer.ja); }} className="p-2.5 bg-white/50 dark:bg-gray-700/50 rounded-full text-blue-500 dark:text-blue-300 hover:scale-110 transition-transform shadow-sm">
                  <Volume2 size={24} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(currentQ.answer.id); }} className={`p-2.5 rounded-full transition-all hover:scale-110 shadow-sm ${user.favorites?.includes(currentQ.answer.id) ? 'bg-pink-100 text-pink-500' : 'bg-white/50 dark:bg-gray-700/50 text-gray-400'}`}>
                  <Heart size={24} fill={user.favorites?.includes(currentQ.answer.id) ? "currentColor" : "none"} />
                </button>
              </div>
              <p className="text-gray-400 dark:text-gray-500">{currentQ.answer.ro}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full">
              <button onClick={() => speak(currentQ.answer.kana || currentQ.answer.ja)} className="p-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 hover:scale-110 transition-transform animate-pulse-slow">
                <Volume2 size={64} />
              </button>
            </div>
          )}
        </GlassCard>
        
        <div className="grid grid-cols-1 gap-3 w-full max-w-md">
          {currentQ.options.map((opt, i) => {
            let stateClass = "bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border-transparent dark:text-gray-200";
            if (selectedOption) {
              if (opt.id === currentQ.answer.id) stateClass = "bg-green-100 dark:bg-green-900/50 border-green-400 text-green-700 dark:text-green-200 shadow-green-200 dark:shadow-none";
              else if (opt.id === selectedOption.id) stateClass = "bg-red-100 dark:bg-red-900/50 border-red-400 text-red-700 dark:text-red-200 shadow-red-200 dark:shadow-none animate-shake";
              else stateClass = "opacity-50 dark:opacity-30";
            }
            return (
              <div key={i} onClick={() => handleSelect(opt)} className={`p-4 rounded-2xl border-2 font-bold text-center transition-all duration-200 cursor-pointer shadow-sm ${stateClass}`}>
                {isZh ? opt.zh : opt.en}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizView;
