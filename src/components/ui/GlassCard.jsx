// GlassCard Component

/**
 * GlassCard - 玻璃态卡片容器组件
 * A glassmorphism-style card component with optional active state and shine effect
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


    <div className="relative z-10 w-full h-full">{children}</div>
  </div>
);

export default GlassCard;
