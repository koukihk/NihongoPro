/**
 * DailyGoalsCard Component - 每日目标卡片组件
 * Displays daily learning goals with progress tracking
 */

import React from 'react';
import { Target } from 'lucide-react';
import { GlassCard } from '../ui';

const DailyGoalsCard = ({ t, goals, onClaim }) => {
  if (!goals) return null;
  
  return (
    <GlassCard className="w-full mb-6 !p-5 !bg-white/60 dark:!bg-gray-800/60 border-2 border-white/50 dark:border-white/5">
      <h3 className="text-lg font-black text-gray-800 dark:text-white mb-4 flex items-center">
        <Target size={20} className="mr-2 text-red-500" /> {t.dailyGoalsTitle}
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {goals.map(g => (
          <div key={g.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white/40 dark:bg-black/20 p-2.5 sm:p-3 rounded-xl">
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
                <span className="truncate pr-2">{t[`goal${g.id.charAt(0).toUpperCase() + g.id.slice(1)}`]}</span>
                <span className="shrink-0">{g.current}/{g.target}</span>
              </div>
              <div className="h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(g.current / g.target) * 100}%` }}></div>
              </div>
            </div>
            <button
              onClick={() => onClaim(g.id)}
              disabled={!g.completed || g.claimed}
              className={`shrink-0 w-full sm:w-auto sm:min-w-[60px] px-4 py-1.5 sm:py-1.5 rounded-xl text-xs font-bold transition-all border backdrop-blur-sm ${g.claimed
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

export default DailyGoalsCard;
