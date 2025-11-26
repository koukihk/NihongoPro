/**
 * FillBlankGame Component - 填空游戏视图
 * AI-powered fill-in-the-blank vocabulary practice
 */

import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, CloudLightning, Bot, Trophy, Volume2 } from 'lucide-react';
import { GlassCard } from '../ui';
import { shuffleArray } from '../../utils/helpers';
import { ttsService } from '../../services/tts';

const FillBlankGame = ({ t, isZh, vocabList, addXp, onFinish, addLog, aiConfig, targetLang, updateGoal }) => {
  const [questions, setQuestions] = useState(null); // 改为 null 以区分"未加载"和"空数组"
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const hasInitialized = useRef(false); // 防止重复初始化

  const generateQuestions = async () => {
    if (!aiConfig?.enabled || !aiConfig?.apiKey) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const selectedVocab = shuffleArray(vocabList).slice(0, 5);
    const langName = targetLang === 'ja' ? 'Japanese' : 'Korean';
    const userLang = isZh ? 'Chinese' : 'English';

    const exampleTranslation = isZh ? '我每天吃苹果。' : 'I eat apples every day.';
    const prompt = `Generate 5 fill-in-the-blank sentences for ${langName} learners. Reply in JSON only.

Words to use:
${selectedVocab.map((v, i) => `${i + 1}. ${v.ja} (${v.ro}) - ${isZh ? v.zh : v.en}`).join('\n')}

IMPORTANT RULES:
1. Each sentence MUST have clear context so ONLY the correct answer fits grammatically and semantically
2. Wrong options must be CLEARLY wrong - they should NOT fit the sentence context at all
3. Avoid ambiguous sentences where multiple options could be correct
4. The translation must match the sentence with the correct answer filled in
5. Use specific context clues (time, place, action) to make the answer unambiguous
6. Translation MUST be in ${userLang}

For each word, create:
- A ${langName} sentence with specific context where ONLY the target word fits
- The correct answer (the target word)
- 2 wrong options (words from DIFFERENT categories that don't fit the context)

Return ONLY this JSON format:
[{"sentence":"私は毎日____を食べます。","answer":"りんご","options":["りんご","走る","青い"],"translation":"${exampleTranslation}"}]`;

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
        const parsed = JSON.parse(jsonMatch[0]);
        const validQuestions = parsed.map(q => {
          let sentence = q.sentence || '';
          const answer = q.answer || '';
          let opts = q.options || [];
          
          if (!sentence.includes('____') && answer) {
            if (sentence.includes(answer)) {
              sentence = sentence.replace(answer, '____');
            } else {
              return null;
            }
          }
          
          if (!opts.includes(answer)) {
            opts = [answer, ...opts.slice(0, 2)];
          }
          opts = opts.slice(0, 3);
          
          return { ...q, sentence, options: shuffleArray(opts) };
        }).filter(q => q !== null && q.sentence.includes('____'));
        
        if (validQuestions.length > 0) {
          setQuestions(validQuestions);
        }
      }
    } catch (e) {
      console.error('Fill blank generation failed:', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // 防止 StrictMode 或重复渲染导致多次调用
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    generateQuestions();
  }, []);

  // 播放完整句子的语音
  const speakSentence = async (question) => {
    if (isSpeaking || !question) return;
    setIsSpeaking(true);
    try {
      // 将填空替换为正确答案，生成完整句子
      const fullSentence = question.sentence.replace('____', question.answer);
      await ttsService.speak(fullSentence, targetLang);
    } catch (e) {
      console.error('TTS failed:', e);
    }
    setIsSpeaking(false);
  };


  const handleSelect = (option) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const correct = option === questions[currentIndex].answer;
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 20);
      addXp(10);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      setIsCompleted(true);
      addLog('fillblank', 'Fill Blank Practice', score + (isCorrect ? 20 : 0));
      updateGoal('quiz');
    }
  };

  if (!aiConfig?.enabled || !aiConfig?.apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center p-8">
        <Bot size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">{t.fillBlankNeedsAI}</h2>
        <button onClick={onFinish} className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold">{t.close}</button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in">
        <CloudLightning size={48} className="text-blue-400 animate-bounce mb-4" />
        <p className="text-gray-500 dark:text-gray-400 font-bold">{t.fillBlankGenerating}</p>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center p-8">
        <X size={64} className="text-red-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">Generation failed</h2>
        <button onClick={onFinish} className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold">{t.close}</button>
      </div>
    );
  }

  if (isCompleted) {
    const finalScore = score;
    return (
      <div className="flex flex-col items-center justify-center h-full animate-scale-up px-4">
        <GlassCard className="!p-8 flex flex-col items-center w-full max-w-sm !bg-white/80 dark:!bg-gray-800/90">
          <Trophy size={64} className="text-yellow-500 mb-4" fill="currentColor" />
          <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">{t.fillBlankFinish}</h2>
          <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">{finalScore}</div>
          <button onClick={onFinish} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl">
            {t.close}
          </button>
        </GlassCard>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col h-full animate-fade-in pb-20 pt-4 px-2">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onFinish} className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-full hover:bg-white dark:hover:bg-gray-700">
          <X size={24} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex flex-col items-center">
          <h3 className="font-bold text-gray-600 dark:text-gray-300 mb-2">{t.fillBlankTitle}</h3>
          <div className="flex space-x-1">
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i === currentIndex ? 'bg-blue-500' : i < currentIndex ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            ))}
          </div>
        </div>
        <div className="font-black text-blue-600 dark:text-blue-400">{score}</div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center">
        <GlassCard className="w-full mb-6 !p-6 !bg-white/80 dark:!bg-gray-800/80">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 text-center">{t.fillBlankInstruction}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white text-center leading-relaxed mb-4">
            {currentQ.sentence.split('____').map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className={`inline-block min-w-[60px] mx-1 px-3 py-1 rounded-lg border-2 border-dashed ${selectedOption ? (isCorrect ? 'border-green-400 bg-green-100 dark:bg-green-900/30' : 'border-red-400 bg-red-100 dark:bg-red-900/30') : 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'}`}>
                    {selectedOption || '?'}
                  </span>
                )}
              </span>
            ))}
          </p>
          {selectedOption && (
            <div className="flex flex-col items-center mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{currentQ.translation}</p>
              <button
                onClick={() => speakSentence(currentQ)}
                disabled={isSpeaking}
                className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isSpeaking 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-400' 
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                }`}
              >
                <Volume2 size={16} className={isSpeaking ? 'animate-pulse' : ''} />
                {isSpeaking ? (isZh ? '播放中...' : 'Playing...') : (isZh ? '听发音' : 'Listen')}
              </button>
            </div>
          )}
        </GlassCard>

        {selectedOption && (
          <div className={`mb-4 px-4 py-2 rounded-full font-bold ${isCorrect ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'}`}>
            {isCorrect ? t.fillBlankCorrect : t.fillBlankWrong}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 w-full max-w-md">
          {currentQ.options.map((opt, i) => {
            let stateClass = "bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-700/80 border-transparent text-gray-700 dark:text-gray-200";
            if (selectedOption) {
              if (opt === currentQ.answer) stateClass = "bg-green-100 dark:bg-green-900/50 border-green-400 text-green-700 dark:text-green-200";
              else if (opt === selectedOption) stateClass = "bg-red-100 dark:bg-red-900/50 border-red-400 text-red-700 dark:text-red-200 animate-shake";
              else stateClass = "opacity-50";
            }
            return (
              <button key={i} onClick={() => handleSelect(opt)} disabled={!!selectedOption} className={`p-4 rounded-2xl border-2 font-bold text-center text-lg transition-all ${stateClass}`}>
                {opt}
              </button>
            );
          })}
        </div>

        {selectedOption && (
          <button onClick={handleNext} className="mt-6 w-full max-w-md bg-gray-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center">
            {currentIndex < questions.length - 1 ? t.fillBlankNext : t.claimReward} <ChevronRight size={20} className="ml-1" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FillBlankGame;
