import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid, Layers, Gamepad2, User, ChevronRight,
  Sparkles, Heart, CheckCircle,
  CloudLightning, X, PenTool
} from 'lucide-react';
import JSZip from 'jszip';
import * as jaData from './data/ja';
import * as koData from './data/ko';
import { TRANSLATIONS } from './data/translations';

// Import utilities
import { useFavicon } from './utils/helpers';
import { AVATARS } from './utils/constants';

// Import UI components
import { GlassCard, NavItem, SectionHeader } from './components/ui';

// Import Modal components
import {
  HistoryModal,
  ConfirmModal,
  AISettingsModal,
  PrivacyModal,
  KanaCanvasModal,
  UserGuideModal,
  TTSSettingsModal
} from './components/modals';

// Import View components
import {
  DailyGoalsCard,
  KanaView,
  ProfileView,
  FlashcardView,
  MistakeView,
  MatchingGame,
  FillBlankGame,
  QuizView,
  Onboarding
} from './components/views';

const DATA = {
  ja: jaData,
  ko: koData
};


export default function App() {
  const [activeTab, setActiveTab] = useState('kana');
  const [lang, setLang] = useState('zh');
  const [targetLang, setTargetLang] = useState(() => localStorage.getItem('kawaii_target_lang') || 'ja');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('kawaii_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [user, setUser] = useState(null);
  const [drawingChar, setDrawingChar] = useState(null);
  const [practiceMode, setPracticeMode] = useState(null);
  const [filterFavs, setFilterFavs] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [onlineMode, setOnlineMode] = useState(() => localStorage.getItem('kawaii_online_mode') === 'true');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTTSSettings, setShowTTSSettings] = useState(false);
  const [aiConfig, setAIConfig] = useState(() => {
    const saved = localStorage.getItem('kawaii_ai_config');
    return saved ? JSON.parse(saved) : { enabled: false, provider: 'gemini', apiKey: '', model: '', endpoint: '' };
  });
  const [ttsConfig, setTTSConfig] = useState(() => {
    const saved = localStorage.getItem('kawaii_tts_config');
    return saved ? JSON.parse(saved) : { enabled: false, provider: 'native' };
  });

  const t = TRANSLATIONS[lang];
  const isZh = lang === 'zh';

  const currentVocabList = useMemo(() => {
    const base = DATA[targetLang].BASE_VOCAB;
    const cloud = DATA[targetLang].CLOUD_VOCAB;
    return onlineMode ? [...base, ...cloud] : base;
  }, [onlineMode, targetLang]);

  useEffect(() => { window.__appTargetLang = targetLang; }, [targetLang]);


  useEffect(() => {
    const savedUser = localStorage.getItem('kawaii_user_v1');
    const savedLang = localStorage.getItem('kawaii_lang');
    const savedLogs = localStorage.getItem('kawaii_study_logs');
    if (savedLang) setLang(savedLang);
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const today = new Date().toDateString();
      if (parsed.lastLogin !== today) {
        const yest = new Date(); yest.setDate(yest.getDate() - 1);
        parsed.streak = parsed.lastLogin === yest.toDateString() ? parsed.streak + 1 : 1;
        parsed.lastLogin = today;
        parsed.dailyGoals = { date: today, goals: [
          { id: 'quiz', target: 1, current: 0, completed: false },
          { id: 'matching', target: 1, current: 0, completed: false },
          { id: 'words', target: 5, current: 0, completed: false }
        ]};
        saveUser(parsed);
      } else {
        if (!parsed.dailyGoals || parsed.dailyGoals.date !== today) {
          parsed.dailyGoals = { date: today, goals: [
            { id: 'quiz', target: 1, current: 0, completed: false },
            { id: 'matching', target: 1, current: 0, completed: false },
            { id: 'words', target: 5, current: 0, completed: false }
          ]};
          saveUser(parsed);
        } else { setUser(parsed); }
      }
    } else { setUser('NEW'); }
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('kawaii_theme', theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem('kawaii_target_lang', targetLang); }, [targetLang]);

  useFavicon(user && user.avatarId ? AVATARS.find(a => a.id === user.avatarId)?.icon || '🐱' : '🌸');


  const showToast = (msg) => { setToast({ show: true, msg }); setTimeout(() => setToast({ show: false, msg: '' }), 2000); };
  const saveUser = (u) => { setUser(u); localStorage.setItem('kawaii_user_v1', JSON.stringify(u)); };
  const handleUserInit = (name, avatarId) => saveUser({
    name, avatarId, xp: 0, streak: 1, lastLogin: new Date().toDateString(), favorites: [], mistakes: [],
    dailyGoals: { date: new Date().toDateString(), goals: [
      { id: 'quiz', target: 1, current: 0, completed: false },
      { id: 'matching', target: 1, current: 0, completed: false },
      { id: 'words', target: 5, current: 0, completed: false }
    ]}
  });
  const addXp = (amount) => saveUser({ ...user, xp: user.xp + amount });
  const toggleFav = (id) => {
    const favs = user.favorites || [];
    saveUser({ ...user, favorites: favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id] });
  };
  const addMistake = (id) => {
    const mistakes = user.mistakes || [];
    if (!mistakes.includes(id)) saveUser({ ...user, mistakes: [...mistakes, id] });
  };
  const removeMistake = (id) => {
    const mistakes = user.mistakes || [];
    saveUser({ ...user, mistakes: mistakes.filter(m => m !== id) });
  };
  const updateGoal = (type, amount = 1) => {
    if (!user.dailyGoals) return;
    const newGoals = user.dailyGoals.goals.map(g => {
      if (g.id === type && !g.completed) {
        const newCurrent = Math.min(g.current + amount, g.target);
        return { ...g, current: newCurrent, completed: newCurrent >= g.target };
      }
      return g;
    });
    saveUser({ ...user, dailyGoals: { ...user.dailyGoals, goals: newGoals } });
  };
  const claimGoalReward = (goalId) => {
    const newGoals = user.dailyGoals.goals.map(g => g.id === goalId ? { ...g, claimed: true } : g);
    saveUser({ ...user, xp: user.xp + 50, dailyGoals: { ...user.dailyGoals, goals: newGoals } });
    showToast(t.claimed + ' +50 XP');
  };
  const resetData = () => { localStorage.removeItem('kawaii_user_v1'); localStorage.removeItem('kawaii_study_logs'); setUser('NEW'); setActiveTab('kana'); setPracticeMode(null); setLogs([]); };


  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    showToast(`${t.toastTheme} ${newTheme === 'dark' ? t.themeDark : t.themeLight}`);
  };
  const toggleOnlineMode = () => {
    if (!onlineMode) {
      setIsLoadingData(true);
      setTimeout(() => {
        setIsLoadingData(false); setOnlineMode(true);
        localStorage.setItem('kawaii_online_mode', 'true');
        showToast(`${t.toastData} ${t.modeOnline}`);
      }, 1500);
    } else {
      // 切换到离线模式时，自动关闭 AI 助手和在线语音
      if (aiConfig.enabled) saveAIConfig({ ...aiConfig, enabled: false });
      if (ttsConfig.enabled) saveTTSConfig({ ...ttsConfig, enabled: false, provider: 'native' });
      setOnlineMode(false);
      localStorage.setItem('kawaii_online_mode', 'false');
      showToast(`${t.toastData} ${t.modeOffline}`);
    }
  };
  const saveAIConfig = (config) => {
    if (config.enabled && config.apiKey && !onlineMode) {
      setIsLoadingData(true);
      setTimeout(() => { setIsLoadingData(false); setOnlineMode(true); localStorage.setItem('kawaii_online_mode', 'true'); }, 500);
    }
    setAIConfig(config);
    localStorage.setItem('kawaii_ai_config', JSON.stringify(config));
    if (config.enabled && config.apiKey) showToast(`${t.aiMode}: ${t.aiEnabled}`);
  };
  const saveTTSConfig = (config) => {
    // 开启在线语音时，如果当前是离线模式，自动切换到在线模式
    if (config.enabled && config.provider !== 'native' && !onlineMode) {
      setIsLoadingData(true);
      setTimeout(() => { setIsLoadingData(false); setOnlineMode(true); localStorage.setItem('kawaii_online_mode', 'true'); }, 500);
    }
    setTTSConfig(config);
    localStorage.setItem('kawaii_tts_config', JSON.stringify(config));
    if (config.enabled && config.provider !== 'native') showToast(`${t.ttsSettings}: ${t.ttsEnabled}`);
  };
  const addLog = (type, content, score = null) => {
    const newLog = { type, content, score, date: new Date().toISOString() };
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    setLogs(updatedLogs);
    localStorage.setItem('kawaii_study_logs', JSON.stringify(updatedLogs));
  };


  const exportData = async () => {
    const zip = new JSZip();
    const data = { user, logs, settings: { lang, targetLang, theme, onlineMode, aiConfig }, exportDate: new Date().toISOString(), version: '1.0' };
    zip.file('kawaii_backup.json', JSON.stringify(data, null, 2));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `kawaii_backup_${new Date().toISOString().slice(0, 10)}.zip`; a.click();
    URL.revokeObjectURL(url);
    showToast(t.exportSuccess);
  };
  const importData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const zip = await JSZip.loadAsync(file);
      const jsonFile = zip.file('kawaii_backup.json');
      if (!jsonFile) throw new Error('Invalid backup file');
      const content = await jsonFile.async('string');
      const data = JSON.parse(content);
      if (data.user) saveUser(data.user);
      if (data.logs) { setLogs(data.logs); localStorage.setItem('kawaii_study_logs', JSON.stringify(data.logs)); }
      if (data.settings) {
        if (data.settings.lang) { setLang(data.settings.lang); localStorage.setItem('kawaii_lang', data.settings.lang); }
        if (data.settings.targetLang) { setTargetLang(data.settings.targetLang); localStorage.setItem('kawaii_target_lang', data.settings.targetLang); }
        if (data.settings.theme) setTheme(data.settings.theme);
        if (data.settings.onlineMode !== undefined) { setOnlineMode(data.settings.onlineMode); localStorage.setItem('kawaii_online_mode', String(data.settings.onlineMode)); }
        if (data.settings.aiConfig) { setAIConfig(data.settings.aiConfig); localStorage.setItem('kawaii_ai_config', JSON.stringify(data.settings.aiConfig)); }
      }
      showToast(t.importSuccess);
    } catch (err) { showToast(t.importFail); }
    e.target.value = '';
  };

  if (!user) return null;


  return (
    <div className="min-h-screen relative font-sans text-gray-900 dark:text-gray-100 bg-[#eff4ff] dark:bg-[#0f172a] overflow-hidden transition-colors duration-500 selection:bg-blue-200 selection:text-blue-900">
      {/* Toast notification */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/50 dark:border-white/10 text-gray-800 dark:text-white px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] font-bold text-sm flex items-center">
          <Sparkles size={16} className="mr-2 text-yellow-400" /> {toast.msg}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoadingData && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl flex flex-col items-center">
            <CloudLightning size={48} className="text-blue-500 animate-bounce mb-4" />
            <p className="font-bold text-gray-700 dark:text-white">{t.loading}</p>
          </div>
        </div>
      )}

      {/* Onboarding for new users */}
      {user === 'NEW' && <Onboarding t={t} onComplete={handleUserInit} lang={lang} onLangChange={(newLang) => { setLang(newLang); localStorage.setItem('kawaii_lang', newLang); }} />}

      {/* Modals */}
      {drawingChar && <KanaCanvasModal char={drawingChar} onClose={() => setDrawingChar(null)} t={t} addLog={addLog} notify={showToast} />}
      {showResetModal && <ConfirmModal title={t.resetData} description={t.resetConfirm} confirmLabel={t.resetData} cancelLabel={t.cancel} onCancel={() => setShowResetModal(false)} onConfirm={() => { resetData(); setShowResetModal(false); }} />}
      {showAISettings && <AISettingsModal t={t} aiConfig={aiConfig} onSave={saveAIConfig} onClose={() => setShowAISettings(false)} onlineMode={onlineMode} />}
      {showPrivacy && <PrivacyModal t={t} onClose={() => setShowPrivacy(false)} />}
      {showTTSSettings && <TTSSettingsModal t={t} ttsConfig={ttsConfig} onSave={saveTTSConfig} onClose={() => setShowTTSSettings(false)} onlineMode={onlineMode} lang={lang} />}


      {/* Background gradients */}
      <div className="fixed inset-0 -z-10 transition-opacity duration-700">
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,_#dbeafe_0%,_transparent_50%),radial-gradient(circle_at_90%_60%,_#fce7f3_0%,_transparent_40%),radial-gradient(circle_at_10%_60%,_#ede9fe_0%,_transparent_40%)] opacity-80 animate-pulse-slow ${theme === 'dark' ? 'opacity-0' : 'opacity-80'}`}></div>
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e293b_0%,_#0f172a_100%)] ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#3b82f6_0%,_transparent_40%),radial-gradient(circle_at_80%_50%,_#6366f1_0%,_transparent_40%)] mix-blend-screen opacity-20 ${theme === 'dark' ? 'opacity-30' : 'opacity-0'}`}></div>
      </div>
      <div className="fixed inset-0 -z-10 opacity-[0.04] dark:opacity-[0.07] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Main content */}
      <main className={`w-full max-w-lg md:max-w-4xl mx-auto h-[100dvh] overflow-y-auto no-scrollbar ${practiceMode ? 'p-4' : 'px-4 pt-10 pb-24'}`}>
        {user !== 'NEW' && !practiceMode && (
          <div className="min-h-full">
            {activeTab === 'kana' && <KanaView t={t} openCanvas={setDrawingChar} data={DATA[targetLang]} targetLang={targetLang} />}
            {activeTab === 'practice' && (
              <div className="animate-fade-in space-y-6 pb-24">
                <SectionHeader title={t.practiceHubTitle} subtitle={t.practiceHubDesc} />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-4">
                  <div onClick={() => { setPracticeMode('flashcards'); setFilterFavs(false); }} className="bg-white/60 dark:bg-gray-800/50 backdrop-blur-xl p-5 rounded-[2rem] shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group border border-white/60 dark:border-white/10 relative overflow-hidden flex flex-col justify-between h-48 md:h-56">
                    <div className="absolute -right-4 -top-4 opacity-5 text-8xl group-hover:scale-110 transition-transform">🎴</div>
                    <div className="w-14 h-14 bg-blue-100/80 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-blue-500 dark:text-blue-300 mb-2 group-hover:rotate-12 transition-transform shadow-sm"><Layers size={28} /></div>
                    <div><h3 className="text-xl font-black text-gray-800 dark:text-white leading-tight">{t.modeFlashcards}</h3><p className="text-gray-400 dark:text-gray-500 text-xs mt-1 font-bold">{t.modeFlashcardsDesc}</p></div>
                  </div>

                  <div onClick={() => { setPracticeMode('matching'); }} className="bg-white/60 dark:bg-gray-800/50 backdrop-blur-xl p-5 rounded-[2rem] shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group border border-white/60 dark:border-white/10 relative overflow-hidden flex flex-col justify-between h-48 md:h-56">
                    <div className="absolute -right-4 -top-4 opacity-5 text-8xl group-hover:scale-110 transition-transform">🧩</div>
                    <div className="w-14 h-14 bg-purple-100/80 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center text-purple-500 dark:text-purple-300 mb-2 group-hover:rotate-12 transition-transform shadow-sm"><Gamepad2 size={28} /></div>
                    <div><h3 className="text-xl font-black text-gray-800 dark:text-white leading-tight">{t.modeMatching}</h3><p className="text-gray-400 dark:text-gray-500 text-xs mt-1 font-bold">{t.modeMatchingDesc}</p></div>
                  </div>
                  <div onClick={() => { setPracticeMode('quiz'); }} className="bg-white/60 dark:bg-gray-800/50 backdrop-blur-xl p-5 rounded-[2rem] shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group border border-white/60 dark:border-white/10 relative overflow-hidden flex flex-col justify-between h-48 md:h-56">
                    <div className="absolute -right-4 -top-4 opacity-5 text-8xl group-hover:scale-110 transition-transform">📝</div>
                    <div className="w-14 h-14 bg-indigo-100/80 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-300 mb-2 group-hover:rotate-12 transition-transform shadow-sm"><CheckCircle size={28} /></div>
                    <div><h3 className="text-xl font-black text-gray-800 dark:text-white leading-tight">{t.modeQuiz}</h3><p className="text-gray-400 dark:text-gray-500 text-xs mt-1 font-bold">{t.modeQuizDesc}</p></div>
                  </div>
                  {aiConfig?.enabled && aiConfig?.apiKey && (
                    <div onClick={() => { setPracticeMode('fillblank'); }} className="col-span-2 md:col-span-3 bg-gradient-to-r from-amber-500 to-orange-600 p-6 rounded-[2rem] shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:scale-[1.01] transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-center h-auto">
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-white/20 rounded-full text-white backdrop-blur-sm"><PenTool size={28} /></div>
                          <div className="text-white">
                            <div className="flex items-center gap-2"><h3 className="font-black text-2xl">{t.modeFillBlank}</h3><span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">AI</span></div>
                            <p className="text-orange-100 text-sm font-medium">{t.modeFillBlankDesc}</p>
                          </div>
                        </div>
                        <ChevronRight className="text-white/70" size={28} />
                      </div>
                    </div>
                  )}
                </div>

                {(user.mistakes?.length > 0) && (
                  <div onClick={() => setPracticeMode('mistake')} className="bg-red-50/60 dark:bg-red-900/20 backdrop-blur-xl p-6 rounded-[2rem] border border-red-100 dark:border-red-800 cursor-pointer flex items-center justify-between hover:bg-red-100/80 dark:hover:bg-red-900/30 transition-colors mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-red-200 dark:bg-red-800 text-red-600 dark:text-red-200 rounded-full"><X size={24} /></div>
                      <div><h3 className="font-bold text-red-900 dark:text-red-100 text-lg">{t.mistakeTitle}</h3><p className="text-xs text-red-600 dark:text-red-300 font-bold">{user.mistakes.length} words</p></div>
                    </div>
                    <ChevronRight className="text-red-300" />
                  </div>
                )}
                {(user.favorites?.length > 0) && (
                  <div onClick={() => { setPracticeMode('flashcards'); setFilterFavs(true); }} className="bg-pink-50/60 dark:bg-pink-900/20 backdrop-blur-xl p-6 rounded-[2rem] border border-pink-100 dark:border-pink-800 cursor-pointer flex items-center justify-between hover:bg-pink-100/80 dark:hover:bg-pink-900/30 transition-colors mt-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-pink-200 dark:bg-pink-800 text-pink-600 dark:text-pink-200 rounded-full"><Heart fill="currentColor" size={24} /></div>
                      <div><h3 className="font-bold text-pink-900 dark:text-pink-100 text-lg">{t.onlyFavorites}</h3><p className="text-xs text-pink-600 dark:text-pink-300 font-bold">{user.favorites.length} words</p></div>
                    </div>
                    <ChevronRight className="text-pink-300" />
                  </div>
                )}
              </div>
            )}
            {activeTab === 'profile' && <ProfileView t={t} isZh={isZh} toggleLang={() => { const newLang = lang === 'zh' ? 'en' : 'zh'; setLang(newLang); localStorage.setItem('kawaii_lang', newLang); }} user={user} updateUser={saveUser} theme={theme} toggleTheme={toggleTheme} onlineMode={onlineMode} toggleOnlineMode={toggleOnlineMode} logs={logs} targetLang={targetLang} setTargetLang={setTargetLang} claimGoal={claimGoalReward} onResetRequest={() => setShowResetModal(true)} aiConfig={aiConfig} onAISettingsOpen={() => setShowAISettings(true)} onPrivacyOpen={() => setShowPrivacy(true)} onExportData={exportData} onImportData={importData} ttsConfig={ttsConfig} onTTSSettingsOpen={() => setShowTTSSettings(true)} />}
          </div>
        )}

        {practiceMode && (
          <div className="h-full">
            {practiceMode === 'mistake' && <MistakeView t={t} isZh={isZh} vocabList={currentVocabList} userMistakes={user.mistakes || []} removeMistake={removeMistake} onFinish={() => setPracticeMode(null)} aiConfig={aiConfig} targetLang={targetLang} />}
            {practiceMode === 'flashcards' && <FlashcardView t={t} isZh={isZh} vocabList={filterFavs ? currentVocabList.filter(v => user.favorites.includes(v.id)) : currentVocabList} userFavorites={user.favorites || []} toggleFavorite={toggleFav} onFinish={() => { setPracticeMode(null); addXp(10); }} updateGoal={updateGoal} aiConfig={aiConfig} targetLang={targetLang} />}
            {practiceMode === 'matching' && <MatchingGame t={t} isZh={isZh} vocabList={currentVocabList} addXp={addXp} onFinish={() => { setPracticeMode(null); addXp(20); }} addLog={addLog} addMistake={addMistake} updateGoal={updateGoal} aiConfig={aiConfig} targetLang={targetLang} />}
            {practiceMode === 'quiz' && <QuizView t={t} isZh={isZh} vocabList={currentVocabList} addXp={addXp} onFinish={() => { setPracticeMode(null); }} addLog={addLog} praisePhrases={DATA[targetLang].PRAISE_PHRASES} addMistake={addMistake} updateGoal={updateGoal} user={user} toggleFavorite={toggleFav} aiConfig={aiConfig} targetLang={targetLang} />}
            {practiceMode === 'fillblank' && <FillBlankGame t={t} isZh={isZh} vocabList={currentVocabList} addXp={addXp} onFinish={() => { setPracticeMode(null); }} addLog={addLog} aiConfig={aiConfig} targetLang={targetLang} updateGoal={updateGoal} />}
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      {!practiceMode && user !== 'NEW' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[360px] md:max-w-lg animate-slide-up">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-black/50 rounded-[2.5rem] p-2 flex items-center justify-between px-4 md:px-8 ring-1 ring-white/50 dark:ring-white/5">
            <NavItem icon={Grid} label={t[DATA[targetLang].LABELS.tab1Key]} active={activeTab === 'kana'} onClick={() => setActiveTab('kana')} />
            <NavItem icon={Gamepad2} label={t.tabPractice} active={activeTab === 'practice'} onClick={() => setActiveTab('practice')} />
            <NavItem icon={User} label={t.tabProfile} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </div>
        </div>
      )}


      {/* Global styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Zen+Maru+Gothic:wght@500;700;900&display=swap');
        body { font-family: 'Zen Maru Gothic', 'Nunito', sans-serif; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
        .animate-shimmer { animation: shimmer 3s infinite linear; }
        @keyframes shimmer { 0% { transform: translateX(-100%) skewX(-15deg); } 100% { transform: translateX(200%) skewX(-15deg); } }
        .animate-gradient-slow { background-size: 200% 200%; animation: gradientBG 8s ease infinite; }
        @keyframes gradientBG { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .ios-scrollbar::-webkit-scrollbar { width: 6px; }
        .ios-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .ios-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; }
        .ios-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.3); }
        .dark .ios-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }
        .dark .ios-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}
