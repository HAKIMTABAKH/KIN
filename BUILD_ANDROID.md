# Build and Test on Android Device

## Prerequisites

1. **Install Android Studio** (if not already installed)
   - Download from: https://developer.android.com/studio
   - Install Android SDK and platform tools

2. **Enable Developer Mode on Your Phone**
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings > Developer Options
   - Enable "USB Debugging"

3. **Connect Your Phone**
   - Connect via USB cable
   - Allow USB debugging when prompted on phone

## Method 1: Development Build (Fastest - Recommended)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Metro Bundler
```bash
npx expo start
```

### Step 3: Connect Your Phone
- Make sure your phone is connected via USB
- In the Expo Dev Tools (terminal), press `a` to open on Android
- OR scan the QR code with Expo Go app

### Step 4: Install Expo Go (if needed)
- Download "Expo Go" from Google Play Store
- Open the app and scan the QR code from terminal

**Pros:**
- ✅ Instant hot reload
- ✅ Fast iteration
- ✅ No build time

**Cons:**
- ⚠️ Requires Expo Go app
- ⚠️ Some native features might not work

---

## Method 2: Development Build with EAS (Full Native Features)

This creates a development APK with all native features:

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure EAS Build
```bash
eas build:configure
```

### Step 4: Build Development APK
```bash
eas build --profile development --platform android
```

### Step 5: Download and Install
- Wait for build to complete (10-20 minutes)
- Download the APK from the link provided
- Transfer to your phone and install
- OR scan QR code to download directly on phone

### Step 6: Start Development Server
```bash
npx expo start --dev-client
```

**Pros:**
- ✅ All native features work
- ✅ Hot reload still works
- ✅ Real production-like experience

**Cons:**
- ⏱️ Initial build takes 10-20 minutes
- 💰 Requires Expo account (free tier available)

---

## Method 3: Production APK (For Real Testing)

This creates a standalone APK you can share:

### Step 1: Build Production APK
```bash
eas build --profile production --platform android
```

### Step 2: Download APK
- Wait for build to complete (15-25 minutes)
- Download from the provided link
- Install on your phone

**Pros:**
- ✅ Standalone app (no Expo Go needed)
- ✅ Production-ready
- ✅ Can share with others

**Cons:**
- ⏱️ Long build time
- ❌ No hot reload
- 🔄 Need to rebuild for every change

---

## Method 4: Local Android Build (No EAS Required)

If you have Android Studio set up:

### Step 1: Prebuild Native Code
```bash
npx expo prebuild --platform android
```

### Step 2: Build and Run
```bash
npx expo run:android
```

This will:
- Build the APK locally
- Install on connected device
- Start the app

**Pros:**
- ✅ No EAS account needed
- ✅ Full control over build
- ✅ Faster than EAS for subsequent builds

**Cons:**
- ⚙️ Requires Android Studio setup
- 💾 Large Android folder in project

---

## Quick Start (Recommended Path)

### For Quick Testing:
```bash
# 1. Start the dev server
npx expo start

# 2. Press 'a' for Android or scan QR with Expo Go
```

### For Full Feature Testing:
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Build development APK
eas build --profile development --platform android

# 4. Install APK on phone and start dev server
npx expo start --dev-client
```

---

## Troubleshooting

### Phone Not Detected
```bash
# Check if device is connected
adb devices

# If not listed, check USB debugging is enabled
```

### Build Fails
```bash
# Clear cache and retry
npx expo start --clear

# Or for EAS
eas build --profile development --platform android --clear-cache
```

### App Crashes on Phone
- Check logs: `npx expo start` shows console logs
- Or use: `adb logcat | grep ReactNative`

---

## Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Next Steps After Installation

1. **Test Core Features:**
   - Sign up / Sign in
   - Add friends
   - Send messages
   - Send media (photos/videos)
   - Test caching (navigate between screens)

2. **Test Performance:**
   - Scroll through messages
   - Switch between tabs
   - Open media viewer

3. **Test Offline:**
   - Turn off WiFi/data
   - Check if cached data loads
   - Turn back on and sync

---

## Recommended: Start with Method 1

For your first test, I recommend:

```bash
# 1. Install dependencies
npm install

# 2. Start Expo
npx expo start

# 3. Install Expo Go on your phone from Play Store

# 4. Scan the QR code with Expo Go

# 5. Test the app!
```

This is the fastest way to see your app running on your phone!
