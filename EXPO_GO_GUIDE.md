# Testing with Expo Go

## The Issue
Google Sign-In requires native modules that aren't available in Expo Go. This is expected behavior.

## Solutions

### Option 1: Use Email Sign-In (Recommended for Testing)
The app now automatically hides the Google Sign-In button when running in Expo Go. You can test all features using email authentication:

1. Open the app in Expo Go
2. Click "Continue with Email" on the welcome screen
3. Sign up with any email/password
4. Check your email for confirmation (if required)
5. Sign in and test the app

### Option 2: Build a Development Build (For Full Features)
To test Google Sign-In on your phone, you need to create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --profile development --platform android

# Build for iOS (requires Apple Developer account)
eas build --profile development --platform ios
```

After the build completes:
1. Download and install the APK (Android) or IPA (iOS)
2. The app will now have full Google Sign-In support

### Option 3: Test on Web
Google Sign-In works perfectly on web without any special setup:

```bash
npm start
# Press 'w' to open in web browser
```

## What Works in Expo Go
✅ Email/Password sign-in
✅ Email/Password sign-up
✅ All app features (Feed, Chat, Profile)
✅ Sign out
✅ Session persistence

## What Requires Development Build
❌ Google Sign-In (native)
❌ Other OAuth providers (native)

## Current Behavior
- **Web**: Google Sign-In button shows and works
- **Expo Go**: Google Sign-In button is hidden, shows helpful message
- **Development Build**: Google Sign-In button shows and works

## Quick Test Account
For quick testing, create a test account:
- Email: test@example.com
- Password: Test123456!

(Make sure to use a real email if you need email confirmation)
