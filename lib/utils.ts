import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind utility for merging class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Note: Authentication utilities are in lib/auth.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

const WELCOME_SHOWN_KEY = '@kin_welcome_shown';

// Check if welcome screen has been shown
export async function hasSeenWelcome(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(WELCOME_SHOWN_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking welcome status:', error);
    return false;
  }
}

// Mark welcome screen as shown
export async function markWelcomeShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(WELCOME_SHOWN_KEY, 'true');
  } catch (error) {
    console.error('Error marking welcome as shown:', error);
  }
}

// Reset welcome screen (for testing)
export async function resetWelcome(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WELCOME_SHOWN_KEY);
  } catch (error) {
    console.error('Error resetting welcome:', error);
  }
}