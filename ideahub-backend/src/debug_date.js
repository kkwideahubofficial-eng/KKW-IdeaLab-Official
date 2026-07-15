
const getNextAvailableDate = (dayName, startTime) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const targetIdx = days.indexOf(dayName);
  const todayIdx = now.getDay();

  console.log(`Debug: Checking ${dayName}. TargetIdx: ${targetIdx}, TodayIdx: ${todayIdx}`);

  if (targetIdx === -1) return '';

  let diff = targetIdx - todayIdx;

  if (diff < 0) {
    console.log(`Debug: Day passed this week. Adding 7 days.`);
    diff += 7;
  } else if (diff === 0 && startTime) {
    const [h, m] = startTime.split(':').map(Number);
    const slotTime = new Date();
    slotTime.setHours(h, m, 0, 0);

    console.log(`Debug: Same day. Now: ${now.toLocaleTimeString()}, Slot: ${slotTime.toLocaleTimeString()}`);

    if (now > slotTime) {
      console.log(`Debug: Time passed. Adding 7 days.`);
      diff += 7;
    }
  }

  const nextDate = new Date();
  nextDate.setDate(now.getDate() + diff);
  return nextDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// Test cases assuming Today is Sunday (Jan 4th)
console.log("system time:", new Date().toString());
console.log("Sunday (Future Time):", getNextAvailableDate('Sunday', '23:59'));
console.log("Sunday (Past Time):", getNextAvailableDate('Sunday', '00:01'));
console.log("Monday:", getNextAvailableDate('Monday', '10:00'));
console.log("Saturday:", getNextAvailableDate('Saturday', '10:00'));
