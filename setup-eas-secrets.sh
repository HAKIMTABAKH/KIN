#!/bin/bash

# Setup EAS Environment Variables for KIN App
# Run this script to add all environment variables to EAS

echo "Setting up EAS environment variables for KIN app..."
echo ""

# Supabase Configuration
echo "[1/5] Setting EXPO_PUBLIC_SUPABASE_URL..."
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://mkzkeusvorpichhrhejy.supabase.co" --environment development

echo "[2/5] Setting EXPO_PUBLIC_SUPABASE_ANON_KEY..."
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1remtldXN2b3JwaWNoaHJoZWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTg4NjcsImV4cCI6MjA4MDQ5NDg2N30.0eKjCEhSL-GPpoL1JmWn0mFbF3wg7sOq91ufF81gZWQ" --environment development

# Google Sign-In Configuration
echo "[3/5] Setting EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID..."
eas env:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "831631933144-gqle49nfage3gdsn415tasqkquq5amfa.apps.googleusercontent.com" --environment development

echo "[4/5] Setting EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID..."
eas env:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "831631933144-rts5sthfdgqv85f7ft9jceng7cr6plnq.apps.googleusercontent.com" --environment development

echo "[5/5] Setting EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID..."
eas env:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "831631933144-badi6u4e3q9ivuecoro4igft3qi203de.apps.googleusercontent.com" --environment development

echo ""
echo "✅ All environment variables have been set!"
echo ""
echo "Now you can run: eas build --profile development --platform android"
