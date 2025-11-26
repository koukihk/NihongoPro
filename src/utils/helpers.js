/**
 * Utility Functions - 工具函数
 * Extracted from App.jsx for better code organization
 */

import { useEffect } from 'react';
import { LEVELS } from './constants';
import { ttsService } from '../services/tts';

/**
 * Custom hook to set favicon with an emoji
 * @param {string} emoji - The emoji to use as favicon
 */
export const useFavicon = (emoji) => {
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

/**
 * Text-to-speech function
 * Uses TTSService for AI TTS when enabled, falls back to native browser TTS
 * 
 * @param {string} text - The text to speak
 * @param {string|null} langOverride - Optional language override ('ja' or 'ko')
 * 
 */
export const speak = (text, langOverride = null) => {
  const targetLangCode = langOverride || (window.__appTargetLang || 'ja');
  const lang = targetLangCode === 'ko' ? 'ko' : 'ja';
  
  // Use TTSService which handles AI TTS and native fallback
  ttsService.speak(text, lang).catch((error) => {
    // Silent catch - TTSService already handles fallback to native TTS
    console.warn('TTS speak error:', error);
  });
};


/**
 * Get level information based on XP
 * @param {number} xp - The experience points
 * @returns {{level: number, progress: number, nextXp: number}} Level info object
 */
export const getLevelInfo = (xp) => {
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

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} A new shuffled array
 */
export const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

/**
 * Format a date string to a readable format
 * @param {string} dateStr - The date string to format
 * @returns {string} Formatted date string (M/D H:MM)
 */
export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
};
