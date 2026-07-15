import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Achievement from '../src/models/Achievement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const achievementsData = [
  {
    title: "PICT’s Tech Fiesta 2025",
    description: "Winners at PICT’s Tech Fiesta 2025. Project Guided by Dr. D. V. Medhane. Used 3D Printer, CO2 Laser Machine.",
    date: new Date("2025-12-01"),
    achievedBy: "IdeationX (Prasad Patil, Tejas Deshmukh, Saniya Bhosale, Swadesh Jadhav, Divya Bhavsar)",
    imageUrl: "/uploads/achievement_win_1.png",
    prizeAmount: 100000,
    eventYear: 2025,
    achievementType: "Competition",
    contributionDomain: "IT",
    competitionLevel: "National",
    teamSize: 5,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true }
  },
  {
    title: "SAEISS Dr G Padmanabhan Memorial Electric Two Wheeler Design Competition 2025",
    description: "Winners. Project Guided by Prof. G. N. Jadhav. Used 3D Printer, CO2 Laser Machine, Power Tool, Hand Grinder, Heat Gun.",
    date: new Date("2025-12-15"),
    achievedBy: "Nikola (Electrical)",
    imageUrl: "/uploads/achievement_win_2.png",
    prizeAmount: 15000,
    eventYear: 2025,
    achievementType: "Competition",
    contributionDomain: "Electrical",
    competitionLevel: "National",
    teamSize: 5,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, testingFacility: true }
  },
  {
    title: "AIR 5 Racing Competition 2025",
    description: "Secured AIR 5. Project Guided by Prof. P. B. Surwade. Used 3D Printer, CO2 Laser Machine, Power Tool, Hand Grinder, Heat Gun.",
    date: new Date("2025-10-30"),
    achievedBy: "Nemesis (Mechanical)",
    imageUrl: "/uploads/achievement_win_1.png",
    prizeAmount: 20000,
    eventYear: 2025,
    achievementType: "Competition",
    contributionDomain: "Mechanical",
    competitionLevel: "National",
    teamSize: 5,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, workspaceProvided: true }
  },
  {
    title: "Smart India Hackathon 2025",
    description: "Winners at Smart India Hackathon. Project Guided by Prof. S.T. Patil. Used 3D Printer, CO2 Laser Machine, Power Tool, Hand Grinder, Heat Gun.",
    date: new Date("2025-12-10"),
    achievedBy: "Shrujamya (Computer)",
    imageUrl: "/uploads/achievement_win_2.png",
    prizeAmount: 150000,
    eventYear: 2025,
    achievementType: "Hackathon",
    contributionDomain: "Computer Science",
    competitionLevel: "National",
    teamSize: 6,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, workspaceProvided: true }
  },
  {
    title: "Smart India Hackathon 2025",
    description: "Winners at Smart India Hackathon. Project Guided by Prof. P.Jadhav. Used 3D Printer, CO2 Laser Machine, Power Tool, Hand Grinder, Heat Gun.",
    date: new Date("2025-12-10"),
    achievedBy: "TwinX (E&rc)",
    imageUrl: "/uploads/achievement_win_1.png",
    prizeAmount: 150000,
    eventYear: 2025,
    achievementType: "Hackathon",
    contributionDomain: "E&TC",
    competitionLevel: "National",
    teamSize: 6,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, workspaceProvided: true }
  },
  {
    title: "Smart India Hackathon 2025",
    description: "Winners at Smart India Hackathon. Project Guided by Prof. P. D. Rakibe. Used 3D Printer, CO2 Laser Machine, Power Tool, Hand Grinder, Heat Gun.",
    date: new Date("2025-12-10"),
    achievedBy: "Sahastransh (Computer)",
    imageUrl: "/uploads/achievement_win_2.png",
    prizeAmount: 15000,
    eventYear: 2025,
    achievementType: "Hackathon",
    contributionDomain: "Computer Science",
    competitionLevel: "National",
    teamSize: 6,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, workspaceProvided: true }
  },
  {
    title: "Smart India Hackathon 2025",
    description: "Winners at Smart India Hackathon. Project Guided by Prof. Neha Patil / Prof. Rohini Daund. Used 3D Printer, CO2 Laser Machine, Power Tool, Hand Grinder, Heat Gun.",
    date: new Date("2025-12-10"),
    achievedBy: "Agratas (E&Tc)",
    imageUrl: "/uploads/achievement_win_1.png",
    prizeAmount: 75000,
    eventYear: 2025,
    achievementType: "Hackathon",
    contributionDomain: "E&TC",
    competitionLevel: "National",
    teamSize: 6,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, workspaceProvided: true }
  },
  {
    title: "Smart India Hackathon 2025",
    description: "Winners at Smart India Hackathon. Project Guided by Prof. Neha Patil / Prof. Rohini Daund. Used 3D Printer, CO2 Laser Machine, Power Tool, Hand Grinder, Heat Gun.",
    date: new Date("2025-12-10"),
    achievedBy: "CableSense (E&TC)",
    imageUrl: "/uploads/achievement_win_2.png",
    prizeAmount: 150000,
    eventYear: 2025,
    achievementType: "Hackathon",
    contributionDomain: "E&TC",
    competitionLevel: "National",
    teamSize: 6,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, workspaceProvided: true }
  },
  {
    title: "Smart India Hackathon 2025",
    description: "Winners at Smart India Hackathon. Project Guided by Prof. P.L.Patil (IT). Used 3D Printer, CO2 Laser Machine, Power Tool, Hand Grinder, Heat Gun.",
    date: new Date("2025-12-10"),
    achievedBy: "AquacredZ (IT)",
    imageUrl: "/uploads/achievement_win_1.png",
    prizeAmount: 150000,
    eventYear: 2025,
    achievementType: "Hackathon",
    contributionDomain: "IT",
    competitionLevel: "National",
    teamSize: 6,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, workspaceProvided: true }
  },
  {
    title: "SAEISS Dr G Padmanabhan Memorial Electric Two Wheeler Design Competition 2026",
    description: "Winners. Project Guided by Prof. G. N. Jadhav. Used 3D Printer, CO2 Laser Machine, Power Tool, Hand Grinder, Heat Gun.",
    date: new Date("2026-03-07"),
    achievedBy: "Nikola Racing (Electrical)",
    imageUrl: "/uploads/achievement_win_2.png",
    prizeAmount: 7000,
    eventYear: 2026,
    achievementType: "Competition",
    contributionDomain: "Electrical",
    competitionLevel: "National",
    teamSize: 5,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, workspaceProvided: true }
  },
  {
    title: "Toykathon 2026",
    description: "Winners at Toykathon 2026. Project Guided by Dr. S. P. Ugale. Used 3D Printer, CO2 Laser Machine, Power Tool, Hand Grinder, Heat Gun.",
    date: new Date("2026-03-27"),
    achievedBy: "Spirit (Atharva Mayekar, Harshvardhan Shah, Kanad Buwa, Pranav Nikhade, Shubham Jadhav, Sahil Nerpagar)",
    imageUrl: "/uploads/achievement_win_1.png",
    prizeAmount: 10000,
    eventYear: 2026,
    achievementType: "Hackathon",
    contributionDomain: "E&TC",
    competitionLevel: "National",
    teamSize: 6,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, workspaceProvided: true }
  },
  {
    title: "Ulectra 2026",
    description: "Winners at Ulectra 2026. Project Guided by Dr. S. P. Ugale. Used 3D Printer, CO2 Laser Machine, Power Tool, Hand Grinder, Heat Gun.",
    date: new Date("2026-04-13"),
    achievedBy: "Spirit (Atharva Mayekar, Harshvardhan Shah, Kanad Buwa, Pranotee Pabale, Srushti Kothavade)",
    imageUrl: "/uploads/achievement_win_2.png",
    prizeAmount: 50000,
    eventYear: 2026,
    achievementType: "Competition",
    contributionDomain: "E&TC",
    competitionLevel: "National",
    teamSize: 5,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, workspaceProvided: true }
  },
  {
    title: "Unplugged 2026",
    description: "Winners at Unplugged 2026. Participated actively using AICTE IDEA Lab facilities.",
    date: new Date("2026-04-11"),
    achievedBy: "Pixel Mind (Atharva Mayekar, Pranav Nikhade, Shubham Jadhav, Abhishek Pathare)",
    imageUrl: "/uploads/achievement_win_1.png",
    prizeAmount: 15000,
    eventYear: 2026,
    achievementType: "Competition",
    contributionDomain: "E&TC",
    competitionLevel: "National",
    teamSize: 4,
    ideaHubContributions: { dPrintingSupport: true, prototypeDevelopment: true, workspaceProvided: true }
  }
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    console.log('Clearing old achievements...');
    await Achievement.deleteMany({});
    
    console.log(`Seeding ${achievementsData.length} achievements...`);
    await Achievement.insertMany(achievementsData);

    console.log('Achievements seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDB();
