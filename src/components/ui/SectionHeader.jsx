import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * SectionHeader - 页面标题组件
 * A section header component with title, subtitle, and easter egg animation
 */
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
  );
};

export default SectionHeader;
