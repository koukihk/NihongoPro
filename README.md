# 🌸 Kawaii Language Learning App

A beautiful, gamified language learning app for Japanese and Korean beginners. Built with React and featuring AI-powered learning assistance.

![React](https://img.shields.io/badge/React-18-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 📚 Core Learning
- **Kana/Hangul Chart** - Interactive character charts with pronunciation
- **Flashcards** - Flip cards to memorize vocabulary with favorites support
- **Daily Quiz** - 4-choice quiz to test your knowledge
- **Matching Game** - Match words with their meanings
- **Mistake Notebook** - Review and master your weak points

### 🤖 AI Assistant (Optional)
Enable AI features for enhanced learning:
- **AI Smart Quiz** - Dynamically generated vocabulary questions
- **AI Fill-in-the-Blank** - Complete sentences with the right word
- **AI Memory Tips** - Fun mnemonics to help remember words
- **AI Word Explanation** - Detailed explanations with examples
- **AI Daily Quote** - Fresh inspirational sentences every day
- **AI Matching Game** - AI-generated vocabulary pairs

Supports **Google Gemini** and **OpenAI-compatible** APIs.

### 🎮 Gamification
- XP and leveling system
- Daily streak tracking
- Daily goals with rewards
- Study history and statistics

### 🎨 User Experience
- Beautiful glassmorphism UI design
- Dark/Light theme support
- Chinese/English interface
- Japanese/Korean target language
- Offline-first with local storage
- Mobile-friendly responsive design

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/koukihk/kawaii-learning.git
cd kawaii-learning

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## 🔧 AI Configuration

To enable AI features:

1. Go to **Profile** → **AI Assistant**
2. Choose your provider (Gemini or OpenAI)
3. Enter your API key
4. (Optional) Customize model name and endpoint
5. Save and enable

**Supported Providers:**
- Google Gemini (default: `gemini-2.0-flash`)
- OpenAI and compatible APIs (default: `gpt-4o-mini`)

> 💡 Your API key is stored locally and never sent to our servers.

## 🔒 Privacy

- All learning data is stored locally in your browser
- No analytics or tracking
- AI queries are sent directly to your configured provider
- See the in-app Privacy Policy for details

## 📱 Screenshots

| Home | Practice | Profile |
|------|----------|---------|
| Kana chart with writing practice | Multiple game modes | Stats and settings |

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Web Speech API** - Text-to-speech
- **LocalStorage** - Data persistence

## 📄 License

MIT License - feel free to use and modify!

## 👨‍💻 Developer

Made with ❤️ by [koukihk](https://github.com/koukihk)

---

**Start your language learning journey today! 🚀**
