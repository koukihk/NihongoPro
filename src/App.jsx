import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Grid, Layers, Gamepad2, User, ChevronRight, RotateCcw,
  Volume2, Globe, Edit3, X, Zap, Trophy,
  Sparkles, Heart, CheckCircle, Star as StarIcon,
  Sun, Moon, Wifi, WifiOff, CloudLightning, PenLine, Palette, History, Clock, Github, Quote, ArrowRight,
  Languages, Target
} from 'lucide-react';
import * as jaData from './data/ja';
import * as koData from './data/ko';
import { TRANSLATIONS } from './data/translations';

const DATA = {
  ja: jaData,
  ko: koData
};

/**
 * =====================================================================
 * 1. 数据中心 (DATA CENTER)
 * =====================================================================
 */


const LEVELS = [0, 100, 300, 600, 1000, 2000, 4000, 8000];

const AVATARS = [
  { id: 'cat', icon: '🐱', bg: 'bg-orange-100 dark:bg-orange-900/50' },
  { id: 'shiba', icon: '🐕', bg: 'bg-yellow-100 dark:bg-yellow-900/50' },
  { id: 'rabbit', icon: '🐰', bg: 'bg-pink-100 dark:bg-pink-900/50' },
  { id: 'bear', icon: '🐻', bg: 'bg-brown-100 dark:bg-amber-900/50' },
  { id: 'onigiri', icon: '🍙', bg: 'bg-green-100 dark:bg-green-900/50' },
  { id: 'sakura', icon: '🌸', bg: 'bg-red-50 dark:bg-red-900/50' },
  { id: 'ramen', icon: '🍜', bg: 'bg-orange-50 dark:bg-orange-950/50' },
  { id: 'dango', icon: '🍡', bg: 'bg-purple-50 dark:bg-purple-900/50' },
];

/**
 * =====================================================================
 * 2. 工具函数 (UTILS)
 * =====================================================================
 */

const useFavicon = (emoji) => {
  useEffect(() => {
    const linkFont = document.createElement('link');
    linkFont.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Zen+Maru+Gothic:wght@500;700;900&display=swap";
    linkFont.rel = "stylesheet";
    document.head.appendChild(linkFont);

    const canvas = document.createElement('canvas');
    canvas.height = 64; canvas.width = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '48px serif';
    ctx.fillText(emoji, 8, 48);
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = canvas.toDataURL();
    document.getElementsByTagName('head')[0].appendChild(link);
  }, [emoji]);
};

const speak = (text) => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP'; // TODO: Dynamic lang
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }, 10);
  }
};

const getLevelInfo = (xp) => {
  let level = 1;
  let nextLevelXp = LEVELS[1];
  let currentLevelBaseXp = 0;
  for (let i = 0; i < LEVELS.length - 1; i++) {
    if (xp >= LEVELS[i]) {
      level = i + 1;
      currentLevelBaseXp = LEVELS[i];
      nextLevelXp = LEVELS[i + 1];
    }
  }
  const progress = ((xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100;
  return { level, progress: Math.min(progress, 100), nextXp: nextLevelXp };
};

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * =====================================================================
 * 3. UI 组件 (UI COMPONENTS)
 * =====================================================================
 */

const GlassCard = ({ children, className = "", onClick, noPadding = false, active = false, shine = false }) => (
  <div
    onClick={onClick}
    className={`
      relative
      overflow-hidden
      backdrop-blur-3xl
      transition-all duration-300 ease-out
      ${active
        ? 'bg-white/80 dark:bg-gray-800/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] dark:shadow-none scale-[1.01] ring-2 ring-blue-400/50 dark:ring-blue-500/50'
        : 'bg-white/60 dark:bg-gray-900/50 hover:bg-white/70 dark:hover:bg-gray-800/60'
      }
      border border-white/40 dark:border-white/10
      shadow-lg hover:shadow-xl hover:shadow-blue-500/5 dark:shadow-black/30
      rounded-[2.5rem]
      ${noPadding ? '' : 'p-6'}
      ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
      ${className}
    `}
  >
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70 dark:opacity-20"></div>
    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5 pointer-events-none"></div>

    {shine && (
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-transparent via-white/30 dark:via-white/10 to-transparent translate-x-[-100%] animate-shimmer pointer-events-none"></div>
    )}
    <div className="relative z-10 w-full h-full">{children}</div>
  </div>
);

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center h-full flex-1 group min-w-[70px]
      transition-transform duration-300
    `}
  >
    <div className={`
      relative p-3 rounded-2xl transition-all duration-500 ease-out mb-1
      ${active
        ? 'bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 -translate-y-2 scale-110'
        : 'text-gray-400 dark:text-gray-500 hover:bg-white/40 dark:hover:bg-white/10'
      }
    `}>
      <Icon size={26} strokeWidth={active ? 2.5 : 2} />
    </div>
    <span className={`
      text-[12px] font-bold transition-all duration-300
      ${active ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-gray-400 dark:text-gray-500'}
    `}>{label}</span>
  </button>
);

const Avatar = ({ id, size = 'md', className = "" }) => {
  const avatar = AVATARS.find(a => a.id === id) || AVATARS[0];
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-16 h-16 text-3xl',
    lg: 'w-24 h-24 text-5xl',
    xl: 'w-32 h-32 text-6xl'
  };
  return (
    <div className={`
      rounded-full flex items-center justify-center shadow-inner ring-2 ring-white/20
      ${avatar.bg} ${sizeClasses[size]} ${className}
      select-none animate-bounce-slow
    `}>
      {avatar.icon}
    </div>
  );
};

const SectionHeader = ({ title, subtitle, targetLang }) => {
  const [emoji, setEmoji] = useState(null);
  const triggerEasterEgg = () => {
    const emojis = targetLang === 'ko'
      ? ['🌸', '✨', '🥘', '🎉', '🏔️']
      : ['🌸', '✨', '🍣', '🎉', '🗻'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    setEmoji(randomEmoji);
    setTimeout(() => setEmoji(null), 1000);
  };

  return (
    <div className="mb-8 px-4 md:px-0 cursor-pointer" onClick={triggerEasterEgg}>
      <h2 className="text-3xl md:text-4xl font-black text-gray-800 dark:text-white tracking-tight flex items-center drop-shadow-sm">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 animate-gradient-slow">{title}</span>
        <Sparkles size={24} className="ml-3 text-yellow-400 fill-current animate-pulse" />
        {emoji && <span className="ml-2 animate-bounce absolute -top-4 left-32 text-4xl">{emoji}</span>}
      </h2>
      {subtitle && <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-2 font-bold opacity-80">{subtitle}</p>}
    </div>
  )
}

/**
 * =====================================================================
 * 4. 核心功能视图 (VIEWS)
 * =====================================================================
 */

const HistoryModal = ({ logs, onClose, t }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-fade-in transition-opacity" onClick={onClose}></div>
    <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[2.5rem] p-6 relative z-10 shadow-2xl animate-scale-up border border-white/50 ring-1 ring-white/50 max-h-[70vh] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center">
          <History size={24} className="mr-2 text-blue-500" /> {t.historyTitle}
        </h3>
        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <CloudLightning size={48} className="mx-auto mb-2 opacity-20" />
            <p>{t.historyEmpty}</p>
          </div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="flex items-center p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/5">
              <div className={`p-3 rounded-xl mr-3 ${log.type === 'quiz' ? 'bg-purple-100 text-purple-600' : log.type === 'matching' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                {log.type === 'quiz' ? <Trophy size={18} /> : log.type === 'matching' ? <Gamepad2 size={18} /> : <Edit3 size={18} />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                  {log.type === 'quiz' ? t.logQuiz : log.type === 'matching' ? t.logMatching : t.logWriting}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {log.type === 'quiz' ? `${t.quizScore}: ${log.score}` : log.content}
                </p>
              </div>
              <div className="text-[10px] text-gray-400 font-bold flex flex-col items-end">
                <Clock size={12} className="mb-1" />
                <span>{formatDate(log.date)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

const ConfirmModal = ({ title, description, confirmLabel, cancelLabel, onConfirm, onCancel }) => {
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsEntering(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-400 ${isEntering ? 'opacity-100' : 'opacity-0'}`}
        onClick={onCancel}
      ></div>
      <div className={`relative w-full max-w-sm bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl border border-white/60 dark:border-white/10 ring-1 ring-white/40 dark:ring-white/5 transition-all duration-500 ${isEntering ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/60 dark:hover:bg-gray-800 transition-colors"><X size={20} className="text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-300 leading-relaxed">{description}</p>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl font-bold text-gray-500 dark:text-gray-300 bg-white/70 dark:bg-gray-800/50 border border-white/60 dark:border-white/10 backdrop-blur-xl">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const KanaCanvasModal = ({ char, onClose, t, addLog }) => {
  const canvasRef = useRef(null);
  const [brushColor, setBrushColor] = useState('#3B82F6');
  const [brushSize, setBrushSize] = useState(8);
  const hasDrawn = useRef(false);

  const BRUSH_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#374151'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 4;
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = brushColor;
      ctx.shadowColor = brushColor;
    }
    resize();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;
    ctx.shadowColor = brushColor;
  }, [brushColor, brushSize]);


  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };
  const start = (e) => {
    e.preventDefault();
    hasDrawn.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
    canvasRef.current.isDrawing = true;
  };
  const move = (e) => {
    e.preventDefault();
    if (!canvasRef.current.isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y); ctx.stroke();
  };
  const end = () => canvasRef.current.isDrawing = false;
  const handleClose = () => {
    if (hasDrawn.current) {
      addLog('writing', `${char.label}: ${char.char}`);
    }
    onClose();
  }
  const clear = () => canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white">{t.drawTitle}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.drawDesc}</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
        </div>

        <div className="relative aspect-square bg-white dark:bg-gray-950 m-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 overflow-hidden touch-none">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <span className="text-[200px] font-serif text-gray-900 dark:text-white select-none">{char.char}</span>
          </div>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 cursor-crosshair"
            onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
            onTouchStart={start} onTouchMove={move} onTouchEnd={end}
          />
        </div>

        <div className="flex flex-col space-y-3 mb-6 p-3 bg-gray-50 dark:bg-black/20 rounded-2xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mr-2 flex items-center"><Palette size={14} className="mr-1" /> {t.brushColor}</span>
            <div className="flex space-x-2">
              {BRUSH_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setBrushColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${brushColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-16">{t.brushSize}</span>
            <input type="range" min="2" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500" />
          </div>
        </div>

        <div className="flex gap-4 px-4 pb-4 pt-1">
          <button onClick={clear} className="flex-1 py-4 rounded-[1.75rem] bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl font-bold text-gray-700 dark:text-gray-100 border border-white/60 dark:border-white/15 shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:bg-white/90 dark:hover:bg-gray-800/60 transition-all flex items-center justify-center">
            <RotateCcw size={20} className="mr-2" /> {t.clear}
          </button>
          <button onClick={() => speak(char.char)} className="flex-1 py-4 rounded-[1.75rem] bg-gradient-to-r from-blue-500/90 to-indigo-500/90 font-bold text-white border border-white/40 dark:border-white/10 shadow-[0_18px_40px_rgba(59,130,246,0.35)] hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center active:scale-95">
            <Volume2 size={20} className="mr-2" /> Play
          </button>
        </div>
      </div>
    </div>
  );
};

const KanaView = ({ t, openCanvas, data, targetLang }) => {
  const [tab, setTab] = useState('hiragana'); // Changed from 'mode' to 'tab'
  const { ALPHABET_DATA, LABELS } = data;

  return (
    <div className="animate-fade-in pb-24">
      <SectionHeader title={t[data.LABELS.tab1Key]} subtitle={t.appSubtitle} targetLang={targetLang} />

      <div className="flex justify-center mb-6 bg-white/50 dark:bg-gray-800/50 p-1 rounded-2xl backdrop-blur-sm mx-4 border border-white/40 dark:border-white/5">
        <button onClick={() => setTab('hiragana')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'hiragana' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>{t[data.LABELS.tab1_sub1Key]}</button>
        <button onClick={() => setTab('katakana')} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'katakana' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}>{t[data.LABELS.tab1_sub2Key]}</button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4 px-2">
        {ALPHABET_DATA.map((item, index) => {
          const char = tab === 'hiragana' ? item.h : item.k; // Changed from 'mode' to 'tab'
          const label = t[data.LABELS[tab === 'hiragana' ? 'tab1_sub1Key' : 'tab1_sub2Key']];
          return (
            <GlassCard key={index} onClick={() => { speak(char); openCanvas({ char, label }); }} className="aspect-square flex flex-col relative group !p-2 !rounded-3xl hover:-translate-y-1 hover:border-blue-300/50 dark:hover:border-blue-500/30">
              <div className="flex-1 flex items-center justify-center"><span className="text-3xl md:text-4xl font-medium text-gray-800 dark:text-white group-hover:scale-110 transition-transform duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{char}</span></div>
              <div className="absolute bottom-2 w-full text-center"><span className="text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{item.r}</span></div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  );
};

/**
 * =====================================================================
 * 5. 伴学宠物 (COMPANION PET)
 * =====================================================================
 */


const DailyGoalsCard = ({ t, goals, onClaim }) => {
  if (!goals) return null;
  return (
    <GlassCard className="w-full mb-6 !p-5 !bg-white/60 dark:!bg-gray-800/60 border-2 border-white/50 dark:border-white/5">
      <h3 className="text-lg font-black text-gray-800 dark:text-white mb-4 flex items-center">
        <Target size={20} className="mr-2 text-red-500" /> {t.dailyGoalsTitle}
      </h3>
      <div className="space-y-3">
        {goals.map(g => (
          <div key={g.id} className="flex items-center justify-between bg-white/40 dark:bg-black/20 p-3 rounded-xl">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                <span>{t[`goal${g.id.charAt(0).toUpperCase() + g.id.slice(1)}`]}</span>
                <span>{g.current}/{g.target}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(g.current / g.target) * 100}%` }}></div>
              </div>
            </div>
            <button
              onClick={() => onClaim(g.id)}
              disabled={!g.completed || g.claimed}
              className={`ml-3 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border backdrop-blur-sm ${
                g.claimed
                  ? 'bg-gray-200 text-gray-400 border-white/40 dark:bg-gray-800/70 dark:text-gray-500 dark:border-white/10'
                  : g.completed
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30 animate-pulse border-transparent dark:from-green-400 dark:to-emerald-400 dark:text-gray-900'
                    : 'bg-white/80 text-gray-500 border-white/60 dark:bg-white/10 dark:text-gray-200 dark:border-white/5'
              }`}
            >
              {g.claimed ? t.claimed : t.claim}
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

const ProfileView = ({ t, isZh, toggleLang, user, updateUser, theme, toggleTheme, onlineMode, toggleOnlineMode, logs, targetLang, setTargetLang, claimGoal, onResetRequest }) => {
  const { level, progress, nextXp } = getLevelInfo(user.xp);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [tempName, setTempName] = useState(user.name || '');

  const dailyQuote = useMemo(() => DATA[targetLang].DAILY_QUOTES[new Date().getDate() % DATA[targetLang].DAILY_QUOTES.length], [targetLang]);

  const displayName = user.name || t.defaultName;
  const saveName = () => { if (tempName.trim()) { updateUser({ ...user, name: tempName.trim() }); setIsEditingName(false); } }

  return (
    <div className="space-y-6 pb-32 animate-fade-in max-w-md md:max-w-2xl mx-auto">
      {showHistory && <HistoryModal logs={logs} t={t} onClose={() => setShowHistory(false)} />}
      <SectionHeader title={t.tabProfile} targetLang={targetLang} />
      <div className="relative px-4 mt-12">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 cursor-pointer group" onClick={() => setIsEditingAvatar(!isEditingAvatar)}>
          <Avatar id={user.avatarId} size="xl" className="shadow-[0_10px_40px_rgba(0,0,0,0.2)] ring-8 ring-white dark:ring-gray-900 group-hover:scale-110 transition-transform duration-300 bg-white dark:bg-gray-800" />
          <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg border-4 border-white dark:border-gray-900 hover:bg-blue-600 transition-colors"><Edit3 size={16} /></div>
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
          <div className="flex items-center justify-center space-x-2 mb-6 z-10"><span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-md shadow-blue-500/30">Lv.{level}</span><span className="text-gray-500 dark:text-gray-400 text-sm font-bold">{Math.floor(user.xp)} / {nextXp} XP</span></div>


          <div className="w-full mb-8 px-4 flex justify-center">
            <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 text-center w-full p-4 backdrop-blur-sm">
              <p className="text-xs text-blue-500 font-bold mb-1 flex items-center justify-center uppercase tracking-widest"><span className="mr-1">✨</span> {t.quote}</p>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{dailyQuote.ja}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{isZh ? dailyQuote.zh : dailyQuote.ro}</p>
            </div>
          </div>

          {isEditingAvatar && (
            <div className="mb-8 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl w-full max-w-xs animate-fade-in grid grid-cols-4 gap-4 border border-white/60 dark:border-white/10 z-20 shadow-2xl mx-auto">
              {AVATARS.map(a => (<button key={a.id} onClick={() => { updateUser({ ...user, avatarId: a.id }); setIsEditingAvatar(false); }} className={`p-2 rounded-2xl flex justify-center hover:bg-white/50 dark:hover:bg-white/10 transition-colors ${user.avatarId === a.id ? 'bg-white dark:bg-white/20 shadow-md ring-2 ring-blue-400' : ''}`}><span className="text-3xl">{a.icon}</span></button>))}
            </div>
          )}
          <div className="flex w-full px-2 space-x-4 z-10">
            <div className="flex-1 bg-orange-50/60 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 p-4 rounded-3xl flex flex-col items-center hover:scale-105 transition-transform"><Zap size={24} className="text-orange-500 mb-2 filter drop-shadow-sm" fill="currentColor" /><span className="text-2xl font-black text-gray-800 dark:text-white">{user.streak}</span><span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{t.days}</span></div>
            <div className="flex-1 bg-purple-50/60 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 p-4 rounded-3xl flex flex-col items-center hover:scale-105 transition-transform"><Trophy size={24} className="text-purple-500 mb-2 filter drop-shadow-sm" fill="currentColor" /><span className="text-2xl font-black text-gray-800 dark:text-white">{user.xp}</span><span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{t.xp}</span></div>
          </div>
          <div className="w-full mt-8 px-8 z-10">
            <div className="h-3 bg-gray-200/60 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 rounded-full transition-all duration-1000 shadow-[0_2px_10px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }}></div></div>
          </div>
          <div className="w-full px-6 mt-8 z-10">
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
        <button onClick={toggleTheme} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-orange-100/80 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-2xl group-hover:scale-110 transition-transform">{theme === 'dark' ? <Moon size={22} /> : <Sun size={22} />}</div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.themeMode}</span></div><span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-black/20 px-3 py-1 rounded-xl shadow-sm">{theme === 'dark' ? t.themeDark : t.themeLight}</span>
        </button>
        <button onClick={toggleOnlineMode} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-cyan-100/80 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 rounded-2xl group-hover:scale-110 transition-transform">{onlineMode ? <Wifi size={22} /> : <WifiOff size={22} />}</div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.dataMode}</span></div><span className={`text-sm font-bold px-3 py-1 rounded-xl shadow-sm ${onlineMode ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>{onlineMode ? t.modeOnline : t.modeOffline}</span>
        </button>
        <button onClick={toggleLang} className="w-full flex items-center justify-between p-5 bg-white/50 dark:bg-gray-800/40 rounded-3xl hover:bg-white/70 dark:hover:bg-gray-700/60 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/5 backdrop-blur-md group active:scale-[0.98]">
          <div className="flex items-center space-x-4"><div className="p-3 bg-indigo-100/80 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform"><Globe size={22} /></div><span className="font-bold text-gray-700 dark:text-gray-200 text-lg">{t.switchLang}</span></div><span className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-black/20 px-3 py-1 rounded-xl shadow-sm">{isZh ? '中文' : 'EN'}</span>
        </button>
      </div>
      <div className="px-4 flex flex-col gap-4">
        <button onClick={onResetRequest} className="w-full flex items-center justify-center p-5 bg-red-50/50 dark:bg-red-900/20 rounded-3xl hover:bg-red-100/80 dark:hover:bg-red-900/40 transition-all border border-red-100 dark:border-red-900/30 backdrop-blur-md group active:scale-[0.98]"><RotateCcw size={20} className="mr-2 text-red-500 dark:text-red-400 group-hover:-rotate-180 transition-transform duration-500" /><span className="font-bold text-red-500 dark:text-red-400">{t.resetData}</span></button>

        <a href="https://github.com/koukihk" target="_blank" rel="noreferrer" className="mx-auto inline-flex items-center justify-center px-4 py-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-full text-gray-400 dark:text-gray-500 text-xs font-bold hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 transition-all cursor-pointer mb-4">
          <Github size={14} className="mr-2" /> {t.developer}: koukihk
        </a>
      </div>
    </div>
  )
};

const QuizView = ({ t, isZh, vocabList, addXp, onFinish, addLog, praisePhrases, addMistake, updateGoal }) => {
  // ... (QuizView hooks remain the same, fixed useEffect logic)
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const scoreRef = useRef(0);

  // 关键修复：正确使用 useEffect 初始化题目，防止白屏
  useEffect(() => {
    if (!vocabList || vocabList.length === 0) return;
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
  }, [vocabList]);

  // 关键修复：将播放表扬语音的 useEffect 移到顶层
  useEffect(() => {
    if (isCompleted) {
      const phrase = praisePhrases[Math.floor(Math.random() * praisePhrases.length)];
      speak(phrase);
    }
  }, [isCompleted, praisePhrases]);

  const handleSelect = (option) => {
    if (selectedOption) return;
    setSelectedOption(option);
    const correct = option.id === questions[currentIndex].answer.id;
    setIsCorrect(correct);
    let points = 0;
    if (correct) {
      points = 20 + (combo * 5); setScore(s => s + points); scoreRef.current += points; setCombo(c => c + 1); speak(questions[currentIndex].answer.kana || questions[currentIndex].answer.ja);
    } else {
      setCombo(0); if (navigator.vibrate) navigator.vibrate(200);
      addMistake(questions[currentIndex].answer.id);
    }
    setTimeout(() => {
      if (currentIndex < questions.length - 1) { setCurrentIndex(c => c + 1); setSelectedOption(null); setIsCorrect(null); } else { setIsCompleted(true); updateGoal('quiz'); }
    }, 1000);
  };

  if (questions.length === 0) return <div className="flex items-center justify-center h-full"><CloudLightning className="animate-bounce text-blue-300" /></div>;

  if (isCompleted) {
    const isPerfect = scoreRef.current >= 100;
    const stars = isPerfect ? 3 : scoreRef.current > 60 ? 2 : 1;

    return (
      <div className="flex flex-col items-center justify-center h-full animate-scale-up px-4">
        <div className="relative mb-8 w-full max-w-sm">
          <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20 animate-pulse"></div>
          <GlassCard className="!p-8 flex flex-col items-center !bg-white/80 dark:!bg-gray-800/90" shine={isPerfect}>
            <Trophy size={64} className={`mb-4 ${isPerfect ? 'text-yellow-500 animate-bounce' : 'text-blue-500'}`} fill="currentColor" />
            <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">{isPerfect ? t.quizPerfect : t.quizFinish}</h2>
            <div className="text-gray-500 dark:text-gray-400 font-bold mb-6">{isPerfect ? t.quizGood : t.quizKeepGoing}</div>
            <div className="flex space-x-2 mb-6">{[1, 2, 3].map(i => (<StarIcon key={i} size={32} className={`${i <= stars ? 'text-yellow-400 fill-current' : 'text-gray-200 dark:text-gray-700'} transition-all duration-500`} style={{ animationDelay: `${i * 0.2}s` }} />))}</div>
            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">{scoreRef.current}</div>
            <button onClick={() => { addXp(scoreRef.current); addLog('quiz', 'Daily Quiz', scoreRef.current); onFinish(); }} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/30 active:scale-95 transition-all text-lg flex items-center justify-center"><Zap size={20} className="mr-2 fill-current" /> {t.claimReward}</button>
          </GlassCard>
        </div>
      </div>
    )
  }
  const currentQ = questions[currentIndex];
  // Fallback guard
  if (!currentQ) return null;

  return (
    <div className="flex flex-col h-full animate-fade-in pb-20 pt-4 px-2">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onFinish} className="p-2 bg-white/40 dark:bg-gray-800/40 rounded-full hover:bg-white dark:hover:bg-gray-700"><X size={24} className="text-gray-700 dark:text-gray-300" /></button>
        <div className="flex flex-col items-center"><h3 className="font-bold text-gray-600 dark:text-gray-300">{t.quizTitle}</h3><div className="flex space-x-1 mt-1">{questions.map((_, i) => <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${i === currentIndex ? 'bg-blue-500' : i < currentIndex ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`}></div>)}</div></div>
        <div className="font-black text-blue-600 dark:text-blue-400">{score}</div>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center">
        {combo > 1 && <div className="text-yellow-500 font-black text-xl animate-bounce mb-4 drop-shadow-sm">🔥 {combo} Combo!</div>}
        <GlassCard className="w-full mb-8 flex flex-col items-center justify-center py-12 !bg-white/80 dark:!bg-gray-800/80">
          <h2 className="text-6xl font-medium text-gray-800 dark:text-white mb-2">{currentQ.answer.ja}</h2>
          <p className="text-gray-400 dark:text-gray-500">{currentQ.answer.ro}</p>
        </GlassCard>
        <div className="grid grid-cols-1 gap-3 w-full max-w-md">
          {currentQ.options.map((opt, i) => {
            let stateClass = "bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-700/80 border-transparent dark:text-gray-200";
            if (selectedOption) {
              if (opt.id === currentQ.answer.id) stateClass = "bg-green-100 dark:bg-green-900/50 border-green-400 text-green-700 dark:text-green-200 shadow-green-200 dark:shadow-none";
              else if (opt.id === selectedOption.id) stateClass = "bg-red-100 dark:bg-red-900/50 border-red-400 text-red-700 dark:text-red-200 shadow-red-200 dark:shadow-none animate-shake";
              else stateClass = "opacity-50 dark:opacity-30";
            }
            return (<div key={i} onClick={() => handleSelect(opt)} className={`p-4 rounded-2xl border-2 font-bold text-center transition-all duration-200 cursor-pointer shadow-sm ${stateClass}`}>{isZh ? opt.zh : opt.en}</div>)
          })}
        </div>
      </div>
    </div>
  )
};

const FlashcardView = ({ t, isZh, vocabList, userFavorites, toggleFavorite, onFinish, updateGoal }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const shuffledList = useMemo(() => shuffleArray(vocabList), [vocabList]);
  const currentCard = shuffledList[currentIndex];
  const isFav = userFavorites.includes(currentCard?.id);
  const handleNext = () => {
    setIsFlipped(false);
    updateGoal('words', 1);
    setTimeout(() => { if (currentIndex < shuffledList.length - 1) setCurrentIndex(p => p + 1); else onFinish(); }, 200);
  };
  if (!currentCard) return null;
  return (
    <div className="flex flex-col items-center h-[85vh] pb-20 animate-fade-in relative px-2">
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onFinish} className="p-2 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors"><ChevronRight size={24} className="rotate-180 text-gray-600 dark:text-gray-300" /></button>
        <div className="text-sm font-bold bg-white/30 dark:bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-gray-600 dark:text-gray-300 shadow-sm border border-white/20 dark:border-white/10">{currentIndex + 1} / {shuffledList.length}</div><div className="w-10"></div>
      </div>
      <div className="relative w-full max-w-sm flex-1 max-h-[500px] perspective-1000 group z-10">
        <div onClick={() => setIsFlipped(!isFlipped)} className={`w-full h-full relative preserve-3d transition-transform duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
          <GlassCard className="absolute inset-0 backface-hidden flex flex-col !rounded-[2.5rem] !bg-white/80 dark:!bg-gray-800/80" shine={true}>
            <div className="flex justify-between items-start mb-4" onClick={e => e.stopPropagation()}>
              <span className="px-3 py-1 bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider">JP</span>
              <div className="flex space-x-2"><button onClick={() => speak(currentCard.kana || currentCard.ja)} className="p-2.5 bg-white/50 dark:bg-gray-700/50 rounded-full text-blue-500 dark:text-blue-300 hover:scale-110 transition-transform shadow-sm"><Volume2 size={20} /></button><button onClick={() => toggleFavorite(currentCard.id)} className={`p-2.5 rounded-full transition-all hover:scale-110 shadow-sm ${isFav ? 'bg-pink-100 text-pink-500' : 'bg-white/50 dark:bg-gray-700/50 text-gray-400'}`}><Heart size={20} fill={isFav ? "currentColor" : "none"} /></button></div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center space-y-4"><h2 className="text-5xl sm:text-6xl font-medium text-gray-800 dark:text-white text-center break-keep leading-tight px-2">{currentCard.ja}</h2><p className="text-xl text-gray-400 dark:text-gray-500 font-medium tracking-wide">{currentCard.ro}</p></div>
            <div className="mt-4 text-blue-400 text-sm font-bold flex items-center justify-center animate-bounce-slow opacity-80"><RotateCcw size={14} className="mr-1.5" /> {t.flip}</div>
          </GlassCard>
          <GlassCard className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center !rounded-[2.5rem] !bg-gradient-to-br from-blue-50/90 to-purple-50/90 dark:from-blue-900/80 dark:to-purple-900/80 border border-purple-100 dark:border-purple-800"><span className="text-xs font-black text-purple-400 dark:text-purple-200 bg-white/60 dark:bg-black/20 px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest shadow-sm">{t.meaning}</span><h2 className="text-4xl font-bold text-gray-800 dark:text-white text-center px-4 leading-relaxed">{isZh ? currentCard.zh : currentCard.en}</h2></GlassCard>
        </div>
      </div>
      <button onClick={handleNext} className="mt-8 w-full max-w-xs bg-gray-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold text-lg shadow-xl shadow-gray-900/20 dark:shadow-white/10 active:scale-95 transition-all flex items-center justify-center backdrop-blur-sm group overflow-hidden relative">
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div><span className="relative flex items-center">{t.next} <ChevronRight size={20} className="ml-1" /></span>
      </button>
    </div>
  );
};


const MistakeView = ({ t, isZh, vocabList, userMistakes, removeMistake, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const mistakeList = useMemo(() => vocabList.filter(v => userMistakes.includes(v.id)), [vocabList, userMistakes]);
  const currentCard = mistakeList[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < mistakeList.length - 1) setCurrentIndex(p => p + 1);
      else onFinish();
    }, 200);
  };

  const handleMastered = () => {
    removeMistake(currentCard.id);
    if (mistakeList.length === 1) {
      onFinish();
    } else if (currentIndex >= mistakeList.length - 1) {
      setCurrentIndex(0);
    }
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
        <div className="text-sm font-bold bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full text-red-600 dark:text-red-300 shadow-sm">{mistakeList.length} {t.mistakeTitle}</div><div className="w-10"></div>
      </div>
      <div className="relative w-full max-w-sm flex-1 max-h-[500px] perspective-1000 group z-10">
        <div onClick={() => setIsFlipped(!isFlipped)} className={`w-full h-full relative preserve-3d transition-transform duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275) cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
          <GlassCard className="absolute inset-0 backface-hidden flex flex-col !rounded-[2.5rem] !bg-white/80 dark:!bg-gray-800/80 border-red-200 dark:border-red-900/50" shine={true}>
            <div className="flex justify-between items-start mb-4" onClick={e => e.stopPropagation()}>
              <span className="px-3 py-1 bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full text-xs font-bold uppercase tracking-wider">Mistake</span>
              <button onClick={() => speak(currentCard.kana || currentCard.ja)} className="p-2.5 bg-white/50 dark:bg-gray-700/50 rounded-full text-blue-500 dark:text-blue-300 hover:scale-110 transition-transform shadow-sm"><Volume2 size={20} /></button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center space-y-4"><h2 className="text-5xl sm:text-6xl font-medium text-gray-800 dark:text-white text-center break-keep leading-tight px-2">{currentCard.ja}</h2><p className="text-xl text-gray-400 dark:text-gray-500 font-medium tracking-wide">{currentCard.ro}</p></div>
            <div className="mt-4 text-blue-400 text-sm font-bold flex items-center justify-center animate-bounce-slow opacity-80"><RotateCcw size={14} className="mr-1.5" /> {t.flip}</div>
          </GlassCard>
          <GlassCard className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center !rounded-[2.5rem] !bg-gradient-to-br from-red-50/90 to-orange-50/90 dark:from-red-900/80 dark:to-orange-900/80 border border-red-100 dark:border-red-800"><span className="text-xs font-black text-red-400 dark:text-red-200 bg-white/60 dark:bg-black/20 px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest shadow-sm">{t.meaning}</span><h2 className="text-4xl font-bold text-gray-800 dark:text-white text-center px-4 leading-relaxed">{isZh ? currentCard.zh : currentCard.en}</h2></GlassCard>
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

const MatchingGame = ({ t, isZh, vocabList, addXp, onFinish, addLog, addMistake, updateGoal }) => {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [matched, setMatched] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  useEffect(() => {
    const gameVocab = shuffleArray(vocabList).slice(0, 6);
    const deck = gameVocab.flatMap(v => [
      { id: `${v.id}-ja`, vocabId: v.id, content: v.ja, kana: v.kana, type: 'ja' },
      { id: `${v.id}-mean`, vocabId: v.id, content: isZh ? v.zh : v.en, type: 'mean' }
    ]);
    setCards(shuffleArray(deck));
  }, [vocabList]);
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
          addXp(15);
          if (newMatched.length === cards.length / 2) {
            addLog('matching', 'Matching Practice', 100); // Log success
            updateGoal('matching');
            setTimeout(onFinish, 1000);
          }
        }, 400);
      } else {
        setTimeout(() => { setSelected([]); setIsChecking(false); }, 800);
        addMistake(newSelected[0].vocabId);
        addMistake(newSelected[1].vocabId);
      }
    }
  };
  return (
    <div className="h-full flex flex-col animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-6 px-2">
        <button onClick={onFinish} className="p-2 bg-white/40 dark:bg-gray-800/40 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors"><X size={24} className="text-gray-600 dark:text-gray-300" /></button>
        <h3 className="font-bold text-xl text-gray-700 dark:text-gray-200">{t.matchTitle}</h3><div className="w-10"></div>
      </div>
      <div className="grid grid-cols-3 gap-3 auto-rows-fr flex-1 max-w-md mx-auto w-full px-2">
        {cards.map(card => {
          const isSel = selected.find(s => s.id === card.id);
          const isMat = matched.includes(card.vocabId);
          return (<div key={card.id} onClick={() => handleCardClick(card)} className={`relative flex items-center justify-center p-2 text-center rounded-2xl transition-all duration-300 font-bold shadow-sm cursor-pointer border ${isMat ? 'opacity-0 scale-50' : 'opacity-100'} ${isSel ? 'bg-blue-100/90 dark:bg-blue-900/80 border-blue-400 text-blue-600 dark:text-blue-200 scale-105 shadow-md' : 'bg-white/60 dark:bg-gray-800/60 border-white/40 dark:border-white/10 hover:bg-white/80 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'} ${isSel && isChecking && selected.length === 2 && selected[0].vocabId !== selected[1].vocabId ? 'bg-red-100 dark:bg-red-900/50 border-red-400 animate-shake' : ''} backdrop-blur-md`}>{card.content}</div>)
        })}
      </div>
    </div>
  );
};

const Onboarding = ({ t, onComplete }) => {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('cat');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="absolute inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-3xl"></div>
      <div className="relative max-w-sm w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 border border-white/60 dark:border-white/10 text-center ring-1 ring-white/50 dark:ring-white/5">
        <div className="mb-6"><h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">{t.onboardingTitle}</h1><p className="text-gray-500 dark:text-gray-400 font-bold opacity-70">{t.onboardingDesc}</p></div>
        <div className="grid grid-cols-4 gap-3 mb-8">{AVATARS.map(avatar => (<button key={avatar.id} onClick={() => setSelectedAvatar(avatar.id)} className={`aspect-square rounded-2xl flex items-center justify-center text-3xl transition-all duration-300 ${selectedAvatar === avatar.id ? 'bg-white dark:bg-white/20 ring-4 ring-blue-200 dark:ring-blue-900 scale-110 shadow-xl z-10' : 'bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md scale-100 opacity-70 hover:opacity-100'}`}>{avatar.icon}</button>))}</div>
        <div className="bg-gray-50/50 dark:bg-gray-800 rounded-2xl p-2 mb-6 border border-gray-200 dark:border-gray-700 focus-within:border-blue-400 focus-within:bg-white dark:focus-within:bg-gray-900 focus-within:shadow-lg transition-all"><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} className="w-full bg-transparent text-center text-xl font-bold p-2 outline-none text-gray-800 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600" maxLength={10} /></div>
        <div className="flex flex-col gap-3"><button onClick={() => name.trim() && onComplete(name, selectedAvatar)} disabled={!name.trim()} className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] text-lg">{t.saveName}</button><button onClick={() => onComplete(t.defaultName, selectedAvatar)} className="text-gray-400 dark:text-gray-500 font-bold py-2 text-sm hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{t.skipName} <ArrowRight size={14} className="inline ml-1" /></button></div>
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('kana');
  const [lang, setLang] = useState('zh');
  const [targetLang, setTargetLang] = useState('ja');
  const [theme, setTheme] = useState('light');
  const [user, setUser] = useState(null);
  const [drawingChar, setDrawingChar] = useState(null);
  const [practiceMode, setPracticeMode] = useState(null);
  const [filterFavs, setFilterFavs] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [onlineMode, setOnlineMode] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [logs, setLogs] = useState([]);
  const [showResetModal, setShowResetModal] = useState(false);

  const t = TRANSLATIONS[lang];
  const isZh = lang === 'zh';

  const currentVocabList = useMemo(() => {
    const base = DATA[targetLang].BASE_VOCAB;
    const cloud = DATA[targetLang].CLOUD_VOCAB;
    return onlineMode ? [...base, ...cloud] : base;
  }, [onlineMode, targetLang]);

  useEffect(() => {
    const savedUser = localStorage.getItem('kawaii_user_v1');
    const savedLang = localStorage.getItem('kawaii_lang');
    const savedTheme = localStorage.getItem('kawaii_theme');
    const savedLogs = localStorage.getItem('kawaii_study_logs');

    if (savedLang) setLang(savedLang);

    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }

    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }

    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      const today = new Date().toDateString();
      if (parsed.lastLogin !== today) {
        const yest = new Date(); yest.setDate(yest.getDate() - 1);
        parsed.streak = parsed.lastLogin === yest.toDateString() ? parsed.streak + 1 : 1;
        parsed.lastLogin = today;
        // Reset Daily Goals
        parsed.dailyGoals = {
          date: today,
          goals: [
            { id: 'quiz', target: 1, current: 0, completed: false },
            { id: 'matching', target: 1, current: 0, completed: false },
            { id: 'words', target: 5, current: 0, completed: false }
          ]
        };
        saveUser(parsed);
      } else {
        // Ensure dailyGoals exists for existing users
        if (!parsed.dailyGoals || parsed.dailyGoals.date !== today) {
          parsed.dailyGoals = {
            date: today,
            goals: [
              { id: 'quiz', target: 1, current: 0, completed: false },
              { id: 'matching', target: 1, current: 0, completed: false },
              { id: 'words', target: 5, current: 0, completed: false }
            ]
          };
          saveUser(parsed);
        } else {
          setUser(parsed);
        }
      }
    } else {
      setUser('NEW');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('kawaii_theme', theme);
  }, [theme]);

  useFavicon(user && user.avatarId ? AVATARS.find(a => a.id === user.avatarId)?.icon || '🐱' : '🌸');

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2000);
  }

  const saveUser = (u) => { setUser(u); localStorage.setItem('kawaii_user_v1', JSON.stringify(u)); };
  const handleUserInit = (name, avatarId) => saveUser({
    name, avatarId, xp: 0, streak: 1, lastLogin: new Date().toDateString(), favorites: [], mistakes: [],
    dailyGoals: {
      date: new Date().toDateString(),
      goals: [
        { id: 'quiz', target: 1, current: 0, completed: false },
        { id: 'matching', target: 1, current: 0, completed: false },
        { id: 'words', target: 5, current: 0, completed: false }
      ]
    }
  });
  const addXp = (amount) => saveUser({ ...user, xp: user.xp + amount });
  const toggleFav = (id) => {
    const favs = user.favorites || [];
    saveUser({ ...user, favorites: favs.includes(id) ? favs.filter(x => x !== id) : [...favs, id] });
  };
  const addMistake = (id) => {
    const mistakes = user.mistakes || [];
    if (!mistakes.includes(id)) {
      saveUser({ ...user, mistakes: [...mistakes, id] });
    }
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
    const newGoals = user.dailyGoals.goals.map(g => {
      if (g.id === goalId) return { ...g, claimed: true };
      return g;
    });
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
        setIsLoadingData(false);
        setOnlineMode(true);
        showToast(`${t.toastData} ${t.modeOnline}`);
      }, 1500);
    } else {
      setOnlineMode(false);
      showToast(`${t.toastData} ${t.modeOffline}`);
    }
  }

  const addLog = (type, content, score = null) => {
    const newLog = { type, content, score, date: new Date().toISOString() };
    const updatedLogs = [newLog, ...logs].slice(0, 50); // Limit to last 50 logs
    setLogs(updatedLogs);
    localStorage.setItem('kawaii_study_logs', JSON.stringify(updatedLogs));
  }

  if (!user) return null;

  return (
    <div className="min-h-screen relative font-sans text-gray-900 dark:text-gray-100 bg-[#eff4ff] dark:bg-[#0f172a] overflow-hidden transition-colors duration-500 selection:bg-blue-200 selection:text-blue-900">
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/50 dark:border-white/10 text-gray-800 dark:text-white px-6 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] font-bold text-sm flex items-center"><Sparkles size={16} className="mr-2 text-yellow-400" /> {toast.msg}</div>
      </div>
      {isLoadingData && (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl flex flex-col items-center"><CloudLightning size={48} className="text-blue-500 animate-bounce mb-4" /><p className="font-bold text-gray-700 dark:text-white">{t.loading}</p></div>
        </div>
      )}
      {user === 'NEW' && <Onboarding t={t} onComplete={handleUserInit} />}
      {drawingChar && <KanaCanvasModal char={drawingChar} onClose={() => setDrawingChar(null)} t={t} addLog={addLog} />}
      {showResetModal && (
        <ConfirmModal
          title={t.resetData}
          description={t.resetConfirm}
          confirmLabel={t.resetData}
          cancelLabel={t.cancel}
          onCancel={() => setShowResetModal(false)}
          onConfirm={() => {
            resetData();
            setShowResetModal(false);
          }}
        />
      )}
      <div className="fixed inset-0 -z-10 transition-opacity duration-700">
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,_#dbeafe_0%,_transparent_50%),radial-gradient(circle_at_90%_60%,_#fce7f3_0%,_transparent_40%),radial-gradient(circle_at_10%_60%,_#ede9fe_0%,_transparent_40%)] opacity-80 animate-pulse-slow ${theme === 'dark' ? 'opacity-0' : 'opacity-80'}`}></div>
        <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e293b_0%,_#0f172a_100%)] ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#3b82f6_0%,_transparent_40%),radial-gradient(circle_at_80%_50%,_#6366f1_0%,_transparent_40%)] mix-blend-screen opacity-20 ${theme === 'dark' ? 'opacity-30' : 'opacity-0'}`}></div>
      </div>
      <div className="fixed inset-0 -z-10 opacity-[0.04] dark:opacity-[0.07] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      <main className={`w-full max-w-md md:max-w-4xl mx-auto h-[100dvh] overflow-y-auto no-scrollbar ${practiceMode ? 'p-4' : 'px-4 pt-10 pb-24'}`}>
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
                  <div onClick={() => { setPracticeMode('quiz'); }} className="col-span-2 md:col-span-1 bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-[2rem] shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.01] transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-center md:justify-between h-auto md:h-56">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center justify-between md:flex-col md:items-start relative z-10 h-full">
                      <div className="flex items-center md:flex-col md:items-start space-x-4 md:space-x-0 md:space-y-4"><div className="p-3 bg-white/20 rounded-full text-white backdrop-blur-sm"><CheckCircle fill="currentColor" size={28} /></div><div className="text-white"><h3 className="font-black text-2xl">{t.modeQuiz}</h3><p className="text-indigo-100 text-sm font-medium">{t.modeQuizDesc}</p></div></div>
                      <ChevronRight className="text-white/70 md:self-end" size={28} />
                    </div>
                  </div>
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
                {(user.favorites?.length > 0) && (<div onClick={() => { setPracticeMode('flashcards'); setFilterFavs(true); }} className="bg-pink-50/60 dark:bg-pink-900/20 backdrop-blur-xl p-6 rounded-[2rem] border border-pink-100 dark:border-pink-800 cursor-pointer flex items-center justify-between hover:bg-pink-100/80 dark:hover:bg-pink-900/30 transition-colors mt-4"><div className="flex items-center space-x-4"><div className="p-3 bg-pink-200 dark:bg-pink-800 text-pink-600 dark:text-pink-200 rounded-full"><Heart fill="currentColor" size={24} /></div><div><h3 className="font-bold text-pink-900 dark:text-pink-100 text-lg">{t.onlyFavorites}</h3><p className="text-xs text-pink-600 dark:text-pink-300 font-bold">{user.favorites.length} words</p></div></div><ChevronRight className="text-pink-300" /></div>)}
              </div>
            )}
            {activeTab === 'profile' && <ProfileView t={t} isZh={isZh} toggleLang={() => { setLang(l => l === 'zh' ? 'en' : 'zh'); localStorage.setItem('kawaii_lang', l === 'zh' ? 'en' : 'zh') }} user={user} updateUser={saveUser} theme={theme} toggleTheme={toggleTheme} onlineMode={onlineMode} toggleOnlineMode={toggleOnlineMode} logs={logs} targetLang={targetLang} setTargetLang={setTargetLang} claimGoal={claimGoalReward} onResetRequest={() => setShowResetModal(true)} />}
          </div>
        )}
        {practiceMode && (
          <div className="h-full">
            {practiceMode === 'mistake' && <MistakeView t={t} isZh={isZh} vocabList={currentVocabList} userMistakes={user.mistakes || []} removeMistake={removeMistake} onFinish={() => setPracticeMode(null)} />}
            {practiceMode === 'flashcards' && <FlashcardView t={t} isZh={isZh} vocabList={filterFavs ? currentVocabList.filter(v => user.favorites.includes(v.id)) : currentVocabList} userFavorites={user.favorites || []} toggleFavorite={toggleFav} onFinish={() => { setPracticeMode(null); addXp(10); }} updateGoal={updateGoal} />}
            {practiceMode === 'matching' && <MatchingGame t={t} isZh={isZh} vocabList={currentVocabList} addXp={addXp} onFinish={() => { setPracticeMode(null); addXp(20); }} addLog={addLog} addMistake={addMistake} updateGoal={updateGoal} />}
            {practiceMode === 'quiz' && <QuizView t={t} isZh={isZh} vocabList={currentVocabList} addXp={addXp} onFinish={() => { setPracticeMode(null); }} addLog={addLog} praisePhrases={DATA[targetLang].PRAISE_PHRASES} addMistake={addMistake} updateGoal={updateGoal} />}
          </div>
        )}
      </main>
      {!practiceMode && user !== 'NEW' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-[320px] md:max-w-lg animate-slide-up">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-black/50 rounded-[2.5rem] p-2 flex items-center justify-between px-4 md:px-8 ring-1 ring-white/50 dark:ring-white/5">
            <NavItem icon={Grid} label={t[DATA[targetLang].LABELS.tab1Key]} active={activeTab === 'kana'} onClick={() => setActiveTab('kana')} />
            <NavItem icon={Gamepad2} label={t.tabPractice} active={activeTab === 'practice'} onClick={() => setActiveTab('practice')} />
            <NavItem icon={User} label={t.tabProfile} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </div>
        </div>
      )}
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
      `}</style>
    </div >
  );
}