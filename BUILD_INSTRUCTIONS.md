# 📱 APK Build Instructions for Sevak App

## ✅ Configuration Complete!
- ✅ Android package name: `com.swaminarayan.sevakapp`
- ✅ EAS Build configuration: `eas.json`
- ✅ Android permissions configured
- ✅ Build scripts added to package.json

---

## 🚀 **OPTION 1: EAS Build (Cloud - Recommended)**

### Step 1: Login to Expo
```bash
cd /Users/sun/Documents/CodeBase/SwamiNarayan/SevakApp
npx eas login
```
(If you don't have an account, create one at https://expo.dev)

### Step 2: Build APK
```bash
# For testing/preview APK (recommended first)
npm run build:android

# OR for production APK
npm run build:android:prod
```

### Step 3: Download APK
- After build completes, EAS will provide a download link
- APK will be available in your Expo dashboard
- Download and install on Android device

**Build Time:** ~15-20 minutes
**Cost:** Free for limited builds, then pay-as-you-go

---

## 🛠️ **OPTION 2: Local Build (Requires Android Studio)**

### Prerequisites:
1. Install Android Studio
2. Install Android SDK (API 33+)
3. Set up environment variables:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

### Step 1: Generate Native Android Code
```bash
cd /Users/sun/Documents/CodeBase/SwamiNarayan/SevakApp
npm run prebuild
```

### Step 2: Build APK Locally
```bash
cd android
./gradlew assembleRelease
```

### Step 3: Find APK
The APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

**Build Time:** ~10-15 minutes (first time)
**Requires:** Android Studio, Android SDK

---

## 📦 **OPTION 3: Using npx eas-cli (If global install has issues)**

Since you have Node 16.20.2 (EAS requires Node 18+), you can use npx:

```bash
cd /Users/sun/Documents/CodeBase/SwamiNarayan/SevakApp
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

---

## 🎯 **Quick Start (Recommended)**

1. **Login to Expo:**
   ```bash
   cd /Users/sun/Documents/CodeBase/SwamiNarayan/SevakApp
   npx eas login
   ```

2. **Build APK:**
   ```bash
   npm run build:android
   ```

3. **Wait for build** (~15-20 minutes)

4. **Download APK** from Expo dashboard

---

## 📝 **Notes:**

- **Package Name:** `com.swaminarayan.sevakapp`
- **Version:** 1.0.0 (versionCode: 1)
- **Build Type:** APK (not AAB)
- **Permissions:** Location, Camera, Storage, Notifications

---

## 🔧 **Troubleshooting:**

### If EAS build fails:
- Check Node version (upgrade to Node 18+ if possible)
- Use `npx eas-cli` instead of global install
- Check internet connection (cloud build requires internet)

### If local build fails:
- Ensure Android Studio is installed
- Check ANDROID_HOME environment variable
- Run `./gradlew clean` before building

---

## ✅ **Next Steps After Building:**

1. Test APK on Android device
2. Distribute via:
   - Direct download
   - Google Play Store (need AAB format)
   - Internal distribution
   - APK file sharing

---

**Happy Building! 🎉**






