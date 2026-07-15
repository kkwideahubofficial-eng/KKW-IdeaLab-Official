import dotenv from 'dotenv';
import { connectToDatabase } from '../config/db.js';
import Achievement from '../models/Achievement.js';

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }

  await connectToDatabase(mongoUri);

  const indexes = await Achievement.createIndexes();
  // eslint-disable-next-line no-console
  console.log('Achievement indexes ensured:', indexes);
}

run()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Achievement migration completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Achievement migration failed:', error);
    process.exit(1);
  });