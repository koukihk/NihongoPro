/**
 * ProfileView Component - 用户资料视图
 * Displays user profile, settings, and daily goals
 */

import { useState, useMemo, useEffect } from 'react';
import {
  ChevronRight, Edit3, Zap, Trophy, CheckCircle, Sun, Moon, Wifi, WifiOff,
  PenLine, History, Github, Languages, Database, Bot, RefreshCw, Shield, RotateCcw, Globe, Volume2
} from 'lucide-react';
import { GlassCard, Avatar, SectionHeader } from '../ui';
import { HistoryModal } from '../modals';
import { getLevelInfo } from '../../utils/helpers';
import { AVATARS } from '../../utils/constants';
import DailyGoalsCard from './DailyGoalsCard';

// Import DATA for daily quotes
import * as jaData from '../../data/ja';
import * as koData from '../../data/ko';

const DATA = {
  ja: jaData,
  ko: koData
};

// 等级选择器组件
const LevelSelector = ({ t, targetLang, targetLevel, setTargetLevel }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const jaLevels = [
    { id: 'N5', label: t.levelN5 },
    { id: 'N4', label: t.levelN4 },
    { id: 'N3', label: t.levelN3 },
    { id: 'N2', label: t.levelN2 },
    { id: 'N1', label: t.levelN1 },
    { id: 'mixed', label: t.levelMixed },
  ];
  
  const koLevels = [
    { id: 'TOPIK1', label: t.levelTOPIK1 },
    { id: 'TOPIK2', label: t.levelTOPIK2 },
    { id: 'TOPIK3', label: t.levelTOPIK3 },
    { id: 'TOPIK4', label: t.levelTOPIK4 },
    { id: 'TOPIK5', label: t.levelTOPIK5 },
    { id: 'TOPIK6', label: t.levelTOPIK6 },
    { id: 'mixed', label: t.levelMixed },
  ];
  
  const levels = targetLang === 'ja' ? jaLevels : koLevels;
  const currentLevel = levels.find(l => l.id === targetLevel) || levels[0];
  
  return (
    <div className="relative w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-100/80 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform">
            <Trophy size={22} />
          </div>
          <span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.targetLevel}</span>
        </div>
        <span className="text-sm font-bold bg-white/60 dark:bg-black/20 px-3 py-1 rounded-xl shadow-sm text-amber-600 dark:text-amber-400">
          {currentLevel.label}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 dark:border-white/10 z-50 overflow-hidden animate-fade-in">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => { setTargetLevel(level.id); setIsOpen(false); }}
              className={`w-full px-5 py-3 text-left font-bold transition-colors flex items-center justify-between ${
                targetLevel === level.id 
                  ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {level.label}
              {targetLevel === level.id && <CheckCircle size={18} className="text-amber-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileView = ({ 
  t, isZh, toggleLang, user, updateUser, theme, toggleTheme, 
  onlineMode, toggleOnlineMode, logs, targetLang, setTargetLang, 
  claimGoal, onResetRequest, aiConfig, onAISettingsOpen, onPrivacyOpen, 
  onDataManagement, ttsConfig, onTTSSettingsOpen, targetLevel, setTargetLevel
}) => {
  const { level, progress, nextXp } = getLevelInfo(user.xp);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [tempName, setTempName] = useState(user.name || '');
  const [aiQuote, setAiQuote] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  const dailyQuote = useMemo(() => DATA[targetLang].DAILY_QUOTES[new Date().getDate() % DATA[targetLang].DAILY_QUOTES.length], [targetLang]);

  // Clear AI quote when language changes
  useEffect(() => {
    setAiQuote(null);
  }, [targetLang, isZh]);

  const displayName = user.name || t.defaultName;
  const saveName = () => { 
    if (tempName.trim()) { 
      updateUser({ ...user, name: tempName.trim() }); 
      setIsEditingName(false); 
    } 
  };


  const generateAIQuote = async () => {
    if (!aiConfig?.enabled || !aiConfig?.apiKey) return;
    setIsLoadingQuote(true);
    const langName = targetLang === 'ja' ? 'Japanese' : 'Korean';
    const userLang = isZh ? 'Chinese' : 'English';
    const prompt = `Generate a short, inspiring ${langName} sentence for language learners. Include:
1. The ${langName} sentence (natural, useful daily expression)
2. Romanization
3. ${userLang} translation

Format exactly like this (no extra text):
[${langName} sentence]
[romanization]
[translation]`;

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
      const lines = text.trim().split('\n').filter(l => l.trim());
      if (lines.length >= 3) {
        setAiQuote({ ja: lines[0], ro: lines[1], zh: lines[2] });
      }
    } catch (e) {
      console.error('AI quote failed:', e);
    }
    setIsLoadingQuote(false);
  };

  return (
    <div className="space-y-6 pb-32 animate-fade-in max-w-lg md:max-w-2xl mx-auto">
      {showHistory && <HistoryModal logs={logs} t={t} onClose={() => setShowHistory(false)} />}
      <SectionHeader title={t.tabProfile} targetLang={targetLang} />
      
      <div className="relative px-4 mt-12">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 cursor-pointer group" onClick={() => setIsEditingAvatar(!isEditingAvatar)}>
          <Avatar id={user.avatarId} size="xl" className="shadow-[0_10px_40px_rgba(0,0,0,0.2)] ring-8 ring-white dark:ring-gray-900 group-hover:scale-110 transition-transform duration-300 bg-white dark:bg-gray-800" />
          <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg border-4 border-white dark:border-gray-900 hover:bg-blue-600 transition-colors">
            <Edit3 size={16} />
          </div>
        </div>
        
        <GlassCard className="flex flex-col items-center pt-16 pb-8 !rounded-[3rem] !bg-white/70 dark:!bg-gray-800/60 border-2 border-white/50 dark:border-white/5" shine={true}>
          <div className="mt-4 mb-2 z-10 text-center flex items-center justify-center space-x-2 relative w-full min-h-[40px]">
            {isEditingName ? (
              <div className="flex items-center bg-white/50 dark:bg-black/30 rounded-xl p-1 animate-fade-in">
                <input autoFocus value={tempName} onChange={e => setTempName(e.target.value)} className="bg-transparent border-none outline-none text-center font-black text-xl w-32 text-gray-800 dark:text-white" />
                <button onClick={saveName} className="p-1 bg-green-500 text-white rounded-lg ml-1"><CheckCircle size={16} /></button>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">{displayName}</h2>
                <button onClick={() => setIsEditingName(true)} className="opacity-30 hover:opacity-100 transition-opacity text-gray-500 dark:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><PenLine size={18} /></button>
              </>
            )}
          </div>
          
          <div className="flex items-center justify-center space-x-2 mb-6 z-10">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-md shadow-blue-500/30">Lv.{level}</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm font-bold">{Math.floor(user.xp)} / {nextXp} XP</span>
          </div>

          <div className="w-full mb-8 px-2 sm:px-4 flex justify-center">
            <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 text-center w-full p-4 backdrop-blur-sm relative">
              <p className="text-xs text-blue-500 font-bold mb-1 flex items-center justify-center uppercase tracking-widest"><span className="mr-1">✨</span> {t.quote}</p>
              {isLoadingQuote ? (
                <p className="text-sm font-bold text-gray-400 dark:text-gray-500 animate-pulse">{t.aiDailyLoading}</p>
              ) : (
                <>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{aiQuote?.ja || dailyQuote.ja}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{aiQuote ? aiQuote.zh : (isZh ? dailyQuote.zh : dailyQuote.ro)}</p>
                </>
              )}
              {aiConfig?.enabled && aiConfig?.apiKey && (
                <button onClick={generateAIQuote} disabled={isLoadingQuote} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/60 dark:bg-black/20 text-blue-500 hover:bg-white dark:hover:bg-black/40 transition-colors disabled:opacity-50" title={t.aiDailyGenerate}>
                  <RefreshCw size={14} className={isLoadingQuote ? 'animate-spin' : ''} />
                </button>
              )}
            </div>
          </div>

          {isEditingAvatar && (
            <div className="mb-8 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl w-full max-w-xs animate-fade-in grid grid-cols-4 gap-4 border border-white/60 dark:border-white/10 z-20 shadow-2xl mx-auto">
              {AVATARS.map(a => (
                <button key={a.id} onClick={() => { updateUser({ ...user, avatarId: a.id }); setIsEditingAvatar(false); }} className={`p-2 rounded-2xl flex justify-center hover:bg-white/50 dark:hover:bg-white/10 transition-colors ${user.avatarId === a.id ? 'bg-white dark:bg-white/20 shadow-md ring-2 ring-blue-400' : ''}`}>
                  <span className="text-3xl">{a.icon}</span>
                </button>
              ))}
            </div>
          )}
          
          <div className="flex w-full px-2 sm:px-4 space-x-3 sm:space-x-4 z-10">
            <div className="flex-1 bg-orange-50/60 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 p-4 rounded-3xl flex flex-col items-center hover:scale-105 transition-transform">
              <Zap size={24} className="text-orange-500 mb-2 filter drop-shadow-sm" fill="currentColor" />
              <span className="text-2xl font-black text-gray-800 dark:text-white">{user.streak}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{t.days}</span>
            </div>
            <div className="flex-1 bg-purple-50/60 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 p-4 rounded-3xl flex flex-col items-center hover:scale-105 transition-transform">
              <Trophy size={24} className="text-purple-500 mb-2 filter drop-shadow-sm" fill="currentColor" />
              <span className="text-2xl font-black text-gray-800 dark:text-white">{user.xp}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{t.xp}</span>
            </div>
          </div>
          
          <div className="w-full mt-8 px-2 sm:px-6 z-10">
            <div className="h-3 bg-gray-200/60 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-full transition-all duration-1000 shadow-[0_2px_10px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          
          <div className="w-full px-2 sm:px-4 mt-8 z-10">
            <DailyGoalsCard t={t} goals={user.dailyGoals?.goals} onClaim={claimGoal} />
          </div>
        </GlassCard>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mt-4">
        <button onClick={() => setShowHistory(true)} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-teal-100/80 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-2xl group-hover:scale-110 transition-transform"><History size={22} /></div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.historyTitle}</span></div><ChevronRight size={20} className="text-gray-400" />
        </button>
        <button onClick={() => setTargetLang(targetLang === 'ja' ? 'ko' : 'ja')} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-pink-100/80 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 rounded-2xl group-hover:scale-110 transition-transform"><Languages size={22} /></div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.targetLanguage}</span></div><span className="text-2xl font-bold bg-white/60 dark:bg-black/20 px-3 py-1 rounded-xl shadow-sm">{DATA[targetLang].LABELS.flag}</span>
        </button>
        <LevelSelector t={t} targetLang={targetLang} targetLevel={targetLevel} setTargetLevel={setTargetLevel} />
        <button onClick={toggleTheme} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-orange-100/80 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-2xl group-hover:scale-110 transition-transform">{theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}</div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.themeMode}</span></div><span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-black/20 px-3 py-1 rounded-xl shadow-sm">{theme === 'dark' ? t.themeDark : t.themeLight}</span>
        </button>
        <button onClick={toggleOnlineMode} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-cyan-100/80 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-2xl group-hover:scale-110 transition-transform">{onlineMode ? <Wifi size={22} /> : <WifiOff size={22} />}</div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg whitespace-nowrap">{t.dataMode}</span></div><span className={`text-sm font-bold px-3 py-1 rounded-xl shadow-sm whitespace-nowrap ${onlineMode ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500 dark:bg-black/20 dark:text-gray-400'}`}>{onlineMode ? t.modeOnline : t.modeOffline}</span>
        </button>
        <button onClick={toggleLang} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform"><Globe size={22} /></div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.switchLang}</span></div><span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-black/20 px-3 py-1 rounded-xl shadow-sm">{isZh ? '中文' : 'EN'}</span>
        </button>
        <button onClick={onAISettingsOpen} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-purple-100/80 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform"><Bot size={22} /></div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.aiMode}</span></div><span className={`text-sm font-bold px-3 py-1 rounded-xl shadow-sm whitespace-nowrap capitalize ${aiConfig?.enabled && aiConfig?.apiKey ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500 dark:bg-black/20 dark:text-gray-400'}`}>{aiConfig?.enabled && aiConfig?.apiKey ? (aiConfig.provider === 'gemini' ? 'Gemini' : 'OpenAI') : t.aiDisabled}</span>
        </button>
        <button onClick={onTTSSettingsOpen} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-cyan-100/80 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-2xl group-hover:scale-110 transition-transform"><Volume2 size={22} /></div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.ttsSettings}</span></div><span className={`text-sm font-bold px-3 py-1 rounded-xl shadow-sm whitespace-nowrap capitalize ${ttsConfig?.enabled && ttsConfig?.provider !== 'native' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500 dark:bg-black/20 dark:text-gray-400'}`}>{ttsConfig?.enabled && ttsConfig?.provider === 'openai' ? 'OpenAI' : ttsConfig?.enabled && ttsConfig?.provider === 'minimax' ? 'MiniMax' : t.ttsNative}</span>
        </button>
        <button onClick={onPrivacyOpen} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-green-100/80 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-2xl group-hover:scale-110 transition-transform"><Shield size={22} /></div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.privacyPolicy}</span></div><ChevronRight size={20} className="text-gray-400" />
        </button>
        <button onClick={onDataManagement} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-blue-100/80 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform"><Database size={22} /></div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.dataManagement}</span></div><ChevronRight size={20} className="text-gray-400" />
        </button>
        <button onClick={onResetRequest} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-red-100/80 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-2xl group-hover:scale-110 group-hover:-rotate-180 transition-all duration-500"><RotateCcw size={22} /></div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.resetData}</span></div><ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="flex justify-center mt-4 mb-4">
        <a href="https://github.com/koukihk" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-4 py-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-full text-gray-400 dark:text-gray-500 text-xs font-bold hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 transition-all cursor-pointer">
          <Github size={14} className="mr-2" /> {t.developer}: koukihk
        </a>
      </div>
    </div>
  );
};

export default ProfileView;
