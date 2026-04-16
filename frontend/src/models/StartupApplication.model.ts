import mongoose, { Document, Model } from 'mongoose';

export interface IStartupApplication extends Document {
  user?: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  businessType: string;
  selectedKit: mongoose.Types.ObjectId;
  budget?: string;
  message?: string;
  status: 'pending' | 'contacted' | 'approved' | 'rejected' | 'completed';
  adminNotes: string;
}

const startupApplicationSchema = new mongoose.Schema<IStartupApplication>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String, required: [true, 'Full name is required'] },
    phone: { type: String, required: [true, 'Phone is required'] },
    email: { type: String, required: [true, 'Email is required'] },
    city: { type: String, required: true },
    state: { type: String, required: true },
    businessType: { type: String, required: true },
    selectedKit: { type: mongoose.Schema.Types.ObjectId, ref: 'StartupKit', required: true },
    budget: { type: String },
    message: { type: String },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

const StartupApplication: Model<IStartupApplication> =
  mongoose.models.StartupApplication ||
  mongoose.model<IStartupApplication>('StartupApplication', startupApplicationSchema);
export default StartupApplication;
