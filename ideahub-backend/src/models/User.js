import mongoose from 'mongoose';

const { Schema } = mongoose;

const roles = ['team', 'coordinator', 'head', 'delivery_boy', 'admin'];

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: roles,
      default: 'team',
      required: true,
      index: true,
    },
    teamName: {
      type: String,
      trim: true,
      default: '',
    },
    mobile: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: String,
      enum: ['FE', 'SE', 'TE', 'BE', ''], // Allow empty string for initial state
      default: '',
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    userType: {
      type: String,
      enum: ['INTERNAL', 'EXTERNAL'],
      required: true,
      default: 'INTERNAL',
    },
    prn: {
      type: String,
      trim: true,
      default: '',
    },
    division: {
      type: String,
      trim: true,
      default: '',
    },
    externalMobile: {
      type: String,
      trim: true,
      default: '',
    },
    externalCollegeOrg: {
      type: String,
      trim: true,
      default: '',
    },
    externalDept: {
      type: String,
      trim: true,
      default: '',
    },
    externalCity: {
      type: String,
      trim: true,
      default: '',
    },
    externalState: {
      type: String,
      trim: true,
      default: '',
    },
    externalIdentityProof: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Pre-save middleware to automatically calculate/recalculate userType based on email domain
userSchema.pre('save', function (next) {
  if (this.isModified('email')) {
    const domain = process.env.INTERNAL_EMAIL_DOMAIN || 'kkwagh.edu.in';
    const emailStr = this.email || '';
    this.userType = emailStr.toLowerCase().endsWith('@' + domain.toLowerCase()) ? 'INTERNAL' : 'EXTERNAL';
  }
  next();
});

// unique: true on the schema is sufficient for the email field;
// no need to declare a separate index to avoid duplicate index warnings.

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;

