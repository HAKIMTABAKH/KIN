// Helper: Check if two dates are on the same day
export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

// Helper: Format the separator text
export const getSeparatorText = (currentDate: Date, previousDate: Date | null) => {
  const now = new Date();
  const isToday = isSameDay(currentDate, now);
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = isSameDay(currentDate, yesterday);
  
  // 1. If it's the very first message ever (no previous), show Date
  if (!previousDate) {
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return currentDate.toLocaleDateString([], { day: 'numeric', month: 'short' });
  }

  // 2. If Day changed
  if (!isSameDay(currentDate, previousDate)) {
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return currentDate.toLocaleDateString([], { day: 'numeric', month: 'short' });
  }

  // 3. If Same Day but > 3 Hours gap (10800000 ms)
  const timeDiff = currentDate.getTime() - previousDate.getTime();
  if (timeDiff > 3 * 60 * 60 * 1000) {
    const timeString = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return isToday ? `Today ${timeString}` : timeString;
  }

  return null; // No separator needed
};
