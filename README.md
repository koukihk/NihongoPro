# 🌸 Nihongo Pro - Kawaii Language Learning App

![React](https://img.shields.io/badge/React-18-blue?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square)
![Capacitor](https://img.shields.io/badge/Capacitor-Mobile-1192f5?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> **Experience the App Live:** [**nihongo-pro.vercel.app**](https://nihongo-pro.vercel.app)

A beautiful, gamified language learning application designed for Japanese and Korean beginners. Built with modern web technologies, it features a glassmorphism UI, AI-powered learning assistance, and offline capabilities.

## ✨ Features

### 📚 Core Learning
- **Kana/Hangul Chart**: Interactive character charts with native pronunciation audio.
- **Flashcards**: Spaced repetition system with favorites and mistake tracking.
- **Daily Quiz**: 4-choice quizzes to test and reinforce your vocabulary.
- **Matching Game**: Fun, interactive game to match words with their meanings.
- **Mistake Notebook**: Automatically tracks incorrect answers for focused review.

### 🤖 AI Assistant
Supercharge your learning with optional AI features (powered by Gemini/OpenAI):
- **Smart Quiz**: Dynamically generated questions based on your learning history.
- **Contextual Explanations**: Deep dive into word nuances and usage examples.
- **Memory Mnemonics**: AI-generated tips to help you remember difficult words.
- **Daily Quotes**: Inspirational sentences in your target language.

### 🎮 Gamification & UX
- **Progression System**: Earn XP, level up, and maintain daily streaks.
- **Premium UI**: Modern glassmorphism design with dark/light mode support.
- **Offline First**: All progress is saved locally; learn anywhere, anytime.
- **Multi-language**: Supports English and Chinese interfaces.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/koukihk/nihongo-pro.git
cd nihongo-pro

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## 📱 Mobile App (Android)

This project uses [Capacitor](https://capacitorjs.com/) to package the web app as a native Android application.

### Prerequisites
- **Android Studio**: Required to build and run the Android app.
- **Java Development Kit (JDK) 17**: Required for Android builds.

### Building the APK

1.  **Build the web assets:**
    ```bash
    npm run build
    ```

2.  **Sync with Android project:**
    This copies your built web assets to the native Android project.
    ```bash
    npx cap sync android
    ```

3.  **Open in Android Studio:**
    ```bash
    npx cap open android
    ```

4.  **Build APK in Android Studio:**
    - Wait for Gradle sync to complete.
    - Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
    - Once finished, the APK will be available in `android/app/build/outputs/apk/debug/`.

## 🔧 AI Configuration

### 🤖 AI Assistant (Text Generation)
To enable smart quizzes and explanations:
1.  Navigate to **Me** → **AI Assistant**.
2.  Select your provider (**Google Gemini** or **OpenAI**).
3.  Enter your API Key.

### 🗣️ AI Text-to-Speech (TTS)
To enable high-quality AI voices:
1.  Navigate to **Me** → **Voice** (Speaker icon).
2.  Enter your **Minimax API Key**.
3.  Select your preferred voice model and timbre.

> 💡 **Privacy Note:** All API keys are stored securely in your browser's local storage and are never sent to us.

## 📄 License

MIT License © 2025 [koukihk](https://github.com/koukihk)
