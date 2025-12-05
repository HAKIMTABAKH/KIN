# Welcome Screen Implementation

## Overview
A beautiful onboarding screen that appears only on the first app launch.

## Features

### Welcome Screen (`app/welcome.tsx`)
- Shows a logo/illustration (🏠 emoji in a circular amber background)
- App name and tagline
- Two action buttons:
  1. **Continue with Google** - Direct Google OAuth sign-in
  2. **Continue with Email** - Redirects to sign-in page (with sign-up link available)
- Privacy policy note at the bottom

### Flow Logic
1. **First Launch**: User sees welcome screen
2. **After Welcome**: 
   - Google button → Signs in immediately
   - Email button → Goes to sign-in page (can navigate to sign-up from there)
3. **Subsequent Launches**: Welcome screen is skipped, goes directly to auth check

### Storage
Uses AsyncStorage to track if welcome has been shown:
- Key: `@kin_welcome_shown`
- Value: `'true'` after first interaction

## Utility Functions (lib/utils.ts)

```typescript
hasSeenWelcome()      // Check if welcome was shown
markWelcomeShown()    // Mark welcome as shown
resetWelcome()        // Reset for testing
```

## Testing the Welcome Screen

### To see it again:
1. Clear app data/storage
2. Or use the `resetWelcome()` function in code

### Quick test in Profile screen:
Add this button temporarily:

```tsx
import { resetWelcome } from '@/lib/utils';

// In your component:
<TouchableOpacity 
  onPress={async () => {
    await resetWelcome();
    Alert.alert('Success', 'Welcome screen reset! Sign out to see it again.');
  }}
  className="bg-kin-midnight h-14 rounded-2xl flex-row justify-center items-center mt-4"
>
  <Text className="text-kin-mist font-outfit-bold text-base">Reset Welcome Screen</Text>
</TouchableOpacity>
```

## Customization

### Change the logo:
Replace the emoji in `app/welcome.tsx`:
```tsx
<Text className="text-6xl">🏠</Text>
```

Or use an image:
```tsx
<Image 
  source={require('../assets/images/logo.png')} 
  className="w-32 h-32"
  resizeMode="contain"
/>
```

### Change the text:
Edit the welcome message in `app/welcome.tsx`:
```tsx
<Text className="text-kin-white text-lg font-outfit-medium text-center px-4 leading-7">
  Your custom message here
</Text>
```

## Design Decisions

**Why email button goes to sign-in instead of sign-up?**
- Most users are returning users
- Sign-up link is prominently displayed on sign-in page
- Reduces decision fatigue on welcome screen
- Standard pattern used by major apps (Twitter, Instagram, etc.)
