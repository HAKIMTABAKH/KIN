@echo off
echo ========================================
echo   KIN App - Android Development Build
echo ========================================
echo.
echo Choose your build method:
echo.
echo 1. Quick Test (Expo Go - Fastest)
echo 2. Development Build (EAS - Full Features)
echo 3. Local Build (Android Studio Required)
echo 4. Production APK (Standalone)
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto quick
if "%choice%"=="2" goto eas_dev
if "%choice%"=="3" goto local
if "%choice%"=="4" goto production

:quick
echo.
echo Starting Expo Dev Server...
echo.
echo Instructions:
echo 1. Install "Expo Go" from Google Play Store
echo 2. Open Expo Go and scan the QR code
echo 3. Your app will load on your phone!
echo.
npx expo start
goto end

:eas_dev
echo.
echo Building Development APK with EAS...
echo This will take 10-20 minutes.
echo.
echo Make sure you're logged in to Expo:
eas login
echo.
echo Starting build...
eas build --profile development --platform android
echo.
echo Build complete! Download the APK and install on your phone.
echo Then run: npx expo start --dev-client
goto end

:local
echo.
echo Building locally with Android Studio...
echo Make sure Android Studio is installed and phone is connected.
echo.
npx expo run:android
goto end

:production
echo.
echo Building Production APK...
echo This will take 15-25 minutes.
echo.
eas build --profile production --platform android
echo.
echo Build complete! Download and install the APK.
goto end

:end
echo.
pause
