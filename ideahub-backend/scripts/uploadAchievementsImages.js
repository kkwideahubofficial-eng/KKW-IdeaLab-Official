import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import Achievement from '../src/models/Achievement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImagesAndUpdateDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB!');

    const img1Path = path.join(__dirname, '../uploads/achievement_win_1.png');
    const img2Path = path.join(__dirname, '../uploads/achievement_win_2.png');

    console.log('Uploading image 1 to Cloudinary...');
    const result1 = await cloudinary.uploader.upload(img1Path, {
      folder: 'ideahub/achievements',
    });
    console.log('Image 1 uploaded:', result1.secure_url);

    console.log('Uploading image 2 to Cloudinary...');
    const result2 = await cloudinary.uploader.upload(img2Path, {
      folder: 'ideahub/achievements',
    });
    console.log('Image 2 uploaded:', result2.secure_url);

    console.log('Updating database entries with Cloudinary URLs...');
    
    // Update documents that use /uploads/achievement_win_1.png
    const update1 = await Achievement.updateMany(
      { imageUrl: '/uploads/achievement_win_1.png' },
      { $set: { imageUrl: result1.secure_url } }
    );
    console.log(`Updated ${update1.modifiedCount} achievements with image 1.`);

    // Update documents that use /uploads/achievement_win_2.png
    const update2 = await Achievement.updateMany(
      { imageUrl: '/uploads/achievement_win_2.png' },
      { $set: { imageUrl: result2.secure_url } }
    );
    console.log(`Updated ${update2.modifiedCount} achievements with image 2.`);

    console.log('Finished updating Cloudinary URLs successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error in upload script:', error);
    process.exit(1);
  }
};

uploadImagesAndUpdateDB();
