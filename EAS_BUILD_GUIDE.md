# EAS Build Setup Guide

## The Build Failed - Here's How to Fix It

The build failed likely due to missing environment variables or Gradle configuration issues.

## Step 1: Set Environment Variables in EAS

You need to add your environment variables to EAS so they're available during the build:

```bash
# Set Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://mkzkeusvorpichhrhejy.supabase.co" --type string

# Set Supabase Anon Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_ANON_KEY_HERE" --type string

# Set Google Web Client ID
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "831631933144-gqle49nfage3gdsn415tasqkquq5amfa.apps.googleusercontent.com" --type string

# Set Google Android Client ID
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "831631933144-badi6u4e3q9ivuecoro4igft3qi203de.apps.googleusercontent.com" --type string

# Set Google iOS Client ID
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "831631933144-rts5sthfdgqv85f7ft9jceng7cr6plnq.apps.googleusercontent.com" --type string
```

**Important:** Replace `YOUR_ANON_KEY_HERE` with your actual Supabase anon key from `.env.local`

## Step 2: Alternative - Use .env File in EAS

Or you can set them in the EAS dashboard:
1. Go to https://expo.dev/accounts/hakimtabakh/projects/kin/secrets
2. Click "Create Secret"
3. Add each environment variable

## Step 3: Rebuild

After setting the environment variables, rebuild:

```bash
eas build --profile development --platform android
```

## Common Build Issues & Solutions

### Issue 1: Gradle Build Failed
**Solution:** The eas.json has been updated to use APK build type which is faster and more reliable for development builds.

### Issue 2: New Architecture Issues
If you continue to have issues, you can temporarily disable the new architecture:

In `android/gradle.properties`, change:
```properties
newArchEnabled=false
```

Then rebuild.

### Issue 3: Memory Issues
If the build fails with out of memory errors, the gradle.properties already has increased memory:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

## Step 4: Install the APK

Once the build succeeds:
1. Download the APK from the EAS build page
2. Transfer it to your Android device
3. Install it (you may need to enable "Install from Unknown Sources")
4. Open the app and test Google Sign-In!

## Alternative: Local Development Build

If EAS builds continue to fail, you can build locally:

```bash
# Make sure you have Android Studio and SDK installed
npx expo run:android --variant debug
```

This will build and install directly on your connected device or emulator.

## Checking Build Logs

If the build fails again, check the logs at:
https://expo.dev/accounts/hakimtabakh/projects/kin/builds

Look specifically at the "Run gradlew" phase for detailed error messages.
