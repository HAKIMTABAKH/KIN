import * as Linking from 'expo-linking';
import { Text, TextStyle } from 'react-native';

// URL regex pattern
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;

type LinkTextProps = {
  children: string;
  style?: TextStyle;
  className?: string;
  linkColor?: string;
};

type TextPart = {
  text: string;
  isLink: boolean;
};

export default function LinkText({ 
  children, 
  style, 
  className,
  linkColor = '#3B82F6' // Default blue color for links
}: LinkTextProps) {
  if (!children) return null;

  // Parse text to find URLs
  const parseText = (text: string): TextPart[] => {
    const parts: TextPart[] = [];
    let lastIndex = 0;
    let match;

    // Reset regex
    URL_REGEX.lastIndex = 0;

    while ((match = URL_REGEX.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push({
          text: text.slice(lastIndex, match.index),
          isLink: false
        });
      }

      // Add the link
      parts.push({
        text: match[0],
        isLink: true
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last link
    if (lastIndex < text.length) {
      parts.push({
        text: text.slice(lastIndex),
        isLink: false
      });
    }

    return parts;
  };

  const handleLinkPress = async (url: string) => {
    try {
      // Add https:// if URL starts with www.
      let finalUrl = url;
      if (url.startsWith('www.')) {
        finalUrl = 'https://' + url;
      }
      
      const canOpen = await Linking.canOpenURL(finalUrl);
      if (canOpen) {
        await Linking.openURL(finalUrl);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const parts = parseText(children);

  // If no links found, return simple text
  if (parts.length === 1 && !parts[0].isLink) {
    return (
      <Text style={style} className={className}>
        {children}
      </Text>
    );
  }

  return (
    <Text style={style} className={className}>
      {parts.map((part, index) => {
        if (part.isLink) {
          return (
            <Text
              key={index}
              style={{ color: linkColor, textDecorationLine: 'underline' }}
              onPress={() => handleLinkPress(part.text)}
            >
              {part.text}
            </Text>
          );
        }
        return <Text key={index}>{part.text}</Text>;
      })}
    </Text>
  );
}
