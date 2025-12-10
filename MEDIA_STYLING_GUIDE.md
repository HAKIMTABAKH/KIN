# Media Message Styling Guide

## How Media Messages Appear

### ✅ Image/Video Only (No Bubble)
When you send just an image or video with no text:
```
┌─────────────────┐
│                 │
│     IMAGE       │  ← No background bubble
│                 │     Just the media
└─────────────────┘
  11:30 PM
```

### ✅ Image/Video + Text (Separate Bubble)
When you send media with a caption:
```
┌─────────────────┐
│                 │
│     IMAGE       │  ← No bubble on media
│                 │
└─────────────────┘
┌─────────────────┐
│  Caption text   │  ← Bubble only for text
└─────────────────┘
  11:30 PM
```

### ✅ Text Only (Normal Bubble)
Regular text messages:
```
┌─────────────────┐
│  Hello there!   │  ← Normal bubble
└─────────────────┘
  11:30 PM
```

### ✅ Emoji Only (No Bubble)
Emoji messages:
```
  😊 👍 🎉          ← No bubble
  11:30 PM
```

## Visual Comparison

### Before (Wrong) ❌
```
┌─────────────────────┐
│ ┌───────────────┐   │  ← Bubble around media
│ │               │   │
│ │    IMAGE      │   │
│ │               │   │
│ └───────────────┘   │
└─────────────────────┘
```

### After (Correct) ✅
```
┌───────────────┐
│               │
│    IMAGE      │      ← No bubble, clean media
│               │
└───────────────┘
```

## Implementation Details

### Media-Only Messages
- **No background color**
- **No padding**
- **No border**
- Just the rounded media (240x180px)

### Media + Text Messages
- **Media**: No bubble, transparent background
- **Text**: Separate bubble below media
- **Spacing**: 8px gap between media and text bubble

### Styling Logic
```typescript
// Bubble container
className={`
  ${onlyEmojis || hasMedia ? 'bg-transparent px-0 py-0' : 'px-4 py-3 rounded-2xl'}
  ${!hasMedia && isMe ? 'bg-kin-amber' : ''}
  ${!hasMedia && !isMe ? 'bg-kin-midnight border border-kin-slate' : ''}
`}

// Text with media gets its own bubble
{hasMedia && item.content && (
  <View className={`mt-2 px-4 py-3 rounded-2xl ${isMe ? 'bg-kin-amber' : 'bg-kin-midnight'}`}>
    <Text>{item.content}</Text>
  </View>
)}
```

## Result

Media messages now look like Instagram/WhatsApp:
- Clean, standalone images/videos
- No colored bubble around media
- Text captions get their own bubble below
- Professional, modern appearance
