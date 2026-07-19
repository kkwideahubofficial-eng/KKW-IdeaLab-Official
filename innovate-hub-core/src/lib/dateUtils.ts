export const getNextAvailableDate = (dayName: string, startTime?: string): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const targetIdx = days.indexOf(dayName);
  const todayIdx = now.getDay();

  if (targetIdx === -1) return '';

  let diff = targetIdx - todayIdx;

  if (diff < 0) {
    // If the day has already passed this week (e.g. it's Wed, target is Mon), show next week's
    diff += 7;
  } else if (diff === 0 && startTime) {
    // If it's today, check if the time has passed
    const [h, m] = startTime.split(':').map(Number);
    // Add a small buffer (e.g. 15 mins) or strict check? 
    // Let's say if current time > startTime, then it's missed.
    const slotTime = new Date();
    slotTime.setHours(h, m, 0, 0);

    if (now > slotTime) {
      // Time passed, move to next week
      diff += 7;
    }
  }

  const nextDate = new Date();
  nextDate.setDate(now.getDate() + diff);
  return nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const formatTime12Hour = (time24: string): string => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 -> 12
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};
