# Testing Checklist for Android Device

## Pre-Testing Setup

- [ ] Phone connected via USB
- [ ] USB Debugging enabled
- [ ] Expo Go installed (for Method 1) OR Development APK installed (for Method 2)
- [ ] `.env.local` file has correct Supabase credentials

---

## 🔐 Authentication Tests

- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Sign out
- [ ] Stay signed in after app restart

---

## 👥 People/Social Tests

### Friends
- [ ] View friend suggestions (Discover tab)
- [ ] Send friend request
- [ ] Accept friend request
- [ ] Decline friend request
- [ ] View friends list
- [ ] Unfriend user
- [ ] Block user

### Caching
- [ ] Navigate to People tab → Chat tab → back to People
- [ ] Check if data loads instantly (no spinner)
- [ ] Pull to refresh works

---

## 💬 Chat Tests

### Chat List
- [ ] View all chat rooms
- [ ] See online friends rail at top
- [ ] Tap friend to start new chat
- [ ] Long press room to see options menu
- [ ] Delete chat room

### Chat Room
- [ ] Send text message
- [ ] Send emoji
- [ ] Send image from gallery
- [ ] Send image from camera
- [ ] Send video
- [ ] Reply to message
- [ ] React to message (emoji)
- [ ] Delete own message
- [ ] Long press on text message (menu appears)
- [ ] Long press on media (menu appears) ✨ NEW FIX
- [ ] See typing indicator when other user types
- [ ] See "Seen" status on messages
- [ ] Scroll to bottom button appears when scrolling up

### Caching Tests
- [ ] Open chat room → go back → reopen same chat
- [ ] Messages load instantly (no spinner)
- [ ] Header shows correct name immediately (no "Chat" flash) ✨ NEW FIX
- [ ] Messages appear on correct side (no left/right flash) ✨ NEW FIX

### Realtime Tests
- [ ] Send message from another device/browser
- [ ] Message appears instantly in app
- [ ] Reactions update in real-time
- [ ] Typing indicator shows in real-time

---

## 🖼️ Media Viewer Tests

- [ ] Tap image to open viewer
- [ ] Tap video to open viewer
- [ ] Swipe between multiple media items
- [ ] Pinch to zoom
- [ ] Double tap to zoom
- [ ] Swipe down to close
- [ ] Download media
- [ ] Reply to media
- [ ] Media gallery loads instantly on reopen ✨ NEW FIX

---

## 👤 Profile Tests

- [ ] View own profile
- [ ] View other user's profile
- [ ] See friend count (correct number) ✨ NEW FIX
- [ ] Edit profile (if implemented)
- [ ] Navigate to settings

---

## ⚡ Performance Tests

### Navigation Speed
- [ ] Switch between tabs (Feed, Chats, People, Profile)
- [ ] All tabs load instantly with cached data ✨ NEW FIX
- [ ] No loading spinners on cached data

### Scroll Performance
- [ ] Scroll through long message list (smooth, no lag)
- [ ] Scroll through friends list
- [ ] Scroll through chat rooms list

### Memory
- [ ] Open 5+ different chat rooms
- [ ] Navigate between them multiple times
- [ ] App doesn't slow down or crash

---

## 📶 Offline/Network Tests

- [ ] Turn off WiFi/data
- [ ] Open app - cached data still visible
- [ ] Try to send message - shows error or pending
- [ ] Turn on WiFi/data
- [ ] Messages sync automatically

---

## 🐛 Bug Checks

### Fixed Issues to Verify
- [ ] ✅ No double fetching of messages
- [ ] ✅ No race condition (messages on wrong side)
- [ ] ✅ No "Chat" placeholder flash in header
- [ ] ✅ Long press works on media
- [ ] ✅ Friend count shows correctly
- [ ] ✅ No Reanimated warnings in console

### Common Issues to Watch For
- [ ] App crashes when opening chat
- [ ] Images don't load
- [ ] Videos don't play
- [ ] Keyboard covers input
- [ ] Back button doesn't work
- [ ] Notifications (if implemented)

---

## 🎨 UI/UX Tests

- [ ] All text is readable
- [ ] Colors look good (dark theme)
- [ ] Buttons are easy to tap
- [ ] Animations are smooth
- [ ] No UI elements overlap
- [ ] Safe area (notch/status bar) handled correctly

---

## 🔄 State Management Tests

- [ ] Send message → go to People tab → return to chat
- [ ] Message is still there
- [ ] Accept friend request → check Friends list
- [ ] Friend appears immediately
- [ ] Delete chat → check chat list
- [ ] Chat removed immediately

---

## 📱 Device-Specific Tests

- [ ] Rotate device (if rotation enabled)
- [ ] Minimize app → reopen (state preserved)
- [ ] Lock phone → unlock (app still works)
- [ ] Low battery mode (app still works)
- [ ] Incoming call (app handles gracefully)

---

## ✅ Final Checks

- [ ] No console errors in terminal
- [ ] No red error screens
- [ ] No yellow warning boxes
- [ ] App feels fast and responsive
- [ ] All React Query caching works as expected

---

## 📝 Notes

Use this space to note any issues found:

```
Issue 1: 
- Description:
- Steps to reproduce:
- Expected:
- Actual:

Issue 2:
- Description:
- Steps to reproduce:
- Expected:
- Actual:
```

---

## 🎉 Success Criteria

Your app is ready for production if:
- ✅ All core features work
- ✅ No crashes or freezes
- ✅ Navigation is instant with caching
- ✅ Realtime updates work
- ✅ Media upload/download works
- ✅ UI looks good and is responsive
- ✅ No major bugs found

---

## Next Steps After Testing

1. **Fix any bugs found**
2. **Optimize performance issues**
3. **Add missing features**
4. **Build production APK**
5. **Share with beta testers**
6. **Publish to Google Play Store**

Good luck with testing! 🚀
