import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

const regSchema = new mongoose.Schema({}, { strict: false });
const EventRegistration = mongoose.model('EventRegistration', regSchema, 'eventregistrations');

const notifSchema = new mongoose.Schema({}, { strict: false });
const EventNotification = mongoose.model('EventNotification', notifSchema, 'eventnotifications');

async function checkSpecificUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const searchTerms = ['Sarthak Sarnaik', 'Ganesh Sarde', 'Ganesh '];
  
  console.log("--- Checking Event Registrations ---");
  for (const term of searchTerms) {
    const regs = await EventRegistration.find({
      $or: [
        { 'teamName': { $regex: term, $options: 'i' } },
        { 'teamMembers.fullName': { $regex: term, $options: 'i' } }
      ]
    }).sort({updatedAt: -1});
    
    regs.forEach(r => {
      const leader = r.teamMembers.find(m => m.isTeamLeader) || r.teamMembers[0];
      console.log(`\nFound Registration for: ${term}`);
      console.log(`- Registration ID: ${r.registrationId}`);
      console.log(`- Status: ${r.status}`);
      console.log(`- Student/Leader Name: ${leader.fullName}`);
      console.log(`- Student Email: ${leader.email}`);
      console.log(`- Student Phone: ${leader.mobile}`);
      console.log(`- Student ID in DB: ${r.student}`);
    });
  }
  
  console.log("\n--- Checking In-App Notifications ---");
  for (const term of searchTerms) {
    const regs = await EventRegistration.find({
      $or: [
        { 'teamName': { $regex: term, $options: 'i' } },
        { 'teamMembers.fullName': { $regex: term, $options: 'i' } }
      ]
    }).sort({updatedAt: -1}).limit(1);
    
    if (regs.length > 0) {
      const notifs = await EventNotification.find({ user: regs[0].student }).sort({createdAt: -1}).limit(3);
      console.log(`\nRecent notifications for ${term} (User ID: ${regs[0].student}):`);
      notifs.forEach(n => {
        console.log(`- Title: ${n.title}`);
        console.log(`- Type: ${n.type}`);
        console.log(`- CreatedAt: ${n.createdAt}`);
      });
    }
  }

  process.exit(0);
}

checkSpecificUsers();
