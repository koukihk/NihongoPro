import React from 'react';
import { AVATARS } from '../../utils/constants';

/**
 * Avatar - 用户头像组件
 * A user avatar component that displays emoji-based avatars
 */
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

export default Avatar;
