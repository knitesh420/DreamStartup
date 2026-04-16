import mongoose, { Document, Model } from 'mongoose';

export interface IServiceProviderProfile extends Document {
  user: mongoose.Types.ObjectId;
  profession: 'carpenter' | 'electrician' | 'plumber';
  experienceYears: number;
  serviceAreas: string[];
  skills: string[];
  aadhaarNumber?: string;
  isApproved: boolean;
  commissionRate: number;
  earnings: number;
  available: boolean;
}

const providerSchema = new mongoose.Schema<IServiceProviderProfile>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    profession: { type: String, required: true, enum: ['carpenter', 'electrician', 'plumber'] },
    experienceYears: { type: Number, default: 0 },
    serviceAreas: [{ type: String }],
    skills: [{ type: String }],
    aadhaarNumber: { type: String },
    isApproved: { type: Boolean, default: false },
    commissionRate: { type: Number, default: 10 },
    earnings: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ServiceProviderProfile: Model<IServiceProviderProfile> =
  mongoose.models.ServiceProviderProfile ||
  mongoose.model<IServiceProviderProfile>('ServiceProviderProfile', providerSchema);
export default ServiceProviderProfile;
