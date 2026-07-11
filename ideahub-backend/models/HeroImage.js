import mongoose from 'mongoose';

const heroImageSchema = new mongoose.Schema({
  secure_url: {
    type: String,
    required: true,
  },
  public_id: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const HeroImage = mongoose.model('HeroImage', heroImageSchema);

export default HeroImage;
