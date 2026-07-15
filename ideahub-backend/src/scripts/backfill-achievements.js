import dotenv from 'dotenv';
import { connectToDatabase } from '../config/db.js';
import Achievement from '../models/Achievement.js';

dotenv.config();

function deriveEventYear(dateValue) {
  if (!dateValue) return undefined;

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return undefined;

  return parsedDate.getFullYear();
}

async function run() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }

  await connectToDatabase(mongoUri);

  const achievements = await Achievement.find({
    $or: [
      { eventYear: { $exists: false } },
      { eventYear: null },
    ],
  }).select('_id date eventYear');

  let updatedCount = 0;

  for (const achievement of achievements) {
    const eventYear = deriveEventYear(achievement.date);

    if (!eventYear) continue;

    achievement.eventYear = eventYear;
    await achievement.save();
    updatedCount += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Backfilled eventYear for ${updatedCount} achievement record(s).`);
}

run()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Achievement backfill completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Achievement backfill failed:', error);
    process.exit(1);
  });