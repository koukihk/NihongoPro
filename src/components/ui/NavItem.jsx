import React from 'react';

/**
 * NavItem - 底部导航项组件
 * A navigation item component for the bottom navigation bar
 */
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

export default NavItem;
