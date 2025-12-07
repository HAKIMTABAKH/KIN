// components/ProfileTabIcon.tsx

import React from 'react';
import { ActivityIndicator, Image, View } from 'react-native';
import { useUser } from '../context/UserContext'; // Import the hook

// Define the props for the component
interface ProfileTabIconProps {
  color: string;
  size: number;
}

const ProfileTabIcon = ({ color, size }: ProfileTabIconProps) => {
  const { profile, loading } = useUser();

  // While the profile is loading, show a spinner or placeholder
  if (loading) {
    return <ActivityIndicator size="small" color={color} />;
  }

  // If there's no profile (user not logged in), show a default icon
  if (!profile) {
    // You can import and use your default User icon here
    // return <User color={color} size={size} />;
    return <View className="w-8 h-8 bg-gray-500 rounded-full" />; // Simple placeholder
  }

  // If the profile exists, show the user's avatar
  return (
    <Image
      source={{ uri: profile.avatar_url || 'https://i.pravatar.cc/150' }}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color, // Uses the active/inactive color from tab bar
      }}
    />
  );
};

export default ProfileTabIcon;