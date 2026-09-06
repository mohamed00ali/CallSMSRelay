#!/bin/bash

# Notify App - Build APK Script
# This script helps convert the web app to APK using Capacitor

echo "🚀 Notify App - APK Builder"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed. Download from nodejs.org"
    exit 1
fi

echo "✅ Node.js found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Add Capacitor
echo "🔧 Setting up Capacitor..."
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# Initialize Capacitor
echo "⚙️ Initializing Capacitor..."
npx cap init notify com.notify.app

# Build web
echo "🏗️ Building web app..."
npm run build || true

# Copy to Capacitor
echo "📋 Copying web to Capacitor..."
npx cap copy

# Add Android
echo "📱 Adding Android platform..."
npx cap add android

# Open Android Studio
echo "🎯 Opening Android Studio..."
npx cap open android

echo ""
echo "✅ Done! Android Studio will open now."
echo "📌 Next steps in Android Studio:"
echo "   1. Wait for Gradle sync to finish"
echo "   2. Click 'Build' → 'Build Bundle(s) / APK(s)' → 'Build APK(s)'"
echo "   3. Find APK in: app/release/app-release.apk"
echo ""
