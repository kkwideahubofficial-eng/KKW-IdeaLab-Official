import mongoose from 'mongoose';

const conductedEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  category: { type: String, default: 'Event' },
  participants: { type: String, default: '100+ Participants' },
  description: { type: String, required: true },
  image: { type: String, required: true }
}, { timestamps: true });

const studentClubSchema = new mongoose.Schema({
  clubId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  fullTitle: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Technical', 'Design', 'Entrepreneurship', 'Cultural', 'Innovation'], 
    default: 'Technical' 
  },
  accentColor: { type: String, default: '#2563EB' },
  icon: { type: String, default: '💻' },
  logoUrl: { type: String, default: '' },
  members: { type: Number, default: 100 },
  established: { type: String, default: 'Since 2022' },
  description: { type: String, required: true },
  about: { type: String, required: true },
  facultyCoordinator: {
    name: { type: String, required: true },
    designation: { type: String, default: 'Faculty Coordinator' },
    department: { type: String, required: true }
  },
  studentLead: {
    name: { type: String, required: true },
    role: { type: String, default: 'President' },
    department: { type: String, required: true }
  },
  activities: [{ type: String }],
  achievements: [{ type: String }],
  conductedEvents: [conductedEventSchema],
  gallery: [{ type: String }],
  socialLinks: {
    linkedin: { type: String, default: '' },
    instagram: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    contactNo: { type: String, default: '' },
    email: { type: String, default: '' }
  },
  isFeatured: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const StudentClub = mongoose.models.StudentClub || mongoose.model('StudentClub', studentClubSchema);

export default StudentClub;
