
const getNextAvailableDate = (dayName, startTime) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const targetIdx = days.indexOf(dayName);
  const todayIdx = now.getDay();
  
  if (targetIdx === -1) return 'Invalid Day';

  let diff = targetIdx - todayIdx;
  let addedWeek = false;

  if (diff < 0) {
    diff += 7;
    addedWeek = true;
  } else if (diff === 0 && startTime) {
    const [h, m] = startTime.split(':').map(Number);
    const slotTime = new Date();
    slotTime.setHours(h, m, 0, 0);

    if (now > slotTime) {
      diff += 7;
      addedWeek = true;
    }
  }

  const nextDate = new Date();
  nextDate.setDate(now.getDate() + diff);
  return `${dayName} -> ${nextDate.toDateString()} (Diff: ${diff}, AddedWeek: ${addedWeek})`;
};

console.log("Current System Time:", new Date().toString());
console.log("--- Testing All Days ---");
['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(day => {
    console.log(getNextAvailableDate(day, '12:00')); // Midday test
});
