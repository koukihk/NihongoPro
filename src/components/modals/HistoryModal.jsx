import { useState, useMemo } from 'react';
import { History, X, CloudLightning, Clock, Trophy, Gamepad2, Edit3, PenTool } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

/**
 * HistoryModal - 学习历史记录弹窗
 * Displays learning history with filtering by activity type
 */
const HistoryModal = ({ logs, onClose, t }) => {
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    if (typeFilter === 'all') return logs;
    return logs.filter(log => log.type === typeFilter);
  }, [logs, typeFilter]);

  const groupedLogs = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = { today: [], week: [], older: [] };
    filteredLogs.forEach(log => {
      const logDate = new Date(log.date);
      const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
      if (logDay >= today) groups.today.push(log);
      else if (logDay >= weekAgo) groups.week.push(log);
      else groups.older.push(log);
    });
    return groups;
  }, [filteredLogs]);

  const typeButtons = [
    { key: 'all', label: t.historyFilterAll },
    { key: 'quiz', label: t.historyFilterQuiz },
    { key: 'matching', label: t.historyFilterMatching },
    { key: 'fillblank', label: t.historyFilterFillBlank },
    { key: 'writing', label: t.historyFilterWriting }
  ];

  const renderGroup = (title, groupLogs) => {
    if (groupLogs.length === 0) return null;
    return (
      <div key={title} className="mb-4">
        <h4 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-1">{title} ({groupLogs.length})</h4>
        <div className="space-y-2">
          {groupLogs.map((log, idx) => (
            <div key={idx} className="flex items-center p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/40 dark:border-white/5">
              <div className={`p-3 rounded-xl mr-3 ${log.type === 'quiz' ? 'bg-purple-100 text-purple-600' : log.type === 'matching' ? 'bg-green-100 text-green-600' : log.type === 'fillblank' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                {log.type === 'quiz' ? <Trophy size={18} /> : log.type === 'matching' ? <Gamepad2 size={18} /> : log.type === 'fillblank' ? <PenTool size={18} /> : <Edit3 size={18} />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                  {log.type === 'quiz' ? t.logQuiz : log.type === 'matching' ? t.logMatching : log.type === 'fillblank' ? t.logFillBlank : t.logWriting}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(log.type === 'quiz' || log.type === 'fillblank') ? `${t.quizScore}: ${log.score}` : log.content}
                </p>
              </div>
              <div className="text-[10px] text-gray-400 font-bold flex flex-col items-end">
                <Clock size={12} className="mb-1" />
                <span>{formatDate(log.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-fade-in transition-opacity" onClick={onClose}></div>
      <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-[2.5rem] p-6 relative z-10 shadow-2xl animate-scale-up border border-white/30 dark:border-white/10 ring-1 ring-white/20 dark:ring-white/5 max-h-[75vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-black text-gray-800 dark:text-white flex items-center">
            <History size={24} className="mr-2 text-blue-500" /> {t.historyTitle}
          </h3>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1 shrink-0">
          {typeButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setTypeFilter(btn.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${typeFilter === btn.key
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                : 'bg-white/60 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/20'
                }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
              <CloudLightning size={48} className="mx-auto mb-2 opacity-20" />
              <p>{t.historyEmpty}</p>
            </div>
          ) : (
            <>
              {renderGroup(t.historyGroupToday, groupedLogs.today)}
              {renderGroup(t.historyGroupWeek, groupedLogs.week)}
              {renderGroup(t.historyGroupOlder, groupedLogs.older)}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
