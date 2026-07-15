import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import Achievement from '../src/models/Achievement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCertificate = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB!');

    const certPath = path.join(__dirname, '../uploads/achievement_certificate.png');

    console.log('Uploading certificate to Cloudinary...');
    const result = await cloudinary.uploader.upload(certPath, {
      folder: 'ideahub/certificates',
    });
    console.log('Certificate uploaded:', result.secure_url);

    console.log('Updating database entries with the certificate...');
    
    // Add certificate to all achievements
    const achievements = await Achievement.find({});
    let updatedCount = 0;
    
    for (const ach of achievements) {
      ach.certificates = [
        {
          title: "Winner Certificate",
          achievedBy: ach.achievedBy,
          date: ach.date,
          fileUrl: result.secure_url
        }
      ];
      await ach.save();
      updatedCount++;
    }

    console.log(`Updated ${updatedCount} achievements with the certificate.`);
    process.exit(0);
  } catch (error) {
    console.error('Error in upload certificate script:', error);
    process.exit(1);
  }
};

uploadCertificate();
